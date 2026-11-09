# Security maintenance review — November 2026

This is a targeted code and dependency review, not a penetration test or a guarantee of security.

## Changes

- Next.js and its ESLint configuration updated to 16.4.1. Compatible transitive security patches are pinned with pnpm overrides; remove overrides when upstream dependency ranges include those fixes.
- The store payment-session endpoint rejects providers other than this shop's configured `pp_stripe_stripe`. The native Medusa cart-completion validation hook also rejects old manual sessions and mismatched payment amounts/currencies on the server's persisted cart snapshot. Medusa's native Stripe authorization remains responsible for verifying payment; the hook never marks a payment successful.
- The checkout interface excludes manual payment and returns safe order-completion feedback. Address submission awaits the cart cookie and sends typed string fields.
- Upstream error handling no longer logs request headers, URLs, response bodies or request objects. Unexpected server/network errors return a generic message.
- SMTP continues to use TLS with certificate verification. The fixed printer logo is attached inline; customer-controlled attachments and remote downloads are not allowed. Brevo setup is documented in `shop-email.md`.
- Removed Sentry instrumentation and the abandoned Resend/ShipStation setup guide.

## Dependency audit

`pnpm audit --prod` fell from 31 findings (3 critical) to 6 findings (0 critical, 2 high, 3 moderate, 1 low) during this review. An audit counts known dependency advisories, not exploitable vulnerabilities proven in this deployment.

| Dependency | Remaining advisory | Location / follow-up |
| --- | --- | --- |
| `@graphql-tools/utils` 10.11.0 | GHSA-7mx3-vvmw-hjmv, GHSA-c4qx-w738-7hr3 (high) | Medusa CLI / GraphQL code generation. Patched in 12.0.2; requires a compatible upstream upgrade rather than an untested major override. |
| `uuid` 9.0.1 | GHSA-w5hq-g745-h8pq (moderate) | Medusa Redis event bus / BullMQ. Patched in 11.1.1; track upstream upgrade. |
| `glob` 13.0.6 | GHSA-3g3m-2fjr-6pw4 (moderate) | Medusa CLI. Patched in 14.0.2; track upstream upgrade. |
| `minimatch` 10.2.6 | GHSA-g3hv-75wg-m249 (moderate) | Medusa CLI / glob. Patched in 11.0.1; track upstream upgrade. |
| `deepmerge` 4.3.1 | GHSA-gcqx-w48m-w2h4 (low) | Medusa's transitive SendGrid package; SendGrid is not configured. No patched version reported by the audit. |

## Verification and limits

- 50 backend unit cases cover email rendering/transport, shipping calculation and payment guards.
- 10 storefront cases cover quantity limits, shipping quotes and error redaction.
- Full Medusa backend/admin and Next.js storefront production builds pass, along with both app TypeScript checks. Lint has no errors, with existing warnings remaining. Checks ran in the current working tree, which also contains pre-existing policy and styling edits excluded from this change.
- Database-backed integration and live Stripe payment flows were not run in this review: a local PostgreSQL/Docker service was unavailable. Check a Stripe sandbox payment, declined payment, changed-cart total and forged manual-provider request before live trading.
- No real email was sent. Configure the Brevo SMTP login/key and verified sender in Coolify, then run the documented test email and inspect it in the receiving mailbox.
- Live firewall rules, admin MFA coverage, rate limits, backups/restore, secret rotation, Stripe webhook delivery and deployed versions were not verified. Keep guest order linking disabled until its email/token/rate-limit checks have been completed.

The storefront changes include security headers and disabled production full-URL fetch logging. This is a limited CSP, not a full script-source policy. A complete CSP needs compatibility testing with Stripe wallets and the storefront scripts.
