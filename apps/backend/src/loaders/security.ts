import { validateProductionSecrets } from "../lib/database-security"

// Validate at startup; image builds do not receive production secrets.
export default async function validateSecurityConfiguration() {
  validateProductionSecrets(process.env)
}
