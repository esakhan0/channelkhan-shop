import { Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = ({ orderNumber }: { orderNumber?: number }) => {
  return (
    <div className="joy-order-help mt-6">
      <Heading className="text-base-semi">Need help?</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink href={`/contact?order=${orderNumber || ""}`}>Contact</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href={`/contact?topic=return&order=${orderNumber || ""}`}>
              Request a return
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
