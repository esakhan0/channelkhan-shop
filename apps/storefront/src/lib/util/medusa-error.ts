type MedusaError = {
  status?: number
  message?: string
  response?: { status?: number; data?: { message?: string } | string }
}

export default function medusaError(error: unknown): never {
  const err = error && typeof error === "object" ? error as MedusaError : {}
  const status = err.response?.status ?? err.status
  // Never log headers, URLs, request objects or bodies containing customer data.
  console.error("Shop API request failed", { status })
  if (typeof status === "number" && status >= 400 && status < 500) {
    const data = err.response?.data
    const message = typeof data === "object" && data !== null ? data.message : err.message
    if (typeof message === "string" && message) throw new Error(message)
  }
  throw new Error("We couldn't complete that request. Please try again.")
}
