"use client"

import type { Hit } from "instantsearch.js"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { useHits, useInstantSearch, useClearRefinements } from "react-instantsearch"

import { listProducts } from "@lib/data/products"
import { getPricesForVariant } from "@lib/util/get-product-price"
import useSearchSettled from "@lib/hooks/use-search-settled"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text } from "@modules/common/components/ui"
import Thumbnail from "@modules/products/components/thumbnail"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import SearchPagination from "./pagination"
import { HitPricing } from "./price"
import { OPTION_VALUES_ATTRIBUTE } from "../store-refinements/attributes"

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

const StoreHits = ({ hitsPerPage }: StoreHitsProps) => {
  const { items } = useHits<ProductHit>()
  const { refine: clearFilters, canRefine } = useClearRefinements({ excludedAttributes: [] })
  const { status, error, indexUiState } = useInstantSearch()
  const { isSearching, hasNoResultsYet } = useSearchSettled()
  const { countryCode } = useParams<{ countryCode: string }>()
  const [variantResults, setVariantResults] = useState<{
    key: string
    products: HttpTypes.StoreProduct[]
    failed?: boolean
  }>()
  const [retry, setRetry] = useState(0)
  // Resolve the current search page in one Store API call, including regional
  // prices and variant images. The search index still supplies product ranking.
  const handlesKey = JSON.stringify(items.map((hit) => hit.handle).filter(Boolean))
  const requestKey = `${countryCode}:${handlesKey}:${retry}`

  useEffect(() => {
    let cancelled = false
    const handles: string[] = JSON.parse(handlesKey)
    if (!handles.length) return

    listProducts({
      countryCode,
      fresh: true,
      queryParams: { handle: handles, limit: handles.length },
    }).then(({ response }) => {
      if (!cancelled) setVariantResults({ key: requestKey, products: response.products })
    }).catch(() => {
      if (!cancelled) setVariantResults({ key: requestKey, products: [], failed: true })
    })

    return () => { cancelled = true }
  }, [countryCode, handlesKey, requestKey])

  const selectedOptions = indexUiState.refinementList?.[OPTION_VALUES_ATTRIBUTE] ?? []
  const selectedGroups = new Map<string, string[]>()
  selectedOptions.forEach((value) => {
    const title = value.split(":", 1)[0]
    selectedGroups.set(title, [...(selectedGroups.get(title) ?? []), value])
  })
  const productsByHandle = new Map(variantResults?.products.map((product) => [product.handle, product]))
  const cards = items.flatMap((hit) => {
    if (!hit.handle) return []
    const product = productsByHandle.get(hit.handle)
    if (!product?.handle) return []
    return (product.variants ?? []).filter((variant) => {
      const values = (variant.options ?? []).map((value) => {
        const title = product.options?.find((option) => option.id === value.option_id)?.title
        return `${title}:${value.value}`
      })
      return Array.from(selectedGroups.values()).every((group) => group.some((value) => values.includes(value)))
    }).map((variant) => ({ product, variant }))
  })

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

  const showSkeleton = hasNoResultsYet || (isSearching && isPagingOnly) ||
    (items.length > 0 && variantResults?.key !== requestKey)

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
      {variantResults?.key === requestKey && variantResults.failed ? (
        <div className="py-16 text-center" role="alert">
          <p>Couldn&apos;t load the colour options. Please try again.</p>
          <button type="button" className="ink-button mt-4" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </div>
      ) : showSkeleton ? (
        <SkeletonProductGrid numberOfProducts={hitsPerPage} />
      ) : !cards.length ? (
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
          {cards.map(({ product, variant }) => {
            const label = variant.options?.map((option) => option.value).join(" / ") || variant.title
            const variantLabel = label && label !== "Default variant" ? label : ""
            const price = getPricesForVariant(variant)
            const thumbnail = variant.images?.[0]?.url || product.thumbnail || product.images?.[0]?.url
            return (
              <li key={variant.id} data-variant-id={variant.id}>
                <LocalizedClientLink
                  href={`/products/${product.handle}?v_id=${encodeURIComponent(variant.id)}`}
                  className="group mukky-product-card"
                >
                  <div className="mukky-card-content" data-testid="product-wrapper">
                    <Thumbnail thumbnail={thumbnail} size="square" className="mukky-card-photo" alt={`${product.title}${variantLabel ? ` — ${variantLabel}` : ""}`} />
                    <div className="mukky-card-details">
                      <Text
                        className="text-ui-fg-subtle"
                        data-testid="product-title"
                      >
                        {product.title}
                        {variantLabel && <span className="block text-small-regular mt-1" data-testid="variant-title">{variantLabel}</span>}
                      </Text>
                      <div className="mukky-card-price" data-testid="product-price">
                        {price && price.original_price_number > price.calculated_price_number && (
                          <Text className="line-through text-ui-fg-muted" data-testid="original-price">{price.original_price}</Text>
                        )}
                        <Text className="mukky-card-amount" data-testid="price">{price?.calculated_price ?? "Unavailable"}</Text>
                      </div>
                    </div>
                  </div>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      )}
      <SearchPagination />
    </>
  )
}

export default StoreHits
