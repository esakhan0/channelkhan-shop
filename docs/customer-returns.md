# Refund and cancellation requests

Customers use My Account > Orders > Request a refund and select items and quantities. My Account > Refunds shows their requests and staff replies. Existing physical returns remain accessible through a history link; old return-form URLs redirect to the new form.

## What changes an order

The form creates a private request in the Medusa `refund_request` module. It does not cancel an order, stop dispatch, receive inventory, create return shipping, or issue a payment refund. Staff open Orders > Refund requests in Medusa Admin, open the linked order, and use Medusa's native refund/cancellation/return controls as appropriate. Staff can post a customer-visible reply and mark a request reviewing, closed, or declined. Closing a request does not mean money was refunded; the order's payment status remains authoritative.

Faulty/incorrect-item requests require delivered quantities on the server. Fulfilled or shipped quantities alone are not treated as delivered. Cancellation notices can be submitted before or after delivery for review, without a mandatory reason. The form explains when dispatch may already be underway. Staff must check the applicable cancellation window and whether the goods were genuinely personalised; the code does not automatically deny statutory rights. Standard UK online goods normally have change-of-mind cancellation rights, while genuinely personalised goods can be exempt. Faulty/not-as-described rights remain relevant to both. See https://www.gov.uk/accepting-returns-and-giving-refunds.

## Server protections

- Both customer read and write routes require a Medusa-authenticated customer. Ownership is checked by customer ID, not email or a supplied order reference alone.
- Strict request validation excludes customer IDs, status, reviewer IDs, payment amounts and inventory actions. Item titles come from the stored order. Fault details are required for a faulty-item request.
- Quantities must be positive integers belonging to the owned order. Canceled orders and quantities already in native returns are excluded.
- PostgreSQL-backed locking allows only one open request per order, including simultaneous submissions. Staff closure/decline permits another request if needed.
- Customer responses use an explicit field allowlist and no-store caching. Only authenticated admin users can review requests.
- The old POST /store/returns override now rejects direct creation; removing the override would expose the native route again. Staff arrange physical returns after review.

Calling an API directly is not inherently forbidden: the same authentication, ownership and eligibility checks apply to every request. There is no customer endpoint here that moves money.

## Guest orders and email

Creating an account with the same email does not auto-claim guest orders. Native Medusa order transfers use a confirmation token associated with a specific pending order change and destination customer. The token must be sent to the original order inbox, never returned to the requester or sent to a newly supplied address. An order ID or receipt screenshot alone is not sufficient authorization. Existing account-owned orders must not be reassigned without owner approval.

Email delivery is not configured in this repository. Customer transfer requests therefore fail closed with 503 while ORDER_TRANSFER_EMAIL_ENABLED is absent/false. The storefront no longer exposes the recipient address or claims an email was sent on that failure. Do not enable the flag until a real notification provider and order.transfer_requested subscriber deliver the native confirmation token, with rate limiting, expiry policy, retry/error monitoring and end-to-end tests. The flag does not itself send emails. This release does not implement that email integration.

Transfer acceptance/decline pages now require an explicit button press rather than mutating ownership on page load. Token pages are noindex and use no-referrer metadata. Native token validation remains responsible for accepting/declining the pending transfer. Actual refund requests always require login after ownership is established.

Publish a working support contact for guest customers before launch. Photo attachments and request-update emails are not part of this release.

## Deployment

Deploy backend and storefront from the same commit. Backend startup already runs `medusa db:migrate`; this applies the generated refund_request table migration. No new package or payment provider is needed. Verify Orders > Refund requests appears in the admin sidebar and test with a non-production order. Guest order linking remains unavailable until email delivery is configured and verified.

## Verification

`integration-tests/http/customer-refunds.spec.ts` runs against a disposable PostgreSQL database: customer/admin authorization, cross-account access, manipulated input, delivery rules, canceled orders, simultaneous duplicate requests, no automatic commerce mutations, admin replies, matching-email guest isolation, invalid/valid/replayed transfer tokens, and the retired direct-return endpoint. The test runner's framework import was corrected for pnpm dependency isolation.

Local browser checks cover item selection, quantity bounds, failed-submit retry, success, cancellation without a reason, pending requests, and desktop/mobile layout. These UI checks mock submission; backend behavior is covered by the HTTP integration suite. Live email delivery and live deployment are separate checks.
