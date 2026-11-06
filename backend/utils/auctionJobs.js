const Material     = require('../models/Material')
const Bid          = require('../models/Bid')
const Transaction  = require('../models/Transaction')
const { createNotification } = require('./notifications')
const { emitAuctionClosed } = require('./socket')

exports.closeExpiredAuctions = async () => {
  const now = new Date()

  // Find active auctions whose end time has passed
  const expiredMaterials = await Material.find({
    'auction.status': 'active',
    'auction.endTime': { $lte: now },
  })

  for (const material of expiredMaterials) {
    try {
      // Find highest bid
      const winningBid = await Bid.findOne({ material: material._id })
        .sort({ amount: -1 })
        .populate('bidder', 'name email businessName')

      if (!winningBid) {
        // No bids — close without winner
        material.auction.status = 'closed'
        material.auction.closedAt = now
        await material.save()
        continue
      }

      // Mark winner
      material.auction.status   = 'closed'
      material.auction.closedAt = now
      material.auction.winner   = winningBid.bidder._id
      material.auction.winningBid = winningBid._id
      await material.save()

      // Update bid statuses
      await Bid.updateMany({ material: material._id, _id: { $ne: winningBid._id } }, { status: 'lost' })
      await Bid.findByIdAndUpdate(winningBid._id, { status: 'won' })

      // Create transaction (amounts in paise — bidAmount is per-unit in paise, totalAmount = bidAmount * quantity)
      const totalAmount = winningBid.amount * material.quantity
      await Transaction.create({
        material:   material._id,
        buyer:      winningBid.bidder._id,
        seller:     material.seller,
        winningBid: winningBid._id,
        bidAmount:  winningBid.amount,
        quantity:   material.quantity,
        unit:       material.unit,
        totalAmount,
        paymentStatus: 'advance_pending',
        advanceStatus: 'pending',
        advancePercentage: 10, // default; admin can change via settings
      })

      // Notify winner
      await createNotification(
        winningBid.bidder._id,
        'auction_won',
        `Congratulations! Your bid of ₹${winningBid.amount.toLocaleString()} won the auction for ${material.name}.`,
        { materialId: material._id }
      )

      // Notify seller
      await createNotification(
        material.seller,
        'transaction',
        `Your auction for ${material.name} has closed. Winning bid: ₹${winningBid.amount.toLocaleString()}.`,
        { materialId: material._id }
      )

      // Notify other bidders
      const otherBidders = await Bid.find({
        material: material._id,
        bidder: { $ne: winningBid.bidder._id },
      }).distinct('bidder')

      for (const bidderId of otherBidders) {
        await createNotification(
          bidderId,
          'auction_lost',
          `The auction for ${material.name} has closed. Your bid was not selected.`,
          { materialId: material._id }
        )
      }

      // Emit real-time auction closed event
      emitAuctionClosed(material._id.toString(), {
        materialId:   material._id,
        status:       'closed',
        winningBid:   winningBid.amount,
        closedAt:     now,
      })

    } catch (err) {
      console.error(`Error closing auction for material ${material._id}:`, err.message)
    }
  }

  // Activate scheduled auctions whose start time has passed
  await Material.updateMany(
    { 'auction.status': 'scheduled', 'auction.startTime': { $lte: now } },
    { $set: { 'auction.status': 'active' } }
  )
}
