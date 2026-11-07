import { getBaseURL } from "@lib/util/env"
import { STORE_NAME, STORE_DESCRIPTION, STORE_SHARE_IMAGE } from "@lib/util/site"
import { Metadata } from "next"
import "styles/globals.css"
import "styles/brand-refresh.css"
import "styles/mobile.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  description: STORE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: STORE_NAME,
    title: `${STORE_NAME} | 3D Printed Fidget Toys`,
    description: STORE_DESCRIPTION,
    locale: "en_GB",
    images: [STORE_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${STORE_NAME} | 3D Printed Fidget Toys`,
    description: STORE_DESCRIPTION,
    images: [STORE_SHARE_IMAGE],
  },
  title: {
    default: STORE_NAME,
    template: `%s | ${STORE_NAME}`,
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=mukky-20261102", sizes: "any" },
      { url: "/brand/mukkys-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/mukkys-apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
