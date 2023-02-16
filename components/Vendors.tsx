import { useEffect, useState } from 'react'
import { formatUnits } from '@ethersproject/units'
/* import { Contract } from 'zksync-web3' */
import { ethers, Contract } from 'ethers'
import { ERC20__factory } from '@/app/contracts'
import _ from 'lodash'

interface Vendor {
  address: string
  id: number
  transactions: object[]
  balance: number
  userCount: number
}

const Vendors = () => {
  const provider = new ethers.providers.JsonRpcProvider('https://zksync2-testnet.zksync.dev')
  const signer = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, provider)
  const buidlTokenAddress = '0xf551954D449eA3Ae4D6A2656a42d9B9081B137b4'
  const vendorAddresses = [
    '0x0dc01C03207fB73937B4aC88d840fBBB32e8026d',
    '0x7EBa38e027Fa14ecCd87B8c56a49Fa75E04e7B6e',
  ]

  let vendors: Vendor[] = []

  const buidlContract = ERC20__factory.connect(buidlTokenAddress, signer)

  //Get the buidl contract BUIDL balance.
  const [buidlTokenBalance, setBuidltokenBalance] = useState<number>()
  const [vendor1Balance, setVendor1Balance] = useState<number>()
  const [vendor2Balance, setVendor2Balance] = useState<number>()
  const [vendor1Count, setVendor1Count] = useState<number>()
  const [vendor1Uniques, setVendor1Uniques] = useState<number>()
  const [vendorData, setVendorData] = useState<Vendor[]>()
  const [loaded, setLoaded] = useState<boolean>()

  useEffect(() => {
    getBalance()
  })

  useEffect(() => {
    getTransactions()
  }, [])

  let totalSupply
  console.log('Total supply', totalSupply)

  async function getBalance() {
    totalSupply = buidlContract && buidlContract.totalSupply
    const buidlTokenBalance =
      buidlTokenAddress && buidlContract && (await buidlContract.balanceOf(buidlTokenAddress))
    const buidlBalance = formatUnits(buidlTokenBalance, 2)
    setBuidltokenBalance(Number(buidlBalance))
    // Vendor 1 balance
    const vendor1TokenBalance = buidlContract && (await buidlContract.balanceOf(vendorAddresses[1]))
    const vendor1Balance = formatUnits(vendor1TokenBalance, 2)
    setVendor1Balance(Number(vendor1Balance))
    // Vendor 2 balance
    const vendor2TokenBalance = buidlContract && (await buidlContract.balanceOf(vendorAddresses[0]))
    const vendor2Balance = formatUnits(vendor2TokenBalance, 2)
    setVendor2Balance(Number(vendor2Balance))
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
    }

    setVendor1Count(vendors[0].transactions.length)

    setLoaded(true)
    setVendorData(vendors)
  }

  return (
    <div className="w-full p-4 flex flex-col rounded-2xl bg-blue-900 text-white min-h-full">
      <div>
        {loaded == true && vendorData
          ? vendorData.map((v, i) => (
              <p>
                <h1 className="font-extrabold">Vendor {i}: </h1> Balance:{' '}
                {v.balance || 'Loading...'} | TxCount: {v.transactions.length || 'Loading...'} |
                Unique Users: {v.userCount}
              </p>
            ))
          : 'Loading'}
      </div>
    </div>
  )
}

export default Vendors
