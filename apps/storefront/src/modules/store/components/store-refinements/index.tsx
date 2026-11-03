"use client"

import { useSortBy } from "react-instantsearch"

import {
  CATEGORY_ATTRIBUTE,
  LABELS_ATTRIBUTE,
  getSortOptions,
} from "./attributes"
import CurrentRefinements from "./current-refinements"
import OnSaleToggle from "./on-sale-toggle"
import OptionRefinements from "./option-refinements"
import PriceRange from "./price-range"
import RefinementGroup from "./refinement-group"

const SortProducts = ({ currencyCode }: { currencyCode: string }) => {
  const items = getSortOptions(currencyCode)
  const { currentRefinement, refine } = useSortBy({ items })

  return (
    <label className="joy-sort-label">Sort by
      <select value={currentRefinement} onChange={event => refine(event.target.value)} data-testid="sort-by-container">
        {items.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}
      </select>
    </label>
  )
}

const StoreRefinements = ({ currencyCode }: { currencyCode: string }) => {
  return (
    <aside className="joy-store-filters" aria-label="Product filters">
      <h2>Filter the shop</h2>
      <SortProducts currencyCode={currencyCode} />
      <CurrentRefinements currencyCode={currencyCode} />
      <OptionRefinements />
      <PriceRange currencyCode={currencyCode} />
      <OnSaleToggle currencyCode={currencyCode} />
      <RefinementGroup attribute={CATEGORY_ATTRIBUTE} title="Category" />
      <RefinementGroup attribute={LABELS_ATTRIBUTE} title="Labels" />
    </aside>
  )
}

export default StoreRefinements
