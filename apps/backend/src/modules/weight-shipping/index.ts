import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import WeightShippingProvider from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [WeightShippingProvider],
})
