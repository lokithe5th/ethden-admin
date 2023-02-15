// import React, { useState, useRef, useCallback } from "react";
import Link from 'next/link'
import Image from 'next/image'
// import { Bars3Icon, BugAntIcon, SparklesIcon } from "@heroicons/react/24/outline";
import BG from '../asset/BG.png'
import sporkLogo from '../asset/spork.png'

/**
 * Site header
 */
export default function Header() {
  return (
    <div className="bg-[#000c66] min-h-0 flex flex-wrap rounded-t-3xl">
      <div className="flex items-center h-fit w-full md:w-auto md:h-auto justify-between md:justify-start px-4 py-3">
        <div>
          <Link href="/" passHref>
            <Image
              alt="SporkDAO logo"
              className="cursor-pointer"
              src={sporkLogo}
              width={65}
              height={60}
            />
          </Link>
        </div>
        <div className="">
          <Link href="/" passHref>
            <Image
              alt="BuidlGuidl logo"
              className="cursor-pointer"
              src={BG}
              width={190}
              height={50}
            />
          </Link>
        </div>
      </div>
    </div>
  )
}
