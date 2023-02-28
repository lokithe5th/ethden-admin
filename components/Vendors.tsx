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
    // return await response.json();
  }

  let vendorAddresses:Vendor[] = [];

  /*
  const vendorAddresses = [
    {
      name: 'Pepsi Roadhouse Concessions (1)',
      address: '0x2406Fb7143f22F221e74524aA25bd0F7FFA6bA66',
    },
    {
      name: 'Pepsi Roadhouse Concessions (2)',
      address: '0x8CE80Adea55F41D874398b2EF80c31216B929521',
    },
    { name: 'The Cafeteria (1)', address: '0xDA55D516b2438645e0FC31aC448d0900aD78045f' },
    { name: 'The Cafeteria (2)', address: '0xdCE10742Ab93587DF464935C0063b1ba5db02968' },
    { name: 'Stadium Grill (1)', address: '0xe664c6454300f48942239605810178221b34959f' },
    { name: 'Stadium Grill (2)', address: '0xc4779195760540E2CBF73d855695D8537b1f545E' },
    { name: 'BBB Lounge (1)', address: '0xa65150551B77719E31eBfe395c3f0A009aD0c19e' },
    { name: 'Gourmet Coffee Lounge (1)', address: '0xBb101CBEE74549768E8495877109B0A788245B09' },
    { name: 'Network Lounge (1)', address: '0xf5d2d68377725aC40719Fa1AEd5f9cF1457D0BE7' },
    { name: 'BUIDLathon bodega (1)', address: '0x642cfD51f29E383fCB9f726eC0CCD0B03Cf723Cb' },
    { name: 'Mainstage (1)', address: '0x9BFCD4dB79a3D513f28aEcaff1b962F163bA57BD' },
    { name: 'Original by Greeks (1)', address: '0x837717d8fCaF2ec72c132FEe49f4BE3Ddf27b501' },
    {
      name: 'Elevation 5280 Smokehouse (1)',
      address: '0xfe7835f82181db55236BC998234A2C6c7030Ba82',
    },
    { name: 'High Society Pizza (1)', address: '0x41436B6F50DcfCa53b357C81a9D6C88349cC8e19' },
    { name: 'Downtown Fingers (1)', address: '0x71cFB7Ff2cb34c9d86D02BBC0967264108c19FdB' },
    { name: 'Denver Taco Truck (1)', address: '0x9598cd29af4368d49270DB724E7511CCcD2e4be8' },
    { name: 'Cheese Love Grill (1)', address: '0x8360F4F9Ba02a131757EAFECE17bc814313a61de' },
    { name: 'Arcade 1', address: '0x31edD5A882583CBf3A712E98E100Ef34aD6934b4' },
  ] */

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

    console.log(content);

    const response = await fetch(`http://localhost:8000/vendors/${_id}`, {
      method: 'PUT',
      body: JSON.stringify(content),
      headers: {'Content-Type': 'application/json; charset=UTF-8'} });
    
    if (response.ok) {
      let updatedVendors:Vendor[] = vendorData ? vendorData: [];
      updatedVendors[id] = {
        name: vendorAddresses[id].name,
        address: vendorAddresses[id].address,
        id: id,
        _id: vendorAddresses[id]._id,
        transactions: [],
        balance: 0,
        userCount: updatedVendors[id].userCount,
        totalOrders: updatedVendors[id].totalOrders,
        currentToBlock: updatedVendors[id].currentToBlock,
        payoutsReceived: newPayoutsReceived
      }
      setVendorData(updatedVendors);
      
      alert("Updated! Please allow some time for the payout to update");
      await getTx();
     }
  }

    // Initialize data
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
                        <td className='px-6 py-4'><Button type="primary" onClick={() => {recordPayout(v.id, v._id, (v.balance - v.payoutsReceived))}}>Payout</Button></td>
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
