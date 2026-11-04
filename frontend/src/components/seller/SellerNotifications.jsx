import React from 'react'
import BuyerNotifications from '../buyer/BuyerNotifications'
// Seller notifications use the same component — notifications are role-agnostic
export default function SellerNotifications({ setTitle }) {
  return <BuyerNotifications setTitle={setTitle} />
}
