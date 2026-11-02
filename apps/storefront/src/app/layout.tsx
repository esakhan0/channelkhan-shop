import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import "styles/brand-refresh.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
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
