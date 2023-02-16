import React, { useEffect, useState } from 'react'
import { Vendor } from './Vendors'

function Balance(props: {
  vendorData:
    | {
        totalOrders:
          | string
          | number
          | boolean
          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
          | React.ReactFragment
          | React.ReactPortal
          | null
          | undefined
      }[]
    | undefined
}) {
  return (
    <div className="flex flex-row bg-[#000c66] rounded-b-3xl w-full p-5">
      <div className="flex flex-col w-1/3 md:w-1/4 items-start text-[#c3e0e5] text-left">
        <h6 className="tracking-widest md:text-sm">Total Orders</h6>
        {props.vendorData != undefined ? (
          <text className="text-5xl font-semibold text-white py-3 md:text-7xl">
            {props.vendorData[0].totalOrders}
          </text>
        ) : (
          <text className="text-3xl font-semibold text-white py-3 md:text-7xl">Loading</text>
        )}
      </div>
      <div className="flex flex-col w-1/2 items-start text-[#c3e0e5] text-left">
        <h6 className="tracking-widest md:text-sm">Total Earned</h6>
        <text className="text-5xl font-semibold py-3 text-white md:text-7xl">$1500</text>
      </div>
    </div>
  )
}

export default Balance
