import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    { resolve: "./src/modules/refund-request" },
    ...(process.env.REDIS_URL ? [{
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        jobOptions: { attempts: 5, backoff: { type: "exponential", delay: 30000 }, removeOnComplete: { age: 86400 }, removeOnFail: { age: 604800 } },
      },
    }] : []),
    ...(process.env.SHOP_EMAIL_ENABLED === "true" ? [{
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          { resolve: "@medusajs/medusa/notification-local", id: "local", options: { channels: ["feed"] } },
          {
            resolve: "./src/modules/email", id: "shop-smtp",
            options: {
              channels: ["email"], host: process.env.SMTP_HOST || "smtp.gmail.com",
              port: Number(process.env.SMTP_PORT || 587), user: process.env.SMTP_USER,
              password: process.env.SMTP_PASSWORD, from: process.env.SMTP_FROM || process.env.SMTP_USER,
              from_name: process.env.SMTP_FROM_NAME || "Mukky's 3D Shop",
              reply_to: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || process.env.SMTP_USER,
              storefront_url: process.env.STOREFRONT_URL || "https://mukkys3d.com",
            },
          },
        ],
      },
    }] : []),
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [{
          resolve: "@medusajs/medusa/locking-postgres",
          id: "locking-postgres",
          is_default: true,
        }],
      },
    },
    ...(process.env.STRIPE_API_KEY && process.env.STRIPE_WEBHOOK_SECRET ? [{
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [{
          resolve: "@medusajs/medusa/payment-stripe",
          id: "stripe",
          options: {
            apiKey: process.env.STRIPE_API_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            capture: true,
            automatic_payment_methods: true,
          },
        }],
      },
    }] : []),
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "static",
              backend_url: `${(process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}/static`,
            },
          },
        ],
      },
    },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: {
      connection: { ssl: false },
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
