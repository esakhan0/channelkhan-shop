import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Alert, Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { WEIGHT_OPTION_ID, WEIGHT_PROVIDER_ID, weightServiceSchema } from "../../../../modules/weight-shipping/config"

type ShippingOption = { id: string; name: string; price_type: string; data: Record<string, unknown> | null }
type Band = { weight: string; price: string }

async function shippingApi<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${(__BACKEND_URL__ || "").replace(/\/$/, "")}/admin/shipping-options${path}`, {
    credentials: "include", cache: "no-store", method: body ? "POST" : "GET",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || "Unable to load or save shipping options. Check your admin session and permissions.")
  }
  return response.json()
}

async function loadOptions() {
  const options: ShippingOption[] = []
  let count = 0
  do {
    const page = await shippingApi<{ shipping_options: ShippingOption[]; count: number }>(
      `?provider_id=${WEIGHT_PROVIDER_ID}&limit=100&offset=${options.length}&fields=id,name,price_type,data`
    )
    options.push(...page.shipping_options)
    count = page.count
    if (!page.shipping_options.length) break
  } while (options.length < count)
  return options
}

function WeightOption({ option }: { option: ShippingOption }) {
  const parsed = weightServiceSchema.safeParse(option.data?.weight_config)
  const initial = parsed.success ? parsed.data : undefined
  const [name, setName] = useState(option.name)
  const [countries, setCountries] = useState(initial?.country_codes.join(", ") || "gb")
  const [packaging, setPackaging] = useState(initial ? String(initial.packaging_weight_g) : "")
  const [inclusive, setInclusive] = useState(initial?.tax_inclusive ?? false)
  const [bands, setBands] = useState<Band[]>(initial?.bands.map(band => ({
    weight: String(band.max_weight_g), price: (band.price_pence / 100).toFixed(2),
  })) || [{ weight: "", price: "" }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const changeBand = (index: number, field: keyof Band, value: string) => {
    setSaved(false)
    setBands(rows => rows.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaved(false)
    setError("")
    if (!/^\d+$/.test(packaging) || bands.some(band => !/^\d+$/.test(band.weight) || !/^\d+(\.\d{1,2})?$/.test(band.price))) {
      setError("Enter whole grams and GBP prices with no more than two decimal places. Enter 0 explicitly for free shipping or no packaging weight.")
      return
    }
    const config = weightServiceSchema.safeParse({
      id: WEIGHT_OPTION_ID, name: name.trim(),
      country_codes: [...new Set(countries.toLowerCase().split(",").map(code => code.trim()).filter(Boolean))],
      packaging_weight_g: Number(packaging), tax_inclusive: inclusive,
      bands: bands.map(band => {
        const [pounds, pence = ""] = band.price.split(".")
        return { max_weight_g: Number(band.weight), price_pence: Number(pounds) * 100 + Number(pence.padEnd(2, "0")) }
      }),
    })
    if (!config.success) {
      setError("Check the service name, country codes and weights. Limits must be positive and increase from top to bottom; prices must be zero or more.")
      return
    }
    setBusy(true)
    try {
      await shippingApi(`/${option.id}`, {
        name: config.data.name, price_type: "calculated", provider_id: WEIGHT_PROVIDER_ID,
        data: { ...option.data, id: WEIGHT_OPTION_ID, weight_config: config.data },
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save weight bands.")
    } finally {
      setBusy(false)
    }
  }

  return <Container>
    <form onSubmit={save} onChange={() => setSaved(false)}>
      <fieldset disabled={busy} className="flex min-w-0 flex-col gap-5">
        <div>
          <Heading level="h2">{option.name}</Heading>
          <Text size="small" className="text-ui-fg-subtle">Shipping option: {option.id}</Text>
        </div>
        {!initial && <Alert variant="info">Enter your bands to manage this service here. Saving replaces any legacy server-configured bands for this option.</Alert>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm">Delivery service name
            <Input aria-label="Delivery service name" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label className="text-sm">Packaging weight (grams per parcel)
            <Input aria-label="Packaging weight in grams" inputMode="numeric" value={packaging} onChange={e => setPackaging(e.target.value)} placeholder="Enter measured packaging weight" required />
          </label>
          <label className="text-sm">Destination country codes
            <Input aria-label="Destination country codes" value={countries} onChange={e => setCountries(e.target.value)} required />
            <Text size="small" className="text-ui-fg-subtle">Use gb for the UK. Separate additional two-letter codes with commas.</Text>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={inclusive} onChange={e => setInclusive(e.target.checked)} />
            Entered prices include tax
          </label>
        </div>
        <div>
          <Heading level="h3">Weight bands</Heading>
          <Text size="small" className="text-ui-fg-subtle">Total = variant weight × quantity, plus packaging. Each limit includes that weight. Put the lightest band first.</Text>
        </div>
        <div className="flex flex-col gap-3">
          {bands.map((band, index) => <div key={index} className="grid grid-cols-2 items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm">Up to and including (g)
              <Input aria-label={`Band ${index + 1} maximum grams`} inputMode="numeric" value={band.weight} onChange={e => changeBand(index, "weight", e.target.value)} required />
            </label>
            <label className="text-sm">Delivery price (£)
              <Input aria-label={`Band ${index + 1} price in pounds`} inputMode="decimal" value={band.price} onChange={e => changeBand(index, "price", e.target.value)} required />
            </label>
            <Button type="button" variant="secondary" disabled={bands.length === 1} aria-label={`Remove band ${index + 1}`} onClick={() => { setBands(rows => rows.filter((_, i) => i !== index)); setSaved(false) }}>Remove</Button>
          </div>)}
        </div>
        <div><Button type="button" variant="secondary" onClick={() => { setBands(rows => [...rows, { weight: "", price: "" }]); setSaved(false) }}>Add weight band</Button></div>
        <Text size="small" className="text-ui-fg-subtle">Parcels above the last limit cannot use this service. Prices are GBP. This calculates your shop’s delivery charge; it does not buy Royal Mail labels.</Text>
        {error && <Alert variant="error">{error}</Alert>}
        {saved && <Alert variant="success">Weight bands saved. New shipping calculations use these prices without a redeploy. Existing orders keep their original charges.</Alert>}
        <div><Button type="submit" isLoading={busy}>Save weight bands</Button></div>
      </fieldset>
    </form>
  </Container>
}

const WeightShippingSettings = () => {
  const options = useQuery({ queryKey: ["weight-shipping-options"], queryFn: loadOptions, refetchOnWindowFocus: false })
  return <div className="flex flex-col gap-4">
    <Container className="flex flex-col gap-3">
      <Heading>Weight-based delivery</Heading>
      <Text>Edit delivery charges here. Set each product variant’s weight in grams under its Attributes.</Text>
      <Text size="small">To add a service, enable weight-shipping at your warehouse in Locations &amp; Shipping. Create a calculated shipping option in its service zone, choose “Weight bands (manage in Settings)” and the shipping profile used by your products. Then return here to enter the bands.</Text>
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/settings/locations" className="text-ui-fg-interactive">Locations &amp; Shipping ↗</Link>
        <Button variant="secondary" onClick={() => options.refetch()} isLoading={options.isFetching}>Refresh services</Button>
      </div>
    </Container>
    {options.isError && <Alert variant="error">{options.error.message}</Alert>}
    {options.isPending && <Text>Loading delivery services…</Text>}
    {options.data?.length === 0 && <Container><Text>No weight-based shipping options yet. Add a service using the instructions above.</Text></Container>}
    {options.data?.map(option => <WeightOption key={`${option.id}:${JSON.stringify(option.data)}`} option={option} />)}
  </div>
}

export const config = defineRouteConfig({ label: "Weight-based delivery" })
export default WeightShippingSettings
