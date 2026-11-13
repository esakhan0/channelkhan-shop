import type { UseRefinementListProps } from "react-instantsearch"

import { PRODUCT_INDEX_NAME, priceAttribute } from "@lib/search-client"

export const OPTION_VALUES_ATTRIBUTE = "option_values"

/**
 * One facet setup for every widget that reads option values, because
 * InstantSearch needs widgets on the same attribute to agree. "or" is what a
 * colour filter means to a shopper: picking Black and Red shows prints in
 * either colour, and the other colours stay on offer while one is picked.
 */
export const OPTION_VALUES_FACET: UseRefinementListProps = {
  attribute: OPTION_VALUES_ATTRIBUTE,
  limit: 200,
  // Alphabetical keeps a size or colour list stable as counts move around.
  sortBy: ["name:asc"],
  operator: "or",
}
export const CATEGORY_ATTRIBUTE = "category"
// The index calls the product's tags "labels".
export const LABELS_ATTRIBUTE = "labels"

export const getSortOptions = (currencyCode: string) => {
  const minPrice = priceAttribute("min_price", currencyCode)

  return [
    { value: PRODUCT_INDEX_NAME, label: "Relevance" },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/created_at:desc`,
      label: "Latest Arrivals",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:asc`,
      label: "Price: Low -> High",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:desc`,
      label: "Price: High -> Low",
    },
    { value: `${PRODUCT_INDEX_NAME}/sort/title:asc`, label: "Title: A -> Z" },
    { value: `${PRODUCT_INDEX_NAME}/sort/title:desc`, label: "Title: Z -> A" },
  ]
}
