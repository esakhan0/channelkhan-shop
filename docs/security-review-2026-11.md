# Security maintenance review — November 2026

This is a targeted code and dependency review, not a penetration test or a guarantee of security.

## Changes

- Next.js and its ESLint configuration updated to 16.4.1. Compatible transitive security patches are pinned with pnpm overrides; remove overrides when upstream dependency ranges include those fixes.
- The store payment-session endpoint rejects providers other than this shop's configured `pp_stripe_stripe`. The native Medusa cart-completion validation hook also rejects old manual sessions and mismatched payment amounts/currencies on the server's persisted cart snapshot. Medusa's native Stripe authorization remains responsible for verifying payment; the hook never marks a payment successful.
- The checkout interface excludes manual payment and returns safe order-completion feedback. Address submission awaits the cart cookie and sends typed string fields.
- Upstream error handling no longer logs request headers, URLs, response bodies or request objects. Unexpected server/network errors return a generic message.
- SMTP continues to use TLS with certificate verification. The fixed printer logo is attached inline; customer-controlled attachments and remote downloads are not allowed. Brevo setup is documented in `shop-email.md`.
- Removed Sentry instrumentation and the abandoned Resend/ShipStation setup guide.
- All pinned Medusa packages upgraded to 2.22.6, including the 2.22.5 query-path security hardening. Backend runtime dependencies now use the audited workspace lockfile instead of a fresh unlocked installation.
- Individual order retrieval requires the authenticated owner or a signed, expiring guest receipt capability. Cart access, shipping quotes and payment-session creation require cart ownership or a capability issued at cart creation. The storefront stores capabilities in HttpOnly cookies; cart/order reads are uncached.
- Non-empty customer-supplied payment-session data is rejected, preventing Stripe parameter overrides. The unused Adyen return handler and unauthenticated starter UCP checkout routes are disabled.
- Production startup requires distinct JWT and cookie secrets of at least 32 characters. PostgreSQL and Redis use an internal Compose network. Optional PostgreSQL TLS configuration verifies the certificate and supports a private CA.
- Contact/privacy pages use the supplied support email and describe Stripe, Brevo, hosting, delivery and support processing. Legal trader identity/address and provider-specific retention/transfer details still need confirmation; this is not a completed legal compliance review.

## Dependency audit

The 9 November production dependency audit reports 2 findings: 0 critical, 0 high, 1 moderate and 1 low (down from 31 findings, including 3 critical, at the start of the maintenance work). An audit counts known dependency advisories, not exploitable vulnerabilities proven in this deployment.

| Dependency | Remaining advisory | Location / follow-up |
| --- | --- | --- |
| `uuid` 9.0.1 | GHSA-w5hq-g745-h8pq (moderate) | Medusa Redis event bus / BullMQ. Patched in 11.1.1; track upstream upgrade. |
| `deepmerge` 4.3.1 | GHSA-gcqx-w48m-w2h4 (low) | Medusa's transitive SendGrid package; SendGrid is not configured. No patched version reported by the audit. |

## Verification and limits

- 55 backend unit cases cover email rendering/transport, shipping calculation, payment guards, capability signing/expiry and security configuration.
- 10 storefront cases cover quantity limits, shipping quotes and error redaction.
- Full Medusa backend/admin and Next.js storefront production builds pass, along with both app TypeScript checks. Lint has no errors, with existing warnings remaining. Checks ran in the current working tree, which also contains pre-existing policy and styling edits excluded from this change.
- 16 database-backed HTTP integration tests pass against an isolated local PostgreSQL instance. These cover anonymous/foreign order access, authorised reads, protected cart/payment/shipping endpoints, rejected manual-provider and Stripe-parameter requests, rejected legacy manual-payment checkout, legitimate free checkout and receipt issuance, refund ownership/concurrency/amount checks and weight-based shipping.
- Local production HTTP smoke checks confirm `/ucp`, `/ucp/v1/checkout-sessions` and `/.well-known/ucp` return uncached 404 responses.
- Live Stripe payment flows were not run. Check a Stripe sandbox payment, declined payment, changed-cart total and webhook delivery before live trading. No real customer payment or production database was used in these tests.
- No real email was sent. Configure the Brevo SMTP login/key and verified sender in Coolify, then run the documented test email and inspect it in the receiving mailbox.
- Live firewall rules, admin MFA coverage, rate limits, backups/restore, secret rotation, Stripe webhook delivery and deployed versions were not verified. Keep guest order linking disabled until its email/token/rate-limit checks have been completed.

The storefront changes include security headers and disabled production full-URL fetch logging. This is a limited CSP, not a full script-source policy. A complete CSP needs compatibility testing with Stripe wallets and the storefront scripts.

## Database encryption and deployment

- The current Compose PostgreSQL connection has `DATABASE_SSL=false`: database traffic is not encrypted in transit. The internal Docker network limits exposure but does not encrypt traffic. Configure a TLS listener and trusted certificate before setting `DATABASE_SSL=true`; do not disable certificate verification.
- PostgreSQL data uses a normal persistent Docker volume. Host disk and backup encryption cannot be established from this repository; verify both with the hosting provider. Database credentials currently use the PostgreSQL administrative role; create and test a restricted application role and separate migration credentials on the host.
- Rebuild and deploy backend and storefront together. Confirm distinct, strong `JWT_SECRET` and `COOKIE_SECRET` values before rollout; rotating them invalidates existing sessions/capabilities. Back up the database and uploads before migrations.
- Existing guest carts and old ID-only order links do not have the new capability. Customers can start a new cart or sign in for their own orders; guests without the receipt cookie should contact support. Guest order linking remains disabled pending a verified email handoff.
- Both application production builds pass locally. Docker image build and the live Coolify deployment remain unverified because no Docker daemon or production access was available.

References: [Medusa security hardening release](https://github.com/medusajs/medusa/releases/tag/v2.22.5), [2.22.6 release](https://github.com/medusajs/medusa/releases/tag/v2.22.6), [Medusa secure order retrieval guidance](https://docs.medusajs.com/resources/commerce-modules/order/secure-order-retrieval).
