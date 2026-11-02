"use client"

import type { Hit } from "instantsearch.js"
import { useEffect, useRef } from "react"
import { useHits, useInstantSearch, useClearRefinements } from "react-instantsearch"

import useSearchSettled from "@lib/hooks/use-search-settled"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/ui"
import Thumbnail from "@modules/products/components/thumbnail"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import SearchPagination from "./pagination"
import HitPrice, { HitPricing } from "./price"

type ProductHit = Hit<
  {
    title: string | null
    handle: string | null
    thumbnail: string | null
  } & HitPricing
>

type StoreHitsProps = {
  hitsPerPage: number
  currencyCode: string
}

const StoreHits = ({ hitsPerPage, currencyCode }: StoreHitsProps) => {
  const { items } = useHits<ProductHit>()
  const { refine: clearFilters, canRefine } = useClearRefinements({ excludedAttributes: [] })
  const { status, error, indexUiState } = useInstantSearch()
  const { isSearching, hasNoResultsYet } = useSearchSettled()

  const { page, ...refinements } = indexUiState
  const currentPage = page ?? 1
  const refinementKey = JSON.stringify(refinements)

  const settled = useRef({ page: currentPage, refinementKey })

  useEffect(() => {
    if (!isSearching) {
      settled.current = { page: currentPage, refinementKey }
    }
  }, [isSearching, currentPage, refinementKey])

  const isPagingOnly =
    refinementKey === settled.current.refinementKey &&
    currentPage !== settled.current.page

  const showSkeleton = hasNoResultsYet || (isSearching && isPagingOnly)

  if (status === "error") {
    return (
      <Text
        className="py-16 text-center text-ui-fg-error"
        data-testid="products-error"
      >
        Couldn&apos;t load products
        {error?.message ? `: ${error.message}` : "."}
      </Text>
    )
  }

  return (
    <>
      {showSkeleton ? (
        <SkeletonProductGrid numberOfProducts={hitsPerPage} />
      ) : !items.length ? (
        <div className="joy-store-empty" data-testid="no-products">
          <svg width="86" height="86" viewBox="0 0 86 86" fill="none" aria-hidden="true"><path d="m43 5 9 25 27 1-21 17 7 27-22-16-22 16 7-27L7 31l27-1Z" fill="#f4d34c" stroke="#282323" strokeWidth="2" strokeLinejoin="round"/><path d="M34 39v4m18-4v4m-17 8q8 8 16 0" stroke="#282323" strokeWidth="3" strokeLinecap="round"/></svg>
          <h2>{canRefine ? "No matches this time." : "The good things are on their way."}</h2>
          <p>{canRefine ? "Try another search or clear your filters to see what’s in the shop." : "Our first collection is taking shape. Pop back soon, or say hello to the makers."}</p>
          {canRefine ? <button type="button" className="ink-button" onClick={() => clearFilters()}>Clear search &amp; filters</button> : <LocalizedClientLink className="ink-button" href="/contact">Say hello <span aria-hidden="true">↗</span></LocalizedClientLink>}
        </div>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
          data-testid="products-list"
        >
          {items.map((hit) =>
            hit.handle ? (
              <li key={hit.objectID}>
                <LocalizedClientLink
                  href={`/products/${hit.handle}`}
                  className="group mukky-product-card"
                >
                  <div data-testid="product-wrapper">
                    <Thumbnail thumbnail={hit.thumbnail} size="full" />
                    <div className="flex txt-compact-medium mt-4 justify-between">
                      <Text
                        className="text-ui-fg-subtle"
                        data-testid="product-title"
                      >
                        {hit.title}
                      </Text>
                      <HitPrice hit={hit} currencyCode={currencyCode} />
                    </div>
                  </div>
                </LocalizedClientLink>
              </li>
            ) : null
          )}
        </ul>
      )}
      <SearchPagination />
    </>
  )
}

export default StoreHits
