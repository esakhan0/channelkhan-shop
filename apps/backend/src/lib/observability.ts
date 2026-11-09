import type { ErrorEvent } from "@sentry/node"

function diagnosticFilename(filename?: string) {
  const path = filename?.replace(/\\/g, "/").split("?")[0].split("#")[0]
  if (!path) return undefined
  const relative = path.match(/(?:^|\/)((?:src|node_modules)\/.*)$/)?.[1]
  return relative || path.split("/").pop()
}

/** Allowlist diagnostic fields; never transmit request, customer or payment data. */
export function privateErrorEvent(event: ErrorEvent): ErrorEvent {
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: "node",
    level: event.level,
    environment: event.environment,
    release: event.release,
    exception: {
      values: event.exception?.values?.map(exception => ({
        type: /^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(exception.type || "") ? exception.type : "Error",
        // Error messages can embed SQL, addresses, tokens or payment details.
        value: "Server error; message omitted for privacy. Inspect the server log for details.",
        stacktrace: {
          frames: exception.stacktrace?.frames?.map(frame => ({
            filename: diagnosticFilename(frame.filename),
            function: /^[\w.$ <>\[\]-]{1,160}$/.test(frame.function || "") ? frame.function : undefined,
            lineno: frame.lineno,
            colno: frame.colno,
            in_app: frame.in_app,
          })),
        },
        mechanism: exception.mechanism ? {
          type: exception.mechanism.type,
          handled: exception.mechanism.handled,
        } : undefined,
      })),
    },
  }
}
