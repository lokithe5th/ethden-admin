import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import Header from '@/components/Header'
import Vendors from '../components/Vendors'
import Footer from '@/components/Footer'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Scaffold-eth App</title>
        <meta name="description" content="Created with 🏗 scaffold-eth" />
      </Head>
      <Header />

      <div className="flex items-center flex-col flex-grow">
        <Vendors />
      </div>
      <Footer />
    </>
  )
}

export default Home
