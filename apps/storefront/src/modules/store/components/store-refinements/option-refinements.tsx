"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { ChevronDownMini } from "@medusajs/icons"
import clsx from "clsx"
import { useState } from "react"
import { useRefinementList } from "react-instantsearch"

import { OPTION_VALUES_FACET } from "./attributes"

type OptionGroup = {
  title: string
  values: {
    label: string
    value: string
    count: number
    isRefined: boolean
  }[]
}

function groupItems(
  items: ReturnType<typeof useRefinementList>["items"]
): OptionGroup[] {
  const groups = new Map<string, OptionGroup>()

  for (const item of items) {
    const separator = item.label.indexOf(":")

    if (separator < 1) {
      continue
    }

    const title = item.label.slice(0, separator)
    const label = item.label.slice(separator + 1)

    if (!groups.has(title)) {
      groups.set(title, { title, values: [] })
    }

    groups.get(title)!.values.push({
      label,
      value: item.value,
      count: item.count,
      isRefined: item.isRefined,
    })
  }

  return Array.from(groups.values())
}

const OptionRefinements = () => {
  const { items, refine } = useRefinementList(OPTION_VALUES_FACET)
  // Groups start closed to keep the sidebar short; the count beside each title
  // shows when something inside is selected, for example by a colour chip.
  const [toggledGroups, setToggledGroups] = useState<Record<string, boolean>>({})

  const groups = groupItems(items)

  if (!groups.length) {
    return null
  }

  const isGroupOpen = (group: OptionGroup) => toggledGroups[group.title] ?? false

  return (
    <Accordion.Root
      type="multiple"
      value={groups.filter(isGroupOpen).map((group) => group.title)}
      onValueChange={(openTitles) =>
        setToggledGroups(
          Object.fromEntries(
            groups.map((group) => [group.title, openTitles.includes(group.title)])
          )
        )
      }
      className="flex flex-col gap-y-3 pr-6"
    >
      {groups.map((group) => {
        const isOpen = isGroupOpen(group)
        const selectedCount = group.values.filter(
          (value) => value.isRefined
        ).length

        return (
          <Accordion.Item
            key={group.title}
            value={group.title}
            className="overflow-hidden"
          >
            <Accordion.Header>
              <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="txt-compact-small-plus text-ui-fg-base">
                    {group.title}
                  </span>
                  <span className="txt-compact-small-plus text-ui-fg-muted">
                    ({selectedCount})
                  </span>
                </div>
                <span
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center text-ui-fg-muted transition-transform duration-150",
                    { "rotate-180": isOpen }
                  )}
                >
                  <ChevronDownMini />
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="pb-4 pt-1">
              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => (
                  <button
                    key={value.value}
                    onClick={() => refine(value.value)}
                    aria-pressed={value.isRefined}
                    className={clsx(
                      "border-ui-border-base border text-small-regular h-10 rounded-rounded px-3 flex items-center gap-x-1.5 transition-colors duration-150",
                      {
                        "border-ui-border-interactive text-ui-fg-base":
                          value.isRefined,
                        "text-ui-fg-muted hover:text-ui-fg-base":
                          !value.isRefined,
                      }
                    )}
                    data-testid="option-refinement"
                  >
                    {value.label}
                    <span className="text-ui-fg-muted">({value.count})</span>
                  </button>
                ))}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        )
      })}
    </Accordion.Root>
  )
}

export default OptionRefinements
