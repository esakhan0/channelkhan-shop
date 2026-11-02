# Customer return requests

Customers can open My Account > Orders > Request a return, choose delivered items and quantities, and supply a reason and notes. My Account > Returns shows their native Medusa return records. A request does not receive goods, cancel an order or issue a refund. Staff review and process it in Medusa Admin.

## Deployment and store setup

Deploy both the backend and storefront from the same commit. The backend Docker startup already runs medusa db:migrate; this applies the official PostgreSQL locking provider's migrations. No new environment variables, external services or custom data models are required.

In Medusa Admin > Settings > Locations & Shipping, configure an appropriate return shipping option for the customer's service zone. It must:

- Be a return option, enabled for the storefront.
- Have a flat rate in the order currency and the appropriate shipping profile.
- Belong to a fulfillment set linked to a stock location with a return address and fulfillment provider.
- Be accessible through the order's sales channel.

Set the actual return postage policy and price yourself; the code does not invent them. The native workflow creates the return fulfillment through the selected provider. Automatic carrier labels and Royal Mail integration are not included. Orders without an original cart or an available flat return option show a contact fallback.

Record delivery in Medusa before customers request returns. Shipping/fulfillment alone is not delivery, and this change does not automatically import carrier delivery events. Canceled orders and quantities already requested, received or dismissed are excluded.

Publish a working support contact and return instructions before offering the flow to customers. Email sending is not configured by this change. Photo attachments are not included. Guests must have their order associated with their signed-in customer account before using this form; guest support still requires a contact channel. This account feature is not a substitute for publishing the shop's returns policy.

## Permissions and framework integration

POST /store/returns keeps Medusa's createAndCompleteReturnOrderWorkflow. The application route adds customer authentication, ownership/delivery/quantity checks, a strict list of allowed input fields, and Medusa's PostgreSQL lock around validation and creation. The shared per-order lock prevents two simultaneous customer submissions from requesting the same available quantity twice. Neither frontend validation nor knowing an order ID is accepted as authorization.

Customers cannot set receive_now=true, a shipping price, a refund amount or a stock location. Medusa calculates the shipping charge. Staff still use the native Admin return and refund tools.

GET /store/account/returns lists only the authenticated customer's records, with pagination. GET /store/account/returns/:id uses an owned order ID to fetch form data. Both return limited fields and private, no-store responses; the storefront also disables caching for these calls.

## Verification

The disposable PostgreSQL integration suite covers unauthenticated access, another customer's reads/writes, invalid and excessive quantities, undelivered items, privileged field injection, native return creation, isolated history, repeated requests and simultaneous duplicate submissions. It checks that creation neither receives items nor creates a refund.

Run the backend integration-tests/http/customer-returns.spec.ts suite using the repository's integration-test command with a disposable PostgreSQL database, never the live shop database. Desktop and narrow-screen form checks cover item selection, validation, failed-submit retry and success.
