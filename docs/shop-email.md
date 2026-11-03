# Shop email setup

The backend uses Medusa's Notification Module with a Nodemailer SMTP provider. No SMTP credentials go into the storefront, Docker build arguments, source code or GitHub. The existing local `feed` provider remains enabled for Medusa admin notifications.

## Coolify runtime environment

Set these in the shop application's environment variables; Compose passes them to `medusa` only:

```dotenv
SHOP_EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-shop-address@gmail.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM_NAME=Mukky's 3D Shop
```

The address and password above are placeholders. Enable Google 2-Step Verification and create a dedicated app password. Use the app password, not the Google login password. Do not post it in chat. `SMTP_FROM` and `SMTP_REPLY_TO` default to `SMTP_USER` when blank. Gmail requires an authorised sender mailbox or verified alias. Changing the display name does not change the address. Port 587 requires STARTTLS; port 465 uses TLS immediately. Certificates are verified in both cases.

`STOREFRONT_URL` defaults to `https://mukkys3d.com` in Compose and must be HTTPS. Set it if the shop domain changes. Redeploy after adding runtime variables. Missing credentials with email enabled cause startup to fail visibly rather than silently discarding emails. Leaving `SHOP_EMAIL_ENABLED=false` allows setup without sending email; events skipped while disabled are not replayed later.

## Test before enabling customer emails

In Coolify's **medusa** container terminal, from `/server/apps/backend/.medusa/server`, run:

```sh
pnpm exec medusa exec ./src/scripts/test-shop-email.js
```

This sends one branded test only to the configured sender. Confirm it arrives in the inbox or spam folder. SMTP acceptance alone does not prove inbox delivery. Gmail has sending limits and is intended here for a small initial volume. Larger volumes should use a transactional provider by changing SMTP settings.

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

Templates live in `apps/backend/src/modules/email/templates.ts`: cream, yellow and lavender branding, shop logo, mobile-friendly tables, escaped customer content, allowlisted HTTPS links and a text alternative. Emails have no scripts, attachments or tracking pixels. Logos are remotely loaded and may be blocked by an email client's image settings; text and links still work.

## Retries and operational limits

Compose adds persistent Redis storage with append-only persistence. The official Medusa Redis event bus retries a failed event up to five attempts with exponential backoff, starting at 30 seconds. The Notification Module records success/failure and uses per-event idempotency keys; a PostgreSQL lock serialises duplicate sends. SMTP is not exactly-once: a lost connection after a server accepts a message can still produce a duplicate on retry. Inspect backend logs and notification records after repeated failures. Failed Redis jobs are retained for seven days; there is no new admin retry UI.

The sender uses a stable notification record ID as a compatibility workaround for Medusa 2.22.2's failed-send retry path. A database integration test verifies that retries update the same record. Recheck this workaround when upgrading Medusa.

## Guest order linking

Keep `ORDER_TRANSFER_EMAIL_ENABLED=false` until email delivery and the account-linking flow have been verified on the deployment. The subscriber reads Medusa's native transfer action and sends its token exclusively to `original_email`, never to the requesting account. Opening the link shows an explicit approval/decline page and does not itself approve a transfer.

This change prepares the sender but does **not** enable public guest linking. Token expiry and request-rate controls need a separate review before enabling that gate. Normal order/shipping/refund-request emails work independently of it.

## Verification

Unit tests cover HTML escaping, unsafe links, TLS, recipient validation, sender override rejection and error redaction. Integration tests use a disposable PostgreSQL database and mocked SMTP; they cover real Medusa order totals, duplicate event handling, failures/retries and original-recipient transfer approval. No real customer mail is sent by these tests.
