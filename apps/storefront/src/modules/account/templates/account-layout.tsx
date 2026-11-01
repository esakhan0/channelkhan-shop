import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12 ink-account" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-6xl mx-auto flex flex-col">
        <div className={customer ? "ink-account-dashboard grid grid-cols-1 small:grid-cols-[220px_1fr] py-12" : "py-6"}>
          {customer && <div className="ink-account-sidebar"><AccountNav customer={customer} /></div>}
          <div className="flex-1">{children}</div>
        </div>
        <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-gray-200 py-12 gap-8">
          <div>
            <h3 className="text-xl-semi mb-4">Got questions?</h3>
            <span className="txt-medium">
              Get in touch with the people behind the prints. We’re happy to help.
            </span>
          </div>
          <div>
            <UnderlineLink href="/contact">
              Customer Service
            </UnderlineLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
