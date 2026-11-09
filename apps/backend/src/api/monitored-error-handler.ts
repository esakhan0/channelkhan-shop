import { errorHandler, getHttpResponseFromError, type MedusaErrorHandlerFunction } from "@medusajs/framework/http"
import * as Sentry from "@sentry/node"

const medusaErrorHandler = errorHandler()

export const monitoredErrorHandler: MedusaErrorHandlerFunction = (error, req, res, next) => {
  try {
    if (Sentry.isEnabled() && getHttpResponseFromError(error).statusCode >= 500) {
      Sentry.captureException(error)
    }
  } catch {
    // Monitoring failure must never change Medusa's response or authentication.
  }
  medusaErrorHandler(error, req, res, next)
}
