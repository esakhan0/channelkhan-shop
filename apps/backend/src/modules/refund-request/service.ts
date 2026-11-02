import { MedusaService } from "@medusajs/framework/utils"
import RefundRequest from "./models/refund-request"

class RefundRequestModuleService extends MedusaService({ RefundRequest }) {}

export default RefundRequestModuleService
