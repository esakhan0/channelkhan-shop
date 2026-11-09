# Customer password resets

Customers use **Account → Forgot password?**, enter their account email, then follow the emailed link and choose a new password. This uses Medusa's native email/password reset workflow and token verification; the shop only supplies the forms, email subscriber and template. It does not reset administrator accounts.

## Deployment and email configuration

Deploy both backend and storefront. The existing SMTP provider must be configured with `SHOP_EMAIL_ENABLED=true`, the Brevo SMTP credentials and a verified sender. Set backend `STOREFRONT_URL=https://mukkys3d.com`. Keep credentials in Coolify secrets, never in source control. No additional mail service is needed.

The subscriber accepts only native customer reset events. It fixes the destination to the configured shop's `/gb/reset-password` page and sends to the native account identifier, ignoring caller-supplied metadata. Disable click tracking/link rewriting for these transactional emails and verify that Brevo preserves the URL fragment.

Reset tokens are placed in a URL fragment, removed from browser history when the form opens, and never logged by the auth SDK. The link is still a secret: it passes through the email service and privileged notification storage. Do not log email bodies, authorization headers or reset form bodies. Restrict notification/database access and apply retention to sensitive notification records.

## Security behaviour and limits

- Native tokens expire after 15 minutes, are single-use and are invalidated by a newer reset request. Opening the page does not consume a token; submitting the new password does.
- Native token validation selects the account. Changing an email or account ID in the update body cannot select another account.
- Validly formatted known and unknown addresses receive the same public request response.
- New passwords must be 15–128 characters, enforced in the form/server action and on the backend update endpoint. Password managers and spaces work. Medusa handles password hashing.
- A successful reset clears this browser's storefront auth cookie. **It does not revoke existing sessions or JWTs on other devices.** Do not describe this as “sign out everywhere.” A compromised-account response still needs a deliberate session-revocation strategy.
- Production rate limiting remains a deployment requirement. Protect the reset-request/update and login endpoints, and the storefront Server Actions which forward these requests. Use a trusted proxy/client-IP setup and account cooldowns; do not blindly trust spoofable forwarded headers or rate-limit all shoppers as the single storefront server IP. This change does not configure Coolify/Cloudflare rate limiting.
- Medusa may consume a valid reset token before the custom password-length guard rejects a direct API request. Request a fresh link after such a rejection. The storefront validates length before calling Medusa.

## Verification

Automated checks cover native HTTP requests against an isolated database: unknown-address responses, missing/forged/login/expired tokens, newer-link invalidation, cross-account tampering, password-policy enforcement, token reuse and simultaneous submissions. Email tests cover branded HTML/plain text, recipient and URL restrictions, and exclusion of administrator events.

After deployment, request a reset for a test customer through the shop, check the actual Brevo message and logo, reset on mobile, and verify old-password rejection and new-password sign-in. Open the same link again and verify rejection. Check that no reset credentials appear in logs. Live email delivery, proxy limits and deployment are not verified by the local automated tests.
