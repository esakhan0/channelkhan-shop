import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Alert, Badge, Button, Container, Heading, Text, Textarea } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"

type Request = {
  id: string; order_id: string; order_display_id: number; kind: string; status: string
  customer_note: string; response: string; created_at: string
  items: { id: string; title: string; quantity: number }[]
}

async function requestApi<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${(__BACKEND_URL__ || "").replace(/\/$/, "")}/admin/refund-requests${path}`, {
    credentials: "include", cache: "no-store", method: body ? "POST" : "GET",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) throw new Error("Unable to load or save requests. Check your admin session and try again.")
  return response.json()
}

const RequestCard = ({ request }: { request: Request }) => {
  const queryClient = useQueryClient()
  const [response, setResponse] = useState(request.response)
  const update = useMutation({
    mutationFn: (status: string) => requestApi(`/${request.id}`, { status, response }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-refund-requests"] }),
  })
  return <Container className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Link className="text-ui-fg-interactive" to={`/orders/${request.order_id}`}>Order #{request.order_display_id} ↗</Link>
      <Badge>{request.status}</Badge>
    </div>
    <Text weight="plus">{request.kind === "cancellation" ? "Cancellation request" : "Faulty-item refund request"}</Text>
    <Text size="small">{new Date(request.created_at).toLocaleString()}</Text>
    <ul>{request.items.map((item) => <li key={item.id}><Text>{item.quantity} × {item.title}</Text></li>)}</ul>
    <Text className="whitespace-pre-wrap">{request.customer_note}</Text>
    <label className="text-ui-fg-subtle text-sm">Reply shown in the customer’s account
      <Textarea value={response} maxLength={2000} onChange={(event) => setResponse(event.target.value)} />
    </label>
    {update.isError && <Alert variant="error">{update.error.message}</Alert>}
    {update.isSuccess && <Text role="status">Response saved.</Text>}
    <div className="flex flex-wrap gap-2">
      {(["reviewing", "closed", "declined"] as const).map((status) => <Button key={status}
        variant="secondary" disabled={update.isPending || response.trim().length < 3}
        onClick={() => update.mutate(status)}>
        {status === "reviewing" ? "Mark reviewing" : status === "closed" ? "Close request" : "Decline request"}
      </Button>)}
    </div>
  </Container>
}

const RefundRequestsPage = () => {
  const [offset, setOffset] = useState(0)
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["customer-refund-requests", offset],
    queryFn: () => requestApi<{ requests: Request[]; count: number; limit: number }>(`?offset=${offset}`),
    refetchInterval: 30000,
  })
  return <div className="flex flex-col gap-4">
    <Container className="flex flex-col gap-3">
      <Heading>Refund requests</Heading>
      <Text>Review customer refund and cancellation requests here. Process any refund, cancellation or physical return from the order’s normal Medusa controls. Closing a request does not move money, cancel the order or stop fulfilment.</Text>
      <Button variant="secondary" onClick={() => refetch()}>Refresh requests</Button>
    </Container>
    {isPending && <Text>Loading requests…</Text>}
    {isError && <Alert variant="error">Could not load requests. Refresh or sign in again.</Alert>}
    {data?.requests.map((request) => <RequestCard key={`${request.id}:${request.response}:${request.status}`} request={request} />)}
    {data && !data.requests.length && <Container><Text>No refund requests.</Text></Container>}
    <div className="flex gap-2">
      <Button variant="secondary" disabled={!offset || isPending} onClick={() => setOffset(offset - 20)}>Previous</Button>
      <Button variant="secondary" disabled={!data || offset + 20 >= data.count || isPending} onClick={() => setOffset(offset + 20)}>Next</Button>
    </div>
  </div>
}

export const config = defineRouteConfig({ label: "Refund requests", nested: "/orders" })
export default RefundRequestsPage
