import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type { NotificationTypes } from "@medusajs/framework/types"
import nodemailer from "nodemailer"
import { renderShopEmail, safeHttpsUrl } from "./templates"
import logo from "./logo.json"

type Options = { host: string; port: number; user: string; password: string; from: string; from_name: string; reply_to: string; storefront_url: string }
const mailbox = /^[^\s<>(),;:\r\n]+@[^\s<>(),;:\r\n]+\.[^\s<>(),;:\r\n]+$/

export default class SmtpNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "shop-smtp"
  private transport: ReturnType<typeof nodemailer.createTransport>
  private options: Options

  static validateOptions(options: Options) {
    if (!options.host || ![465, 587].includes(Number(options.port)) || !options.user || !options.password ||
        !mailbox.test(options.from ?? "") || !mailbox.test(options.reply_to ?? "") || !safeHttpsUrl(options.storefront_url)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Set SMTP host, port (465 or 587), username, SMTP password/key, sender, reply address and HTTPS storefront URL")
    }
  }

  constructor(_container: Record<string, unknown>, options: Options) {
    super()
    SmtpNotificationProviderService.validateOptions(options)
    this.options = options
    this.transport = nodemailer.createTransport({
      host: options.host, port: Number(options.port), secure: Number(options.port) === 465,
      requireTLS: true, tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
      auth: { user: options.user, pass: options.password },
      connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
      disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false,
    })
  }

  async send(notification: NotificationTypes.ProviderSendNotificationDTO): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (notification.channel !== "email" || !mailbox.test(notification.to)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A single valid email recipient is required")
    }
    const message = renderShopEmail(notification.template, notification.data ?? {}, this.options)
    try {
      // Never forward arbitrary provider_data, attachments, sender overrides or raw HTML.
      const result = await this.transport.sendMail({
        from: { name: this.options.from_name, address: this.options.from },
        replyTo: this.options.reply_to, to: { address: notification.to, name: "" }, ...message,
        // Fixed bundled logo: no remote download or customer-controlled file paths.
        attachments: [{
          filename: "mukkys-logo.png", content: Buffer.from(logo.base64, "base64"),
          contentType: "image/png", contentDisposition: "inline", cid: "mukkys-logo@shop",
        }],
      })
      if (!result.accepted?.length || result.rejected?.length) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Recipient rejected")
      return { id: result.messageId }
    } catch {
      // SMTP error objects can contain credentials, recipients or message contents.
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Shop email delivery failed. Check SMTP credentials, sending limits and server connectivity.")
    }
  }
}
