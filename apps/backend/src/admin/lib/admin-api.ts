/**
 * Calls this shop's admin API with the signed-in admin's session.
 * With a body it sends a POST, without one a GET. Throws the API's own
 * message when the call fails, so a widget can show it.
 */
export async function adminApi<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${(__BACKEND_URL__ || "").replace(/\/$/, "")}/admin${path}`, {
    credentials: "include",
    cache: "no-store",
    method: body ? "POST" : "GET",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "The request failed. Check you are still signed in and try again.")
  }

  return response.json()
}
