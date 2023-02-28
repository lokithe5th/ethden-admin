import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { ERC20__factory } from '@/interfaces/contracts'
import Balance from '../components/Balance'
import _ from 'lodash'
import Spinner from './Spinner'
import { Alert, Button, Col, Menu, Row } from "antd";

export interface Vendor {
  name: string
  address: string
  id: number
  _id: string
  transactions: object[]
  balance: number
  userCount: number
  totalOrders: number
  currentToBlock: number
  payoutsReceived: number
}

const Vendors = () => {
  const [vendorData, setVendorData] = useState<Vendor[]>()

  // Currently, only one environment is supported.
  const provider = new ethers.providers.JsonRpcProvider('https://zksync2-mainnet.zksync.io')

  const signer = new ethers.Wallet(ethers.Wallet.createRandom(), provider)

  const buidlTokenAddress = '0xEd0994232328B470d44a88485B430b8bA965D434'

  const vendorArray = async():Promise<Vendor[]> => {
    const res = await fetch('http://localhost:8000/vendors/');
    if (res.ok) {
      const data = await res.json();
      console.log(data);
      return data;
    } else {
      return [];
    }
  }

  let vendorAddresses:Vendor[] = [];

  // Typesafe interface via typechain
  const buidlContract = ERC20__factory.connect(buidlTokenAddress, signer)

  // Event listener
  buidlContract.on('Transfer', async () => {
    if (vendorData === undefined) {
      getTx()
    } else {
      updateTx(vendorData[0].currentToBlock, vendorData)
    }
  })

  // Fetches and buckets transfer events
  async function getTx() {
    let vendors: Vendor[] = []
    vendorAddresses = await vendorArray();

    for (let i = 0; i < vendorAddresses.length; i++) {
      let balance = (await buidlContract.balanceOf(vendorAddresses[i].address)).toNumber() / 100
      vendors.push({
        name: vendorAddresses[i].name,
        address: vendorAddresses[i].address,
        id: i,
        _id: vendorAddresses[i]._id,
        transactions: [],
        balance: balance,
        userCount: 0,
        totalOrders: 0,
        currentToBlock: 0,
        payoutsReceived: vendorAddresses[i].payoutsReceived
      })
    }

    const bFilter = buidlContract.filters.Transfer()
    const block = await provider.getBlockNumber()

    const transfers = await buidlContract.queryFilter(bFilter, 600, block)

    for (let t of transfers) {
      for (let v of vendors) {
        if (t.args.to === v.address) {
          v.transactions.push(t)
        }
      }
    }

    for (let i = 0; i < vendors.length; i++) {
      const v1uniq = _.uniqBy(vendors[i].transactions, 'args.from')
      vendors[i].userCount = v1uniq.length

      const ordersPerVendor = vendors[i].transactions.length

      vendors[0].totalOrders += ordersPerVendor
    }

    vendors[0].currentToBlock = block
    setVendorData(vendors)
    console.log(vendorAddresses);
  }

  // Fetches and buckets transfer events
  async function updateTx(lastBlock: number, vendors: Vendor[]) {
    console.log('uhhh TWO')
    for (let i = 0; i < vendorAddresses.length; i++) {
      const balance = (await buidlContract.balanceOf(vendorAddresses[i].address)).toNumber() / 100
      vendors[i].balance = balance
    }

    const bFilter = buidlContract.filters.Transfer()
    const block = await provider.getBlockNumber()

    const transfers = await buidlContract.queryFilter(bFilter, lastBlock, block)

    let transferCount = 0

    for (let t of transfers) {
      for (let v of vendors) {
        if (t.args.to === v.address) {
          transferCount++
          v.transactions.push(t)
        }
      }
    }

    for (let i = 0; i < vendors.length; i++) {
      const v1uniq = _.uniqBy(vendors[i].transactions, 'args.from')
      vendors[i].userCount = v1uniq.length

      /* const ordersPerVendor = vendors[i].transactions.length */
    }
    vendors[0].totalOrders += transferCount
    vendors[0].currentToBlock = block
    setVendorData(vendors)
  }

  const recordPayout = async(id:number, _id:string, newPayoutsReceived:any) => {
    let content:any = {
      payoutsReceived: newPayoutsReceived
    }

    const response = await fetch(`http://localhost:8000/vendors/${_id}`, {
      method: 'PUT',
      body: JSON.stringify(content),
      headers: {'Content-Type': 'application/json; charset=UTF-8'} });
    
    if (response.ok) {
      console.log("VendorData: ", vendorData)
      let updatedVendors:Vendor[] = vendorData ? vendorData: [];
      updatedVendors[id] = {
        name: updatedVendors[id].name,
        address: updatedVendors[id].address,
        id: id,
        _id: updatedVendors[id]._id,
        transactions: [],
        balance: updatedVendors[id].balance,
        userCount: updatedVendors[id].userCount,
        totalOrders: updatedVendors[id].totalOrders,
        currentToBlock: updatedVendors[id].currentToBlock,
        payoutsReceived: newPayoutsReceived
      }

      setVendorData([...updatedVendors]);
      
      alert("Updated! Please allow some time for the payout to update");
      await getTx();
     }
  }

  const payOut = (id:number) => {
    let vendors:Vendor[] = vendorData ? vendorData : [];
    const hasBalance = vendors[id].balance - vendors[id].payoutsReceived;
    let button;
    if (hasBalance > 0) {
      button = <Button type="primary" block onClick={() => {recordPayout(vendors[id].id, vendors[id]._id, (vendors[id].balance - vendors[id].payoutsReceived))}}>Payout</Button>;
    } else {
      button = <p>Nothing to pay</p>;
    }

    return (
      <div>
        {button}
      </div>
    );
  }

  useEffect(() => {
    getTx()
  }, [])

  return (
    <>
      <Balance vendorData={vendorData} />
      <div className="w-full p-4 flex flex-col rounded-2xl bg-blue-900 text-white min-h-full mt-2">
        <div>
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Vendor
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Balance
                  </th>
                  <th scope="col" className='px-6 py-3'>
                    Payouts Received
                  </th>
                  <th scope="col" className='px-3 py-3'>
                    Pay
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendorData
                  ? vendorData.map((v, i) => (
                      <tr
                        key={v.id.toString()}
                        className="bg-white border-b dark:bg-gray-900 dark:border-gray-700"
                      >
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          {v.name}
                        </th>
                        <td className="px-6 py-4">{v.balance - v.payoutsReceived}</td>
                        <td className='px-6 py-4'>{v.payoutsReceived}</td>
                        <td className='px-6 py-4'>{payOut(v.id)}</td>
                        <td className="px-6 py-4">{v.userCount}</td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default Vendors