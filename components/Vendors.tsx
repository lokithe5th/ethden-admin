import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { ERC20__factory } from '@/app/contracts'
import Balance from '../components/Balance'
import Search from '../components/Search'
import _ from 'lodash'

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
  const provider = new ethers.providers.JsonRpcProvider('https://zksync2-testnet.zksync.dev')
  const signer = new ethers.Wallet(
    '0x6f72a2f8a8ef4b4c9fa04b79a6c034dbbcd462c439876f2959408c95d3bd4fb9',
    provider
  )
  const buidlTokenAddress = '0xf551954D449eA3Ae4D6A2656a42d9B9081B137b4'
  const vendorAddresses = [
    '0x0dc01C03207fB73937B4aC88d840fBBB32e8026d',
    '0x7EBa38e027Fa14ecCd87B8c56a49Fa75E04e7B6e',
  ]

  let vendors: Vendor[] = []

  const buidlContract = ERC20__factory.connect(buidlTokenAddress, signer)

  //Get the buidl contract BUIDL balance.
  const [vendorData, setVendorData] = useState<Vendor[]>()
  const [loaded, setLoaded] = useState<boolean>()

  useEffect(() => {
    getTransactions()
  }, [])

  buidlContract.on('Transfer', async () => {
    if (vendorData) {
      const block = await provider.getBlockNumber()
      await updateTransactions(block - 1, vendorData)
    }
  })

  async function updateTransactions(lastCurrentBlock: number, vendors: Vendor[]) {
    const bFilter = buidlContract.filters.Transfer()
    const block = await provider.getBlockNumber()

    const transfers = await buidlContract.queryFilter(bFilter, lastCurrentBlock, block)

    let transferCount = 0

    for (let t of transfers) {
      if (vendorAddresses.includes(t.args.to)) {
        transferCount++
      }
    }

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
    }

    vendors[0].totalOrders += transferCount

    localStorage.setItem('data', JSON.stringify(vendors))

    setVendorData(vendors)
  }

  async function getTransactions() {
    for (let i = 0; i < vendorAddresses.length; i++) {
      let balance = (await buidlContract.balanceOf(vendorAddresses[i])).toNumber()
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

    localStorage.setItem('data', JSON.stringify(vendors))
    vendors[0].currentToBlock = block

    setLoaded(true)
    setVendorData(vendors)
  }

  return (
    <>
      <Balance vendorData={vendorData} />
      <Search />
      <div className="w-full p-4 flex flex-col rounded-2xl bg-blue-900 text-white min-h-full">
        <div>
          {vendorData
            ? vendorData.map((v, i) => (
                <li key={v.id.toString()}>
                  Vendor {i}: Balance: {v.balance / 100} | TxCount: {v.transactions.length} | Unique
                  Users: {v.userCount}
                </li>
              ))
            : 'Loading'}
        </div>
      </div>
    </>
  )
}

export default Vendors
