import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import {
  Search, Filter, TrendingUp, ShieldCheck, FileCheck,
  Bell, Package, BarChart3, CheckCircle2, ArrowRight,
  Truck, Globe, Award, Clock, Users
} from 'lucide-react'
import './InfoPage.css'

const BUYER_BENEFITS = [
  { icon: <ShieldCheck size={24} />, title: 'Verified Sellers Only', desc: 'Every seller on ScrapBazaar has undergone business KYC before listing any material. No fraudulent listings.' },
  { icon: <TrendingUp  size={24} />, title: 'Competitive Pricing', desc: 'Live bidding means you always pay the true market price — not an inflated or negotiated rate.' },
  { icon: <Search      size={24} />, title: 'Powerful Search & Filters', desc: 'Filter by category, grade, quantity, location and price range to find exactly what you need.' },
  { icon: <Globe       size={24} />, title: 'Pan-India Supply Network', desc: 'Access hundreds of verified sellers across all major industrial states from a single platform.' },
  { icon: <FileCheck   size={24} />, title: 'Digital Invoicing', desc: 'GST-ready invoices and complete purchase records available for every transaction.' },
  { icon: <BarChart3   size={24} />, title: 'Procurement Analytics', desc: 'Track your buying activity, expenditure and material sourcing with detailed dashboards.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Register & Get Verified', desc: 'Create your business account and submit your KYC documents. Approval typically takes 24–48 hours.' },
  { step: '02', title: 'Browse Available Materials', desc: 'Search through hundreds of verified scrap listings. Use filters to narrow by category, grade, quantity and location.' },
  { step: '03', title: 'Compare & Evaluate', desc: 'View detailed material photos, specifications, quantity, quality reports and seller credentials before bidding.' },
  { step: '04', title: 'Place Your Bid', desc: 'Submit a competitive bid amount. You can raise your bid at any time before the auction closes. Bidder identities remain anonymous during the auction.' },
  { step: '05', title: 'Win the Lot', desc: 'If your bid is selected as the winner when the auction closes, you receive an instant notification with full transaction details.' },
  { step: '06', title: 'Coordinate Pickup & Pay', desc: 'Arrange pickup with the seller. Complete payment securely through the platform after weighment confirmation.' },
]

export default function BuyersPage() {
  return (
    <div className="info-page">
      <Navbar />

      {/* Hero */}
      <section className="info-hero buyers-hero">
        <div className="info-hero-overlay" />
        <div className="container info-hero-content">
          <div className="info-hero-badge buyers-badge">
            <Truck size={14} /> For Scrap Buyers
          </div>
          <h1>Reliable Supply. Zero Guesswork.</h1>
          <p>Source quality industrial scrap from verified sellers across India. Compare prices, place competitive bids and manage every purchase from one dashboard.</p>
          <div className="info-hero-ctas">
            <Link to="/auth/register?role=buyer" className="btn btn-amber btn-xl">
              Register as Buyer <ArrowRight size={18} />
            </Link>
            <Link to="/auth/login?role=buyer" className="btn btn-ghost btn-xl info-ghost-btn">
              Buyer Login <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="section-pad">
        <div className="container">
          <div className="section-header">
            <div className="section-tag"><Award size={14} /> Why Buy on ScrapBazaar</div>
            <h2 className="section-title">Everything a Scrap Buyer Needs</h2>
            <p className="section-subtitle">From verified supply to digital documentation — built for serious industrial procurement.</p>
          </div>
          <div className="grid-3">
            {BUYER_BENEFITS.map((b, i) => (
              <div key={i} className="info-card card">
                <div className="info-card-icon buyers-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-pad info-alt-bg">
        <div className="container">
          <div className="section-header">
            <div className="section-tag buyers-tag"><Clock size={14} /> Step by Step</div>
            <h2 className="section-title">How Buying Works</h2>
            <p className="section-subtitle">From registration to pickup — a clear, transparent process every step of the way.</p>
          </div>
          <div className="steps-grid">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-card-number buyers-num">{s.step}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bidding explained */}
      <section className="section-pad">
        <div className="container">
          <div className="bidding-explain">
            <div className="bidding-text">
              <div className="section-tag buyers-tag" style={{ display: 'inline-flex', marginBottom: 16 }}>
                <TrendingUp size={14} /> How Bidding Works
              </div>
              <h2>Transparent, Real-Time Competitive Bidding</h2>
              <p>ScrapBazaar uses a live auction model. When a seller lists a scrap lot, it goes live for a set period. During this time, verified buyers place bids. The auction closes automatically at the configured time, and the highest valid bid wins.</p>
              <ul className="bidding-points">
                <li><CheckCircle2 size={16} /> All bids are validated on the server — no manipulation</li>
                <li><CheckCircle2 size={16} /> Bidder identities are anonymous during active auctions</li>
                <li><CheckCircle2 size={16} /> Minimum bid increments are enforced to ensure fair competition</li>
                <li><CheckCircle2 size={16} /> You receive notifications when outbid so you can respond</li>
                <li><CheckCircle2 size={16} /> Auction results are determined entirely by backend logic</li>
                <li><CheckCircle2 size={16} /> The winning buyer's details are revealed to the seller post-auction to complete the transaction</li>
              </ul>
            </div>
            <div className="bidding-visual">
              <div className="bid-demo-card">
                <div className="bid-demo-header">Live Auction — Steel HMS Grade A</div>
                <div className="bid-demo-detail"><span>Quantity:</span> 15 Tonnes</div>
                <div className="bid-demo-detail"><span>Starting Price:</span> ₹28,000/tonne</div>
                <div className="bid-demo-detail highlight"><span>Current Highest Bid:</span> ₹31,500/tonne</div>
                <div className="bid-demo-countdown">
                  <Clock size={14} /> Closes in 2h 14m
                </div>
                <div className="bid-demo-bidders">
                  {['Buyer 01', 'Buyer 02', 'Buyer 03'].map((b, i) => (
                    <div key={i} className={`bid-demo-bidder ${i === 1 ? 'top-bidder' : ''}`}>
                      {b} {i === 1 && <span className="top-badge">Highest</span>}
                    </div>
                  ))}
                </div>
                <div className="bid-demo-note">Bidder identities are anonymous during active auctions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="section-pad info-alt-bg">
        <div className="container">
          <div className="section-header">
            <div className="section-tag buyers-tag"><Bell size={14} /> Stay Informed</div>
            <h2 className="section-title">Never Miss an Update</h2>
            <p className="section-subtitle">ScrapBazaar keeps you notified at every stage of the bidding and transaction process.</p>
          </div>
          <div className="notifications-grid">
            {[
              { icon: '🔔', title: 'New Listing Alert', desc: 'Notified when a new material matching your preferences is listed.' },
              { icon: '📈', title: 'Outbid Alert', desc: 'Instant notification when someone places a higher bid — so you can respond quickly.' },
              { icon: '🏆', title: 'Auction Won', desc: 'Congratulations notification with full details when your bid wins.' },
              { icon: '📦', title: 'Transaction Update', desc: 'Pickup coordination, weighment confirmation and payment status updates.' },
              { icon: '✅', title: 'Verification Status', desc: 'Notified when your business verification is approved or if additional documents are required.' },
              { icon: '💳', title: 'Payment Confirmation', desc: 'Receipt and confirmation for every payment processed through the platform.' },
            ].map((n, i) => (
              <div key={i} className="notification-card card">
                <div className="notification-emoji">{n.icon}</div>
                <h4>{n.title}</h4>
                <p>{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="info-cta-section buyers-cta">
        <div className="container info-cta-inner">
          <div>
            <h2>Ready to Source Smarter?</h2>
            <p>Join hundreds of verified buyers already sourcing quality industrial scrap on ScrapBazaar.</p>
          </div>
          <div className="info-cta-actions">
            <Link to="/auth/register?role=buyer" className="btn btn-amber btn-xl">
              Register as Buyer <ArrowRight size={18} />
            </Link>
            <Link to="/auth/login?role=buyer" className="btn btn-ghost btn-xl info-ghost-btn">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
