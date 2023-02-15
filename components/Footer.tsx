import React from 'react'

/**
 * Site footer
 */
export default function Footer() {
  return (
    <div className="min-h-0 p-5 flex justify-between items-center flex-col sm:flex-row gap-4">
      <div></div>
      <div>
        <ul className="menu menu-horizontal px-1">
          <div className="flex items-center text-black gap-2 text-sm">
            <div>
              Built with ❤️ at 🏰{' '}
              <a
                href="https://buidlguidl.com/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                BuidlGuidl
              </a>
            </div>
            <span>·</span>
            <div>
              <a
                href="https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Support
              </a>
            </div>
          </div>
        </ul>
      </div>
      <div className="mr-4 text-sm">
        <div className="fixed m-4 bottom-0 right-0">{/* <SwitchTheme /> */}</div>
      </div>
    </div>
  )
}
