import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Keep this override: removing it would restore the native customer return-creation endpoint.
export async function POST(_req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.status(410).json({ message: "Please use Request a refund from your order. Returns are arranged after review." })
}
