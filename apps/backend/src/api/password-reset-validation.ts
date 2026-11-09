import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export function validateResetPassword(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const password = (req.body as { password?: unknown })?.password
  // Enforce on the API too: a browser-only check could be bypassed.
  if (typeof password !== "string" || password.length < 15 || password.length > 128) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Use a password between 15 and 128 characters.")
  }
  next()
}
