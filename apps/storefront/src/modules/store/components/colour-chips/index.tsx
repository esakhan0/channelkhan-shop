"use client"

import { useMemo } from "react"
import { useInstantSearch, useRefinementList } from "react-instantsearch"

import {
  OPTION_VALUES_ATTRIBUTE,
  OPTION_VALUES_FACET,
} from "../store-refinements/attributes"
import { groupColourFamilies, isColourValue, sameValues } from "./families"

/**
 * Quick colour filters above the grid. Each chip stands for a colour family
 * ("Black" covers "Black", "Black / Green", "Black casing / Red wheel"...) and
 * sets the same option refinements the sidebar does, so the URL, the applied
 * filters list and the sidebar all stay in step. One family at a time; finer
 * combinations are still available in the sidebar.
 */
const ColourChips = () => {
  const { items } = useRefinementList(OPTION_VALUES_FACET)
  const { indexUiState, setIndexUiState } = useInstantSearch()

  const families = useMemo(
    () => groupColourFamilies(items.map((item) => item.value)),
    [items]
  )

  if (families.length < 2) {
    return null
  }

  const refined = indexUiState.refinementList?.[OPTION_VALUES_ATTRIBUTE] ?? []
  const refinedColours = refined.filter(isColourValue)
  const otherRefinements = refined.filter((value) => !isColourValue(value))

  const setColourValues = (values: string[]) => {
    setIndexUiState((previous) => ({
      ...previous,
      // A new filter starts from the first page of its own results.
      page: 1,
      refinementList: {
        ...previous.refinementList,
        [OPTION_VALUES_ATTRIBUTE]: [...otherRefinements, ...values],
      },
    }))
  }

  return (
    <div
      className="mk-chips"
      role="group"
      aria-label="Filter by colour"
      data-testid="colour-chips"
    >
      <button
        type="button"
        className="mk-chip"
        aria-pressed={refinedColours.length === 0}
        onClick={() => setColourValues([])}
      >
        All colours
      </button>
      {families.map((family) => {
        const isActive = sameValues(refinedColours, family.values)

        return (
          <button
            key={family.key}
            type="button"
            className="mk-chip"
            aria-pressed={isActive}
            onClick={() => setColourValues(isActive ? [] : family.values)}
            data-testid="colour-chip"
          >
            <span
              className="mk-swatch"
              style={{ background: family.fill }}
              aria-hidden="true"
            />
            {family.label}
          </button>
        )
      })}
    </div>
  )
}

export default ColourChips
