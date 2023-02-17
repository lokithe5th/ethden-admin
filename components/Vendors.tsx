import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { ERC20__factory } from '@/app/contracts'
import Balance from '../components/Balance'
import Search from '../components/Search'
import _ from 'lodash'
import Spinner from './Spinner'

export interface Vendor {
  address: string
  id: number
  transactions: object[]
  balance: number
  userCount: number
  totalOrders: number
  currentToBlock: number
}

const Vendors = () => {
  const [vendorData, setVendorData] = useState<Vendor[]>()

  const provider = new ethers.providers.JsonRpcProvider('https://zksync2-testnet.zksync.dev')
  const signer = new ethers.Wallet(ethers.Wallet.createRandom(), provider)
  const buidlTokenAddress = '0xf551954D449eA3Ae4D6A2656a42d9B9081B137b4'
  const vendorAddresses = [
    '0x0dc01C03207fB73937B4aC88d840fBBB32e8026d',
    '0x7EBa38e027Fa14ecCd87B8c56a49Fa75E04e7B6e',
  ]

  // Typesafe interface via typechain
  const buidlContract = ERC20__factory.connect(buidlTokenAddress, signer)

  // Event listener
  const update = buidlContract.on('Transfer', async () => {})

  // Initialize data
  useEffect(() => {
    getTransactions()
  }, [])

  // Update on event listener
  useEffect(() => {
    getTransactions()
  }, [update])

  // Fetches and buckets transfer events
  async function getTransactions() {
    let vendors: Vendor[] = []

    for (let i = 0; i < vendorAddresses.length; i++) {
      let balance = (await buidlContract.balanceOf(vendorAddresses[i])).toNumber() / 100
      vendors.push({
        address: vendorAddresses[i],
        id: i,
        transactions: [],
        balance: balance,
        userCount: 0,
        totalOrders: 0,
        currentToBlock: 0,
      })
    }

    const bFilter = buidlContract.filters.Transfer()
    const block = await provider.getBlockNumber()

    const transfers = await buidlContract.queryFilter(bFilter, 600, block)

    for (let t of transfers) {
      for (let v of vendors) {
        if (t.args.to == v.address) {
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

  return (
    <>
      <Balance vendorData={vendorData} />
      <Search />
      <div className="w-full p-4 flex flex-col rounded-2xl bg-blue-900 text-white min-h-full">
        <div>
          {vendorData ? (
            vendorData.map((v, i) => (
              <ul>
                <li key={v.id.toString()}>
                  <h1 className="text-2xl my-2 font-bold">Vendor {i}:</h1> Balance: {v.balance} ||
                  TxCount: {v.transactions.length} || Unique Users: {v.userCount}
                </li>
              </ul>
            ))
          ) : (
            <Spinner />
          )}
        </div>
      </div>
    </>
  )
}

export default Vendors
