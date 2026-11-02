import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-12 ink-cart">
      <div className="content-container" data-testid="cart-container">
        <div className="ink-page-heading"><p className="ink-kicker">GOOD CHOICES, BY THE WAY.</p><h1>Your bag of joy.</h1><LocalizedClientLink href="/store" className="ink-underlined">← Keep exploring</LocalizedClientLink></div>
        {cart?.items?.length ? (
          <div className="joy-cart-grid">
            <div className="ink-cart-items flex flex-col p-6 gap-y-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <>
                    <div className="ink-cart-summary p-6">
                      <Summary cart={cart} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
