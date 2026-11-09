# Shop email setup

The backend uses Medusa's Notification Module with a Nodemailer SMTP provider. No SMTP credentials go into the storefront, Docker build arguments, source code or GitHub. The existing local `feed` provider remains enabled for Medusa admin notifications.

## Coolify runtime environment

Set these in the shop application's environment variables; Compose passes them to `medusa` only:

```dotenv
SHOP_EMAIL_ENABLED=true
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-login
SMTP_PASSWORD=your-brevo-smtp-key
SMTP_FROM=orders@mukkys3d.com
SMTP_REPLY_TO=your-support-mailbox@example.com
SMTP_FROM_NAME=Mukky's 3D Shop
```

The values above are placeholders. In Brevo, verify your sending domain and sender, then copy the Login and SMTP key from Settings → SMTP & API → SMTP. Use the SMTP key, not an API key or your account password. Enter secrets directly in Coolify, never in chat or GitHub. Set `SMTP_FROM` explicitly to your verified sender; the SMTP login may be a generated `@smtp-brevo.com` address and is not your public sender. Set `SMTP_REPLY_TO` to a real monitored mailbox. Port 587 requires STARTTLS; port 465 uses TLS immediately. Certificates are verified in both cases. See [Brevo’s SMTP setup](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP).

`STOREFRONT_URL` defaults to `https://mukkys3d.com` in Compose and must be HTTPS. Set it if the shop domain changes. Redeploy after adding runtime variables. Missing credentials with email enabled cause startup to fail visibly rather than silently discarding emails. Leaving `SHOP_EMAIL_ENABLED=false` allows setup without sending email; events skipped while disabled are not replayed later.

## Test before enabling customer emails

In Coolify's **medusa** container terminal, from `/server/apps/backend/.medusa/server`, run:

```sh
pnpm exec medusa exec ./src/scripts/test-shop-email.js
```

This sends one branded test to `SMTP_REPLY_TO`, falling back to the configured sender. Confirm it arrives in the inbox or spam folder. SMTP acceptance alone does not prove inbox delivery. Check Brevo’s transactional email logs if delivery fails. The existing branded templates and Medusa events are reused; no additional email plugin is required.

## Events and templates

| Medusa event | Email |
| --- | --- |
| `order.placed` | Order confirmation, item quantities, GBP/currency totals |
| `shipment.created` | Dispatched parcel and its tracking links |
| `delivery.created` | Parcel marked delivered |
| `order.canceled` | Order cancellation confirmation, not a refund receipt |
| `shop.refund-requested` | Acknowledgement of customer refund/cancellation request |
| `shop.refund-updated` | Staff response and request status |
| `order.transfer_requested` | Approval link to the original order email (separately gated) |

Partial shipments list only the items in that parcel. `no_notification` is respected. Delivery emails depend on Medusa marking the fulfillment delivered; this does not add automatic Royal Mail tracking updates. These emails neither capture payments nor issue refunds. Stripe payment receipts remain a separate Stripe feature. No marketing list is created.

Templates live in `apps/backend/src/modules/email/templates.ts`: cream, yellow and lavender branding, shop logo, mobile-friendly tables, escaped customer content, allowlisted HTTPS links and a text alternative. Emails have no scripts or tracking pixels. The original printer logo is bundled as a small PNG in `src/modules/email/logo.json` and attached inline using Content-ID; it does not depend on the storefront domain or an external image download. This JSON asset is imported so the TypeScript build includes it in the deployed backend. Only this fixed attachment is allowed; caller-supplied attachments are ignored. Email clients may still hide images according to their settings; the logo has alt text and the message has a text alternative.

## Retries and operational limits

Compose adds persistent Redis storage with append-only persistence. The official Medusa Redis event bus retries a failed event up to five attempts with exponential backoff, starting at 30 seconds. The Notification Module records success/failure and uses per-event idempotency keys; a PostgreSQL lock serialises duplicate sends. SMTP is not exactly-once: a lost connection after a server accepts a message can still produce a duplicate on retry. Inspect backend logs and notification records after repeated failures. Failed Redis jobs are retained for seven days; there is no new admin retry UI.

The sender uses a stable notification record ID as a compatibility workaround for Medusa 2.22.2's failed-send retry path. A database integration test verifies that retries update the same record. Recheck this workaround when upgrading Medusa.

## Guest order linking

Keep `ORDER_TRANSFER_EMAIL_ENABLED=false` until email delivery and the account-linking flow have been verified on the deployment. The subscriber reads Medusa's native transfer action and sends its token exclusively to `original_email`, never to the requesting account. Opening the link shows an explicit approval/decline page and does not itself approve a transfer.

This change prepares the sender but does **not** enable public guest linking. Token expiry and request-rate controls need a separate review before enabling that gate. Normal order/shipping/refund-request emails work independently of it.

## Verification

Unit tests cover HTML escaping, unsafe links, TLS, recipient validation, sender override rejection and error redaction. Integration tests use a disposable PostgreSQL database and mocked SMTP; they cover real Medusa order totals, duplicate event handling, failures/retries and original-recipient transfer approval. No real customer mail is sent by these tests.
