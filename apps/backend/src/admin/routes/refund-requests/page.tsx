import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Alert, Badge, Button, Container, Heading, Input, Text, Textarea, usePrompt } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"

type Request = {
  id: string; order_id: string; order_display_id: number; kind: string; status: string
  customer_note: string; response: string; created_at: string
  items: { id: string; title: string; quantity: number }[]
  resolution?: { state: string; action: string; amount?: number } | null
}

const statuses = { pending: "New", reviewing: "In review", closed: "Closed", declined: "Declined" }
type ResolutionContext = { order_status: string; currency_code: string; can_cancel: boolean
  payments: { id: string; provider_id: string; refundable: number }[] }

async function requestApi<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${(__BACKEND_URL__ || "").replace(/\/$/, "")}/admin/refund-requests${path}`, {
    credentials: "include", cache: "no-store", method: body ? "POST" : "GET",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(response.status >= 500 ? "The action did not finish normally. Refresh and check the order/payment history before retrying." : error.message || "Unable to load or save requests. Check your admin session.")
  }
  return response.json()
}

const RequestCard = ({ request }: { request: Request }) => {
  const queryClient = useQueryClient()
  const [response, setResponse] = useState(request.response)
  const [processing, setProcessing] = useState(false)
  const [paymentId, setPaymentId] = useState("")
  const [amount, setAmount] = useState("")
  const prompt = usePrompt()
  const open = ["pending", "reviewing"].includes(request.status) && !request.resolution
  const context = useQuery({
    queryKey: ["request-resolution", request.id], enabled: processing,
    queryFn: () => requestApi<ResolutionContext>(`/${request.id}/resolve`), staleTime: 0,
  })
  const update = useMutation({
    mutationFn: (status: string) => requestApi(`/${request.id}`, { status, response }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-refund-requests"] }),
  })
  const resolve = useMutation({
    mutationFn: () => requestApi(`/${request.id}/resolve`, request.kind === "cancellation"
      ? { action: "cancel_order", response }
      : { action: "refund_payment", payment_id: paymentId, amount: Number(amount), response }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["customer-refund-requests"] }),
  })
  const busy = update.isPending || resolve.isPending
  const payment = context.data?.payments.find((payment) => payment.id === paymentId)
  const validAction = request.kind === "cancellation" ? context.data?.can_cancel :
    payment && Number(amount) > 0 && Number(amount) <= payment.refundable
  const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: context.data?.currency_code || "GBP" }).format(value)
  const confirm = async () => {
    const accepted = await prompt({
      title: request.kind === "cancellation" ? `Cancel order #${request.order_display_id}?` : `Refund ${money(Number(amount))}?`,
      description: request.kind === "cancellation"
        ? "This cancels the entire order and refunds captured payments through Medusa. It cannot be undone."
        : "This sends money back through the original payment provider. It does not cancel the order or create a physical return.",
      confirmText: request.kind === "cancellation" ? "Cancel and refund order" : "Issue refund",
    })
    if (accepted) resolve.mutate()
  }
  return <Container className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Link className="text-ui-fg-interactive" to={`/orders/${request.order_id}`}>Order #{request.order_display_id} ↗</Link>
      <Badge>{statuses[request.status as keyof typeof statuses] || request.status}</Badge>
    </div>
    <Text weight="plus">{request.kind === "cancellation" ? "Cancellation request" : "Faulty-item refund request"}</Text>
    <Text size="small">{new Date(request.created_at).toLocaleString()}</Text>
    <ul>{request.items.map((item) => <li key={item.id}><Text>{item.quantity} × {item.title}</Text></li>)}</ul>
    <Text className="whitespace-pre-wrap">{request.customer_note}</Text>
    <label className="text-ui-fg-subtle text-sm">Reply shown in the customer’s account
      <Textarea value={response} maxLength={2000} onChange={(event) => setResponse(event.target.value)} />
    </label>
    {update.isError && <Alert variant="error">{update.error.message}</Alert>}
    {resolve.isError && <Alert variant="error">{resolve.error.message}</Alert>}
    {request.resolution?.state === "started" && <Alert variant="warning">An action was started. Check the order’s payment history and workflow status before doing anything else. This request cannot send another refund automatically.</Alert>}
    {request.resolution?.state === "completed" && <Text>Processed through Medusa. The order contains the current payment and cancellation records.</Text>}
    {request.resolution?.state === "reconciled" && <Text>Closed after manual payment review.</Text>}
    {request.resolution?.state === "needs_review" && <Alert variant="warning">Check the payment provider and order history. After reconciling the payment, write the outcome below and close the request.</Alert>}
    {update.isSuccess && <Text role="status">Response saved.</Text>}
    <div className="flex flex-wrap gap-2">
      {open && <Button disabled={busy} onClick={() => setProcessing(!processing)}>Accept &amp; process</Button>}
      {(["reviewing", "closed", "declined"] as const).map((status) => <Button key={status}
        variant="secondary" disabled={busy || response.trim().length < 3 || (!!request.resolution && !(request.resolution.state === "needs_review" && status === "closed"))}
        onClick={() => update.mutate(status)}>
        {status === "reviewing" ? "Mark reviewing" : status === "closed" ? "Close request" : "Decline request"}
      </Button>)}
    </div>
    {processing && open && <div className="flex flex-col gap-3 rounded-lg border border-ui-border-base p-4">
      {context.isPending && <Text>Checking the order and payments…</Text>}
      {context.isError && <Alert variant="error">Unable to check the order. Refresh and try again.</Alert>}
      {context.data && <>
        <Text>Order status: {context.data.order_status}</Text>
        {request.kind === "cancellation" ? <Text>{context.data.can_cancel
          ? "Accepting cancels the whole order and refunds any captured payments."
          : "This needs manual handling: the request covers only part of the order, fulfilment has started, or the order is already cancelled/completed. Open the order above to review it."}</Text>
          : <>
            <label>Payment
              <select className="w-full rounded border border-ui-border-base bg-ui-bg-base p-2" value={paymentId} onChange={(event) => setPaymentId(event.target.value)}>
                <option value="">Select a captured payment</option>
                {context.data.payments.filter((payment) => payment.refundable > 0).map((payment) => <option key={payment.id} value={payment.id}>{payment.provider_id} · {money(payment.refundable)} refundable · {payment.id}</option>)}
              </select>
            </label>
            {!context.data.payments.some((payment) => payment.refundable > 0) && <Text>No captured balance is available to refund.</Text>}
            <label>Refund amount ({context.data.currency_code.toUpperCase()})
              <Input type="number" inputMode="decimal" min="0" step="any" max={payment?.refundable} value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <Text size="small">Check the requested items, discounts and shipping before choosing the amount. A payment refund does not record which items were returned; use the order’s Return controls when goods are coming back.</Text>
          </>}
        <Button disabled={busy || !validAction || response.trim().length < 3} onClick={confirm}>
          {resolve.isPending ? "Processing…" : request.kind === "cancellation" ? "Confirm cancellation & refund" : "Confirm refund"}
        </Button>
      </>}
    </div>}
  </Container>
}

const RefundRequestsPage = () => {
  const [offset, setOffset] = useState(0)
  const [status, setStatus] = useState("")
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["customer-refund-requests", status, offset],
    queryFn: () => requestApi<{ requests: Request[]; count: number; limit: number }>(`?offset=${offset}${status ? `&status=${status}` : ""}`),
    refetchInterval: 30000,
  })
  return <div className="flex flex-col gap-4">
    <Container className="flex flex-col gap-3">
      <Heading>Refund requests</Heading>
      <Text>Accept &amp; process uses Medusa’s cancellation or refund workflow after your confirmation. Close request only closes the conversation; it does not move money.</Text>
      <div className="flex flex-wrap gap-2" aria-label="Filter requests">
        {Object.entries({ "": "All", ...statuses }).map(([value, label]) => <Button key={value} variant={status === value ? "primary" : "secondary"}
          aria-pressed={status === value} onClick={() => { setStatus(value); setOffset(0) }}>{label}</Button>)}
      </div>
      <Button variant="secondary" onClick={() => refetch()}>Refresh requests</Button>
    </Container>
    {isPending && <Text>Loading requests…</Text>}
    {isError && <Alert variant="error">Could not load requests. Refresh or sign in again.</Alert>}
    {data?.requests.map((request) => <RequestCard key={`${request.id}:${request.response}:${request.status}:${request.resolution?.state || ""}`} request={request} />)}
    {data && !data.requests.length && <Container><Text>No refund requests.</Text></Container>}
    <div className="flex gap-2">
      <Button variant="secondary" disabled={!offset || isPending} onClick={() => setOffset(offset - 20)}>Previous</Button>
      <Button variant="secondary" disabled={!data || offset + 20 >= data.count || isPending} onClick={() => setOffset(offset + 20)}>Next</Button>
    </div>
  </div>
}

export const config = defineRouteConfig({ label: "Refund requests", nested: "/orders" })
export default RefundRequestsPage
