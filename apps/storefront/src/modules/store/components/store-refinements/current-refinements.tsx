"use client"

import { XMarkMini } from "@medusajs/icons"
import {
  useClearRefinements,
  useCurrentRefinements,
  useInstantSearch,
  useRefinementList,
} from "react-instantsearch"

import { indexedCurrency, priceAttribute } from "@lib/search-client"
import { convertToLocale } from "@lib/util/money"
import {
  groupColourFamilies,
  isColourValue,
  sameValues,
} from "@modules/store/components/colour-chips/families"
import {
  CATEGORY_ATTRIBUTE,
  LABELS_ATTRIBUTE,
  OPTION_VALUES_ATTRIBUTE,
  OPTION_VALUES_FACET,
} from "./attributes"

type Refinement = ReturnType<
  typeof useCurrentRefinements
>["items"][number]["refinements"][number]

/**
 * What a single refinement reads as on its chip. The raw label is the facet
 * value, which is the option's `Size:M` form for options and a bare `true` for
 * the on-sale toggle — neither says what it filters on out of context.
 */
function refinementLabel(refinement: Refinement, currencyCode: string) {
  const { attribute, label, value, operator } = refinement

  if (attribute === OPTION_VALUES_ATTRIBUTE) {
    const separator = String(value).indexOf(":")

    return separator < 1
      ? label
      : `${String(value).slice(0, separator)}: ${String(value).slice(
          separator + 1
        )}`
  }

  if (attribute === priceAttribute("on_sale", currencyCode)) {
    return "On sale"
  }

  if (attribute === priceAttribute("min_price", currencyCode)) {
    const amount = convertToLocale({
      amount: Number(value),
      currency_code: indexedCurrency(currencyCode),
      maximumFractionDigits: 0,
    })

    return operator === "<=" || operator === "<"
      ? `Up to ${amount}`
      : `From ${amount}`
  }

  if (attribute === CATEGORY_ATTRIBUTE) {
    return `Category: ${label}`
  }

  if (attribute === LABELS_ATTRIBUTE) {
    return `Label: ${label}`
  }

  return label
}

/**
 * Every active refinement as a chip that drops it, above the filters that set
 * them. The free-text query is excluded by the connector's own defaults, so
 * only what the sidebar controls shows up here.
 */
const CurrentRefinements = ({ currencyCode }: { currencyCode: string }) => {
  const { items, refine } = useCurrentRefinements()
  const { canRefine: canClearAll, refine: clearAll } = useClearRefinements()
  const { items: optionItems } = useRefinementList(OPTION_VALUES_FACET)
  const { setIndexUiState } = useInstantSearch()

  const allRefinements = items.flatMap((item) => item.refinements)

  if (!allRefinements.length) {
    return null
  }

  // A colour chip selects every value in its family. Show that as the one
  // filter the shopper picked ("Colour: Black") instead of a chip per value.
  const colourRefinements = allRefinements.filter(
    (refinement) =>
      refinement.attribute === OPTION_VALUES_ATTRIBUTE &&
      isColourValue(String(refinement.value))
  )
  const colourValues = colourRefinements.map((refinement) => String(refinement.value))
  const activeFamily =
    colourValues.length > 1
      ? groupColourFamilies(optionItems.map((item) => item.value)).find((family) =>
          sameValues(colourValues, family.values)
        )
      : undefined
  const refinements = activeFamily
    ? allRefinements.filter((refinement) => !colourRefinements.includes(refinement))
    : allRefinements

  const clearColourFamily = () => {
    setIndexUiState((previous) => ({
      ...previous,
      page: 1,
      refinementList: {
        ...previous.refinementList,
        [OPTION_VALUES_ATTRIBUTE]: (
          previous.refinementList?.[OPTION_VALUES_ATTRIBUTE] ?? []
        ).filter((value) => !colourValues.includes(value)),
      },
    }))
  }

  return (
    <div className="flex flex-col gap-y-3" data-testid="current-refinements">
      <div className="flex items-center justify-between gap-x-2 pr-6">
        <span className="txt-compact-small-plus text-ui-fg-subtle">
          Applied filters
        </span>
        {canClearAll && (
          <button
            onClick={clearAll}
            className="txt-compact-small-plus text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            data-testid="clear-refinements"
          >
            Clear all
          </button>
        )}
      </div>

      <ul className="flex flex-wrap gap-2 pr-6">
        {activeFamily && (
          <li>
            <button
              onClick={clearColourFamily}
              aria-label={`Remove filter Colour: ${activeFamily.label}`}
              className="border-ui-border-interactive text-ui-fg-base border text-small-regular h-8 rounded-rounded px-3 flex items-center gap-x-1.5 transition-colors duration-150 hover:bg-ui-bg-base-hover"
              data-testid="remove-refinement"
            >
              Colour: {activeFamily.label}
              <XMarkMini className="text-ui-fg-muted" />
            </button>
          </li>
        )}
        {refinements.map((refinement) => {
          const label = refinementLabel(refinement, currencyCode)

          return (
            <li
              key={`${refinement.attribute}:${refinement.operator ?? ""}:${
                refinement.value
              }`}
            >
              <button
                onClick={() => refine(refinement)}
                aria-label={`Remove filter ${label}`}
                className="border-ui-border-interactive text-ui-fg-base border text-small-regular h-8 rounded-rounded px-3 flex items-center gap-x-1.5 transition-colors duration-150 hover:bg-ui-bg-base-hover"
                data-testid="remove-refinement"
              >
                {label}
                <XMarkMini className="text-ui-fg-muted" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CurrentRefinements
