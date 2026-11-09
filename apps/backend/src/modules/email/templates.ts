import { MedusaError } from "@medusajs/framework/utils"

export type ShopEmailData = {
  order_number?: string | number
  first_name?: string
  items?: { title: string; variant?: string; quantity: number; total?: string }[]
  total?: string
  subtotal?: string
  shipping?: string
  tax?: string
  discount?: string
  credit?: string
  address?: string[]
  contact_email?: string
  shipping_method?: string
  payment_method?: string
  tracking?: { number: string; url?: string }[]
  action_url?: string
  response?: string
  status?: string
  requested_by?: string
}

export type EmailBrand = { storefront_url: string; from_name: string; reply_to: string }

export const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))

export function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return
  try {
    const url = new URL(value)
    if (url.protocol === "https:" && !url.username && !url.password) return url.href
  } catch { /* Invalid URLs are rendered as plain text, never as links. */ }
}

const messages: Record<string, { title: string; subject: string; intro: string; button: string }> = {
  "order-placed": { title: "We've received your order.", subject: "We've received your order", intro: "Thanks for choosing Mukky's. Here's what you've ordered. We'll email you when your parcel is on its way.", button: "Your orders" },
  "order-shipped": { title: "Your parcel is on its way.", subject: "Your parcel is on its way", intro: "We've marked this parcel as dispatched. If your order has more than one parcel, the others may arrive separately.", button: "Your orders" },
  "order-delivered": { title: "Your parcel was marked delivered.", subject: "Your parcel has been marked delivered", intro: "This parcel has been marked as delivered. If it hasn't arrived or something isn't right, reply to this email and we'll help.", button: "Your orders" },
  "order-canceled": { title: "Your order is cancelled.", subject: "Your order has been cancelled", intro: "Your order has been cancelled. This message confirms the cancellation; it isn't a payment refund receipt. Reply if you need help with your payment.", button: "Your orders" },
  "refund-requested": { title: "We're here to help.", subject: "We've received your request", intro: "Your refund or cancellation request is with us for review. Submitting a request doesn't automatically refund a payment or stop a parcel that's already on its way.", button: "View your request" },
  "refund-updated": { title: "A helping hand.", subject: "An update on your request", intro: "There's an update on your refund or cancellation request. A request status alone doesn't confirm a payment refund.", button: "View your request" },
  "order-transfer": { title: "Your order. Your say.", subject: "Approve linking your order", intro: "Someone has asked to link this order to their shop account. Only approve if this is your account. Approval gives that account access to the order and its details. If you didn't request this, ignore or decline it.", button: "Review link request" },
  "smtp-test": { title: "Hello from Mukky's.", subject: "Your shop email is connected", intro: "This is a test of your shop's email setup. No order has been placed and no payment has been taken.", button: "Visit the shop" },
}

export function renderShopEmail(template: string, data: ShopEmailData, brand: EmailBrand) {
  const message = messages[template]
  if (!message) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unknown shop email template")
  const base = safeHttpsUrl(brand.storefront_url)
  if (!base) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Email storefront URL must use HTTPS")
  const orderLabel = data.order_number ? `Order #${data.order_number}` : "MUKKY’S WORKSHOP / EST. 2026"
  const subject = `${message.subject}${data.order_number ? ` · #${data.order_number}` : ""} | ${brand.from_name}`
  // Account/approval links can only lead to this shop. Carrier links are separate below.
  const candidate = safeHttpsUrl(data.action_url)
  const actionUrl = candidate && new URL(candidate).origin === new URL(base).origin ? candidate : `${base.replace(/\/$/, "")}/gb/account/orders`
  const logoUrl = "cid:mukkys-logo@shop"
  const rows = (data.items ?? []).map((item) => `<tr><td style="padding:14px 12px 14px 0;border-bottom:1px solid #ddd7cb;overflow-wrap:anywhere">${escapeHtml(item.title)}<br><span style="color:#69645d;font-size:13px">${item.variant ? `Variant: ${escapeHtml(item.variant)}<br>` : ""}Quantity: ${escapeHtml(item.quantity)}</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #ddd7cb;white-space:nowrap">${escapeHtml(item.total)}</td></tr>`).join("")
  const totals = [
    { label: "Subtotal (excl. shipping and taxes)", value: data.subtotal },
    { label: "Shipping (excl. tax)", value: data.shipping },
    { label: "Discount", value: data.discount && `−${data.discount}` },
    { label: "Taxes", value: data.tax },
    { label: "Credit", value: data.credit && `−${data.credit}` },
    { label: "Total", value: data.total },
  ].filter((row) => row.value !== undefined && row.value !== "")
  const summary = totals.length ? `<h2 style="font-size:19px;margin:26px 0 12px">Order summary</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.5">${totals.map((row) => `<tr style="${row.label === "Total" ? "font-size:19px;font-weight:bold" : ""}"><td style="padding:9px 12px 9px 0;${row.label === "Total" ? "border-top:1px solid #ddd7cb" : ""}">${escapeHtml(row.label)}</td><td align="right" style="padding:9px 0;white-space:nowrap;${row.label === "Total" ? "border-top:1px solid #ddd7cb" : ""}">${escapeHtml(row.value)}</td></tr>`).join("")}</table>` : ""
  const delivery = data.address?.length || data.shipping_method || data.contact_email ? `<h2 style="font-size:19px;margin:28px 0 12px">Delivery</h2><div style="font-size:14px;line-height:1.7;overflow-wrap:anywhere">${data.address?.length ? `<p><strong>Shipping address</strong><br>${data.address.map(escapeHtml).join("<br>")}</p>` : ""}${data.contact_email ? `<p><strong>Contact</strong><br>${escapeHtml(data.contact_email)}</p>` : ""}${data.shipping_method ? `<p><strong>Shipping method</strong><br>${escapeHtml(data.shipping_method)}</p>` : ""}</div>` : ""
  const payment = data.payment_method ? `<h2 style="font-size:19px;margin:28px 0 12px">Payment method</h2><p style="font-size:14px;line-height:1.7">${escapeHtml(data.payment_method)}</p>` : ""
  const tracking = (data.tracking ?? []).map((label) => {
    const url = safeHttpsUrl(label.url)
    return `<p style="margin:12px 0">Tracking: ${url ? `<a style="color:#292421" href="${escapeHtml(url)}">${escapeHtml(label.number || "Track your parcel")}</a>` : escapeHtml(label.number)}</p>`
  }).join("")
  const details = [
    data.status ? `<p><strong>Request status:</strong> ${escapeHtml(data.status)}</p>` : "",
    data.requested_by ? `<p><strong>Requested account:</strong> ${escapeHtml(data.requested_by)}</p>` : "",
    data.response ? `<div style="padding:20px;background:#eee6fa;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(data.response)}</div>` : "",
  ].join("")
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f7f4e9;color:#292421;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(message.subject)}. ${escapeHtml(orderLabel)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px">
<tr><td align="center" style="padding:16px 0 28px"><a href="${escapeHtml(base)}"><img src="${escapeHtml(logoUrl)}" width="180" alt="Mukky's 3D Shop" style="display:block;width:180px;max-width:100%;height:auto;border:0"></a></td></tr>
<tr><td style="border:2px solid #292421;border-radius:20px;background:#fffdf5;overflow:hidden">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td style="padding:18px 24px;background:#ded1f4;border-bottom:2px solid #292421;font-size:12px;font-weight:bold;letter-spacing:1.4px">${escapeHtml(orderLabel)}</td></tr>
<tr><td style="padding:30px 24px"><h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.15;margin:0 0 22px;letter-spacing:-1px">${escapeHtml(message.title)}</h1>
<p style="font-size:16px;line-height:1.7">${data.first_name ? `Hi ${escapeHtml(data.first_name)},<br>` : ""}${escapeHtml(message.intro)}</p>
${rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:15px;line-height:1.5;margin:24px 0">${rows}</table>` : ""}
${summary}${delivery}${payment}
${details}${tracking}
<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:28px"><tr><td bgcolor="#f9d84b" style="border:2px solid #292421;border-radius:10px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:15px 24px;color:#292421;text-decoration:none;font-weight:bold;font-size:15px">${escapeHtml(message.button)} &rarr;</a></td></tr></table>
<p style="font-size:13px;line-height:1.6;color:#69645d;margin-top:24px">${template === "order-transfer" ? "Opening the link won't approve the request. You'll choose on the next page. Keep this link private." : "Checked out as a guest? Your updates will still arrive by email. You can reply here for help."}</p>
</td></tr><tr><td align="center" style="background:#f9d84b;padding:16px;font-size:12px;font-weight:bold;letter-spacing:1.5px;border-top:2px solid #292421">SMALL OBJECTS. BIG PERSONALITY.</td></tr></table></td></tr>
<tr><td align="center" style="padding:26px 16px;font-size:13px;line-height:1.8;color:#69645d">${escapeHtml(brand.from_name)} &middot; 3D printed fidget toys and more.<br>Need a helping hand? Reply to this email.<br><a href="${escapeHtml(base.replace(/\/$/, "") + "/gb/returns")}" style="color:#69645d">Returns &amp; refunds</a> &nbsp; / &nbsp; <a href="${escapeHtml(base.replace(/\/$/, "") + "/gb/privacy")}" style="color:#69645d">Privacy</a></td></tr>
</table></td></tr></table></body></html>`
  const text = [brand.from_name, orderLabel, message.title, message.intro,
    ...(data.items ?? []).map((item) => `${item.quantity} × ${item.title}${item.variant ? ` (${item.variant})` : ""}${item.total ? ` — ${item.total}` : ""}`),
    ...totals.map((row) => `${row.label}: ${row.value}`),
    data.address?.length && `Shipping address:\n${data.address.join("\n")}`,
    data.contact_email && `Contact: ${data.contact_email}`, data.shipping_method && `Shipping method: ${data.shipping_method}`,
    data.payment_method && `Payment method: ${data.payment_method}`,
    data.status && `Request status: ${data.status}`, data.requested_by && `Requested account: ${data.requested_by}`, data.response,
    ...(data.tracking ?? []).map((label) => `Tracking: ${label.number} ${safeHttpsUrl(label.url) ?? ""}`),
    `${message.button}: ${actionUrl}`, "Need help? Reply to this email.",
  ].filter(Boolean).join("\n\n")
  return { subject, html, text }
}
