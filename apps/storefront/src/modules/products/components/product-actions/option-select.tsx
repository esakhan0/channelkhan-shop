import { isColourOption, swatchFill } from "@lib/util/colour-swatch"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  name: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  name,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const showSwatches = isColourOption(title)

  return (
    <fieldset className="flex flex-col" disabled={disabled}>
      <legend className="mk-option-legend">
        {title}
        {current && <span className="mk-option-current">{current}</span>}
      </legend>
      <div className="mk-option-list" data-testid={dataTestId}>
        {filteredOptions.map((v) => {
          const id = `${name}-${v}`.replace(/[^A-Za-z0-9_-]/g, "-")
          return (
            <div key={v}>
              <input
                type="radio"
                id={id}
                name={name}
                value={v}
                checked={v === current}
                onChange={() => updateOption(option.id, v)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={clx(
                  "mk-option peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed",
                  { "mk-option-selected": v === current }
                )}
                data-testid="option-button"
              >
                {showSwatches && (
                  <span
                    className="mk-swatch"
                    style={{ background: swatchFill(v) }}
                    aria-hidden="true"
                  />
                )}
                {v}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
