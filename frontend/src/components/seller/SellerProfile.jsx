import React from 'react'
import BuyerProfile from '../buyer/BuyerProfile'
// Seller and buyer profiles are structurally the same
export default function SellerProfile({ setTitle }) {
  return <BuyerProfile setTitle={setTitle} />
}
