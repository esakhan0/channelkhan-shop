"use client"

import { addToCartWithFeedback } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { notifyCartUpdated } from "@lib/util/cart-events"
import {
  countCharacters,
  customisationMetadata,
  getCustomisationSettings,
} from "@lib/util/customisation"
import { getVariantStockLabel, isVariantInStock } from "@lib/util/inventory"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname } from "next/navigation"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return (variantOptions ?? []).reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const getDefaultVariant = (product: HttpTypes.StoreProduct) =>
  product.variants?.find(isVariantInStock) ?? product.variants?.[0]

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  // Preselected on the server so the form posts a valid variant without JavaScript.
  // Apply `?v_id=` after hydration to keep the client and initial form consistent.
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    () => optionsAsKeymap(getDefaultVariant(product)?.options ?? null) ?? {}
  )
  const [isUrlVariantApplied, setIsUrlVariantApplied] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const countryCode = useParams().countryCode as string

  // When the shop owner has switched it on for this product, the buyer types
  // their own text here (a number plate, a name) and it goes with the item.
  const customisation = useMemo(() => getCustomisationSettings(product), [product])
  const [customText, setCustomText] = useState("")
  const [customMissing, setCustomMissing] = useState(false)
  const customField = useRef<HTMLInputElement>(null)

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setCartError(null)
    setAdded(false)
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const variantId = new URLSearchParams(window.location.search).get("v_id")
    const variant = product.variants?.find((v) => v.id === variantId)
    if (variant) {
      setOptions(optionsAsKeymap(variant.options) ?? {})
    }
    setIsUrlVariantApplied(true)
  }, [product.variants])

  useEffect(() => {
    if (!isUrlVariantApplied) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant, isUrlVariantApplied])

  const inStock = useMemo(
    () => isVariantInStock(selectedVariant),
    [selectedVariant]
  )
  const hasPrice = !!selectedVariant && getPricesForVariant(selectedVariant) !== null

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !hasPrice || !inStock || isAdding || disabled) return
    setCartError(null)
    setAdded(false)

    // A personalised item cannot go in the bag without its text. Say so and
    // take the buyer to the box, wherever on the page they pressed the button.
    if (customisation && !customText.trim()) {
      setCustomMissing(true)
      setCartError(`Please fill in "${customisation.label}" first.`)
      customField.current?.focus()
      return
    }

    setIsAdding(true)
    try {
      const result = await addToCartWithFeedback({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
        ...(customisation ? { metadata: customisationMetadata(customisation, customText) } : {}),
      })
      if (!result.success) {
        setCartError(result.error)
        return
      }
      // Cleared so the next one added can carry different text.
      setCustomText("")
      setAdded(true)
      notifyCartUpdated()
      router.refresh()
    } catch {
      setCartError("We couldn’t reach the shop. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleAddToCart()
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <form
          method="post"
          action={`/${countryCode}/cart/add`}
          onSubmit={handleSubmit}
          // Once the page is interactive it explains a missing text box itself,
          // in the same place as other errors. Before that, and without
          // JavaScript, the browser's own check on the required box still applies.
          noValidate={isUrlVariantApplied}
          className="flex flex-col gap-y-2"
          {...{
            toolname: "add_to_cart",
            tooldescription:
              "Add the selected product variant to the shopping cart",
          }}
        >
          <input type="hidden" name="product_id" value={product.id} />
          <input
            type="hidden"
            name="variant_id"
            value={isValidVariant ? selectedVariant?.id ?? "" : ""}
          />
          <input type="hidden" name="quantity" value="1" />
          {/* Price sits directly under the product name, ahead of the choices. */}
          <ProductPrice product={product} variant={selectedVariant} />

          <div>
            {(product.variants?.length ?? 0) > 1 && (
              <div className="flex flex-col gap-y-4">
                <Divider />
                {(product.options || []).map((option) => {
                  return (
                    <div key={option.id}>
                      <OptionSelect
                        option={option}
                        current={options[option.id]}
                        updateOption={setOptionValue}
                        title={option.title ?? ""}
                        name={`options[${option.id}]`}
                        data-testid="product-options"
                        disabled={!!disabled || isAdding}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {customisation && (
            <div className="mk-custom">
              <div className="mk-custom-head">
                <label htmlFor="product-customisation" className="mk-option-legend">
                  {customisation.label}
                </label>
                <span className="mk-custom-count" aria-hidden="true">
                  {countCharacters(customText)} / {customisation.maxLength}
                </span>
              </div>
              <input
                ref={customField}
                id="product-customisation"
                name="customisation"
                type="text"
                className="mk-custom-input"
                value={customText}
                maxLength={customisation.maxLength}
                required
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="done"
                placeholder="Type it here"
                aria-describedby="product-customisation-hint"
                aria-invalid={customMissing || undefined}
                disabled={!!disabled || isAdding}
                data-testid="product-customisation-input"
                onChange={(event) => {
                  setCustomText(event.target.value)
                  setCustomMissing(false)
                  setCartError(null)
                  setAdded(false)
                }}
              />
              <p id="product-customisation-hint" className="mk-custom-hint">
                Up to {customisation.maxLength} characters, spaces included. Made with your text,
                so it may not be returnable if you change your mind. See{" "}
                <LocalizedClientLink href="/returns">Returns</LocalizedClientLink>.
              </p>
            </div>
          )}

          {selectedVariant && isValidVariant && (
            <p
              className="text-small-regular text-ui-fg-subtle"
              data-testid="product-availability"
            >
              {getVariantStockLabel(selectedVariant)}
            </p>
          )}

          <Button
            type="submit"
            disabled={
              !inStock ||
              !hasPrice ||
              !selectedVariant ||
              !!disabled ||
              isAdding ||
              !isValidVariant
            }
            variant="primary"
            className="w-full h-12"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {!selectedVariant
              ? "Select variant"
              : !inStock || !isValidVariant
              ? "Out of stock"
              : !hasPrice
              ? "Currently unavailable"
              : "Add to cart"}
          </Button>
          {cartError && <p role="alert" className="text-small-regular text-ui-fg-error" data-testid="cart-error">{cartError}</p>}
          {added && <p role="status" className="text-small-regular" data-testid="cart-success">Added to your bag.</p>}
        </form>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          hasPrice={hasPrice}
          cartError={cartError}
          added={added}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
