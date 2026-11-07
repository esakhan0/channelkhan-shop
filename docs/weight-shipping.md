# Weight-based delivery

This provider uses Medusa 2.22.2's native calculated shipping API. The backend totals
each physical item's variant weight × quantity, adds packaging once per parcel,
rounds up to a whole gram and selects the first band that covers the total.
Prices are configured by the shop and returned in GBP. This is not a live Royal Mail
quote or a label-purchasing integration. Buy labels and add tracking through your
normal fulfillment process.

## Configure

1. In Medusa Admin, open each product variant and edit Attributes → Weight.
   Use **grams** consistently. Set every size/colour variant, including both dragon
   sizes. Product-level weight alone is not used by this provider.
2. In Coolify's backend environment, set `WEIGHT_SHIPPING_SERVICES` to a JSON array
   of services, using the shape below. The Compose file passes it to Medusa at runtime.
   Enter raw JSON in Coolify, without wrapping it in extra quotes. Redeploy to load changes.
3. Under Settings → Locations & Shipping → your warehouse, enable the provider
   `weight-shipping` in Fulfillment Providers. Its stored provider ID is
   `weight-shipping_weight-shipping`.
4. In the appropriate service zone, create a shipping option. Select **Calculated**,
   the weight-shipping provider, your configured fulfillment option, and the same
   shipping profile used by your products. Choose a clear customer-facing name.
5. Test a cart on both sides of each boundary. After confirming the new option
   works, disable the old fixed-rate option if you want customers to use only
   weight-based prices. Existing orders and their shipping prices stay unchanged.

Example schema with **illustrative test prices, not Royal Mail prices**:

```json
[
  {
    "id": "standard",
    "name": "Standard delivery",
    "country_codes": ["gb"],
    "packaging_weight_g": 50,
    "tax_inclusive": false,
    "bands": [
      { "max_weight_g": 250, "price_pence": 200 },
      { "max_weight_g": 1000, "price_pence": 400 }
    ]
  }
]
```

Replace those weights and prices with your actual packaging and chosen tariffs.
`price_pence: 400` means £4.00. Bands must have strictly increasing maximum weights.
The maximum is inclusive. Each band starts immediately after the preceding maximum.
`tax_inclusive` controls whether Medusa treats the configured amount as including tax;
Medusa's configured tax rules still apply. It does not enable tax registration.
Add another service object for another delivery speed. Keep service IDs stable once
they are in use. The default `[]` offers no weight-based services.

## Scope and safeguards

- Rates and packaging come from server configuration. Customer-supplied prices,
  service overrides and weights in shipping method data are ignored.
- Variant weights and quantities come from the cart context supplied by Medusa's
  workflows. Missing/zero/invalid weights, unsupported countries/currencies and
  overweight parcels produce a controlled error, never a free or guessed quote.
- Medusa recalculates shipping when cart changes trigger its refresh workflows.
- This first version assumes one outbound parcel and one shipping profile for the
  cart's physical items. Mixed shipping profiles, split parcels and returns need
  separate shipping options. Keep the existing manual provider for returns.
- Weight bands do not measure the packed parcel or enforce dimension limits.
  Use a parcel class that fits your products and packaging; check Royal Mail's
  dimensions and restrictions before choosing the tariffs. There is no automatic
  large-letter/small-parcel classification in this provider.
- Saving settings alone does not prove live checkout works. Test with real variant
  weights and an actual delivery address before replacing the old shipping option.

## References

- [Medusa calculated shipping](https://docs.medusajs.com/resources/commerce-modules/fulfillment/shipping-option)
- [Variant weights supplied to providers](https://docs.medusajs.com/resources/commerce-modules/product/physical-customs-attributes)
- [Official ShipStation integration guide](https://docs.medusajs.com/resources/integrations/guides/shipstation)
- [Community Sendcloud plugin considered](https://github.com/altugsogutoglu/medusa-sendcloud-plugin)

ShipStation and Sendcloud are alternatives for carrier integration and label handling.
They require their own accounts/configuration. No external shipping plugin was installed.
