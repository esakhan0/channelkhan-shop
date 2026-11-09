# Resend, Sentry and ShipStation setup

Prepared configuration is not an active service connection. Create the accounts and add credentials to Coolify's runtime environment, never to GitHub, the storefront or Docker build arguments. No subscription or postage purchase is performed by this change.

## Resend: branded order emails

1. Create an account at https://resend.com and choose the free plan initially.
2. Add `mukkys3d.com` as a sending domain. Copy the exact DNS records Resend supplies into the domain's DNS provider. Wait for verification; preserve existing website and mailbox records.
3. Create a sending API key, restricted to the verified domain where available.
4. Set these Coolify application runtime variables (Compose forwards them only to `medusa`):

```dotenv
SHOP_EMAIL_ENABLED=true
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=<Resend API key>
SMTP_FROM=orders@mukkys3d.com
SMTP_FROM_NAME=Mukky's 3D Shop
SMTP_REPLY_TO=<your real support inbox>
```

The angle-bracket values are placeholders. Configuring this SMTP sender does not configure an inbox for customer replies. `SMTP_REPLY_TO` can be your existing Gmail address. The sending address must belong to the verified domain. Resend uses the existing encrypted SMTP provider and branded HTML/text templates; no second email subscriber is added.

Redeploy after configuring, then run the test described in [shop-email.md](./shop-email.md). Check Resend's delivery logs and the actual receiving mailbox. Test a sandbox order and shipment before relying on customer notifications. Disabled events are not replayed automatically.

As checked on 9 November 2026, the free transactional plan includes 3,000 emails/month with a 100/day cap. All order, shipment and refund-request messages consume that allowance. Review https://resend.com/pricing and https://resend.com/docs/send-with-smtp before activation.

## Sentry: backend errors

1. Create a free Developer account at https://sentry.io and a Node.js project for the Medusa backend. Choose the project region deliberately during signup.
2. Copy its DSN into Coolify runtime `SENTRY_DSN`. Set `SENTRY_ENVIRONMENT=production`; optionally set `SENTRY_RELEASE` to the deployed commit. Leave the DSN blank to disable reporting.
3. Redeploy. Configure an issue alert in Sentry for new backend errors.
4. Verify with a deliberate, non-customer test exception in a staging deployment. Check the received event for diagnostic stacks and absence of customer data. Do not introduce a public endpoint that deliberately crashes production.

The SDK uses Medusa's instrumentation entry point. The API error handler reports server errors and then delegates to Medusa's native handler. Normal validation/authentication errors are not reported. Capture failures cannot replace the native HTTP response.

This is backend error reporting only: no storefront/browser monitoring, session recordings, performance tracing, console capture or request instrumentation. Events are restricted to diagnostic exception types, stack frames and deployment identifiers; error messages, request bodies, headers, user fields, breadcrumbs and local variables are omitted. Use backend logs for the detailed message. This intentionally trades some debugging detail for privacy. It is not a security audit or a guarantee that the shop is secure.

The free Developer plan has usage limits. Do not enable paid usage without deciding a budget. See https://sentry.io/pricing/ for current allowances.

## ShipStation: account selection required

ShipStation's shipping dashboard and ShipStation API are different products with different plans. As checked on 9 November 2026, the UK dashboard lists Free (50 shipments/month), Starter (from £10/month), and Standard (from £25/month). Its comparison table excludes API access and custom-store imports from Free and Starter; these are listed under Standard. Postage is extra. A separate free API tier exists, but that does not establish that your desired Royal Mail services or dashboard features are included. Check https://www.shipstation.com/en-gb/pricing/ and https://docs.shipstation.com/products-and-plans before subscribing.

First decide whether you need a dashboard to manage orders and print labels, or only an API to buy labels from Medusa. Confirm Royal Mail availability, your business/carrier eligibility and API access with ShipStation. Do not subscribe just to try the code.

No ShipStation fulfillment provider has been installed or enabled yet. Existing weight bands and delivery options continue to work. The next integration needs a chosen account, its available carrier/service IDs, package dimensions and dispatch address. The official Medusa integration guide is https://docs.medusajs.com/resources/integrations/guides/shipstation.

Buying a shipping label incurs postage. Test rate lookup first; create labels only through an intentional admin fulfillment action, with duplicate protection. A label connection alone does not automatically import orders, update delivery status or replace the shop's checkout weight bands; each of those capabilities needs explicit wiring and validation.
