import { privateErrorEvent } from "../observability"
import { monitoredErrorHandler } from "../../api/monitored-error-handler"
import { MedusaError } from "@medusajs/framework/utils"
import * as Sentry from "@sentry/node"

jest.mock("@sentry/node", () => ({ isEnabled: jest.fn(), captureException: jest.fn() }))

describe("Backend error reporting", () => {
  beforeEach(() => jest.resetAllMocks())

  it("removes customer data, request details, messages, locals and source context", () => {
    const result = privateErrorEvent({
      type: undefined,
      event_id: "event-1", environment: "test",
      message: "secret-message", user: { email: "private@example.com" },
      request: { url: "https://shop.test/?token=secret", headers: { authorization: "secret" } },
      extra: { order: "private" }, breadcrumbs: [{ message: "private" }],
      exception: { values: [{ type: "TypeError", value: "secret-message", stacktrace: { frames: [{
        filename: "C:\\Users\\private-user\\shop\\src\\api\\route.ts?token=secret",
        function: "handleOrder", lineno: 42, colno: 9,
        vars: { password: "secret" }, context_line: "private source",
      }] } }] },
    })
    expect(result.exception?.values?.[0].stacktrace?.frames?.[0]).toEqual({
      filename: "src/api/route.ts", function: "handleOrder", lineno: 42, colno: 9, in_app: undefined,
    })
    expect(JSON.stringify(result)).not.toMatch(/secret|private|authorization|password/)
    expect(result.event_id).toBe("event-1")
  })

  it("does not expose an absolute path for files outside application source", () => {
    const result = privateErrorEvent({ type: undefined, exception: { values: [{ stacktrace: { frames: [{
      filename: "/home/private-user/shop/instrumentation.js", function: "user@example.com",
    }] } }] } })
    expect(result.exception?.values?.[0].stacktrace?.frames?.[0]).toMatchObject({ filename: "instrumentation.js" })
    expect(JSON.stringify(result)).not.toMatch(/private-user|user@example/)
  })

  it.each([
    [new MedusaError(MedusaError.Types.INVALID_DATA, "Bad input"), 400, false],
    [new MedusaError(MedusaError.Types.UNAUTHORIZED, "Login required"), 401, false],
    [new Error("Unexpected failure"), 500, true],
  ])("preserves Medusa's HTTP response while reporting only server failures", (error, status, report) => {
    jest.mocked(Sentry.isEnabled).mockReturnValue(true)
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const req = { scope: { resolve: () => ({ error: jest.fn(), info: jest.fn() }) } }
    monitoredErrorHandler(error, req as never, res as never, jest.fn())
    expect(res.status).toHaveBeenCalledWith(status)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(Sentry.captureException).toHaveBeenCalledTimes(report ? 1 : 0)
  })

  it("still responds when monitoring itself fails", () => {
    jest.mocked(Sentry.isEnabled).mockReturnValue(true)
    jest.mocked(Sentry.captureException).mockImplementation(() => { throw new Error("Unavailable") })
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const req = { scope: { resolve: () => ({ error: jest.fn(), info: jest.fn() }) } }
    monitoredErrorHandler(new Error("Failure"), req as never, res as never, jest.fn())
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledTimes(1)
  })
})
