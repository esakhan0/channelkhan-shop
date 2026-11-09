import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { validateCheckoutPayment } from "../../lib/checkout-payment"

completeCartWorkflow.hooks.validate(async ({ cart }) => {
  validateCheckoutPayment(cart)
})
