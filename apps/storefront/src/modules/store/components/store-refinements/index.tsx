"use client"

import { useId, useState } from "react"
import { useCurrentRefinements, useSortBy } from "react-instantsearch"

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
import styles from "./store-refinements.module.css"

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
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const { items } = useCurrentRefinements()
  const activeCount = items.reduce((count, item) => count + item.refinements.length, 0)

  return (
    <aside className={`joy-store-filters ${styles.filters}`} aria-label="Product filters">
      <h2 className={styles.heading}>Filter the shop</h2>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
      >
        Filters &amp; sort{activeCount > 0 ? ` (${activeCount})` : ""}
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      <div id={panelId} className={styles.panel} data-open={isOpen}>
        <SortProducts currencyCode={currencyCode} />
        <CurrentRefinements currencyCode={currencyCode} />
        <OptionRefinements />
        <PriceRange currencyCode={currencyCode} />
        <OnSaleToggle currencyCode={currencyCode} />
        <RefinementGroup attribute={CATEGORY_ATTRIBUTE} title="Category" />
        <RefinementGroup attribute={LABELS_ATTRIBUTE} title="Labels" />
      </div>
    </aside>
  )
}

export default StoreRefinements
