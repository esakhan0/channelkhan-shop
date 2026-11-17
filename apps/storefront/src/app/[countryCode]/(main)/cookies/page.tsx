import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Cookies",
  description: `The cookies ${STORE_NAME} uses and why.`,
}

// Keep this list in step with src/lib/data/cookies.ts, src/lib/data/locale-actions.ts
// and src/middleware.ts. Every cookie the storefront sets is named there.
const cookies = [
  {
    name: "_medusa_cart_id",
    purpose: "Remembers your basket, so it is still there as you browse and when you come back.",
    lasts: "7 days",
  },
  {
    name: "_shop_cart_access",
    purpose: "Shows that the basket and checkout belong to your browser, so nobody else can open them.",
    lasts: "7 days",
  },
  {
    name: "_medusa_jwt",
    purpose: "Keeps you signed in to your account. Only set when you sign in.",
    lasts: "7 days",
  },
  {
    name: "_medusa_pending_customer",
    purpose: "Holds the details you typed when creating an account until you confirm your email address.",
    lasts: "Up to 1 day",
  },
  {
    name: "_shop_order_…",
    purpose: "Lets the browser that placed an order open its confirmation and order page.",
    lasts: "7 days",
  },
  {
    name: "_medusa_cache_id",
    purpose: "A random ID that keeps the pages prepared for you, such as your basket, separate from other visitors'. It does not identify you.",
    lasts: "1 day",
  },
  {
    name: "_medusa_locale",
    purpose: "Remembers your language. Only set if you choose one.",
    lasts: "1 year",
  },
]

// Names and lifetimes as published in Stripe's own cookie policy (linked below).
const stripeCookies = [
  {
    name: "__stripe_mid",
    purpose: "Helps Stripe detect and prevent payment fraud.",
    lasts: "1 year",
  },
  {
    name: "__stripe_sid",
    purpose: "Helps Stripe detect and prevent payment fraud during your visit.",
    lasts: "30 minutes",
  },
]

// On a phone each row stacks into a small block (see .mk-cookie-table in
// styles/minimal.css). The explicit roles keep it a table for screen readers
// once the CSS has changed how the rows are laid out.
const CookieTable = ({ rows }: { rows: typeof cookies }) => (
  <table className="mk-cookie-table" role="table">
    <thead role="rowgroup">
      <tr role="row">
        <th scope="col" role="columnheader">Cookie</th>
        <th scope="col" role="columnheader">What it does</th>
        <th scope="col" role="columnheader">How long it lasts</th>
      </tr>
    </thead>
    <tbody role="rowgroup">
      {rows.map((cookie) => (
        <tr key={cookie.name} role="row">
          <td role="cell"><code>{cookie.name}</code></td>
          <td role="cell">{cookie.purpose}</td>
          <td role="cell" data-label="Lasts">{cookie.lasts}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default function CookiesPage() {
  return (
    <PolicyPage title="Cookies">
      <p>Last updated: 13 November 2026.</p>
      <p>
        Cookies are small files a website saves in your browser. {STORE_NAME} only
        uses the ones the shop needs to work: to remember your basket, keep you
        signed in and take payment safely. We do not use advertising, analytics
        or social media cookies, tracking pixels or similar tools, and we do not
        track you across other websites.
      </p>

      <h2>Cookies we set</h2>
      <p>These are set by this shop and are only read by this shop.</p>
      <CookieTable rows={cookies} />

      <h2>Cookies set by Stripe at checkout</h2>
      <p>
        Card and wallet payments are handled by Stripe. When you reach the
        payment step, Stripe sets its own cookies to process your payment and
        to detect and prevent fraud. They are not set while you are only
        browsing the shop.
      </p>
      <CookieTable rows={stripeCookies} />
      <p>
        See{" "}
        <a href="https://stripe.com/gb/legal/cookies-policy">Stripe&apos;s cookie policy</a>{" "}
        for the full list and how Stripe uses them.
      </p>

      <h2>Why there is no cookie banner</h2>
      <p>
        UK law asks websites to get your agreement before using cookies that
        are not needed, such as advertising or tracking cookies. Every cookie
        above is needed to provide something you have asked for: a basket, an
        account, a payment or your chosen language. Because we do not use
        optional cookies, there is nothing to accept or reject. If that ever
        changes, we will ask you first.
      </p>

      <h2>Controlling cookies</h2>
      <p>
        You can block or delete cookies in your browser settings. If you block
        them, the basket, sign-in and checkout will not work.
      </p>
      <p>
        The language cookie is only saved if you pick a language. Choosing
        another language replaces it, and deleting this site&apos;s cookies in
        your browser removes it; the shop then goes back to its usual language.
      </p>

      <p>
        For how we handle personal information, see our{" "}
        <LocalizedClientLink href="/privacy">privacy policy</LocalizedClientLink>.
        Questions? Email{" "}
        <a className="break-all" href="mailto:mukkys3dshop@gmail.com">mukkys3dshop@gmail.com</a>.
      </p>
    </PolicyPage>
  )
}
