import React, { Suspense } from "react"

import VariantImageGallery from "@modules/products/components/image-gallery/variant-image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo, { ProductDescription } from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      {/* Photos on the left, everything needed to buy on the right. On small
          screens the same order stacks: photos, name, price, options, details. */}
      <div
        className="joy-product-layout mk-product content-container"
        data-testid="product-container"
      >
        <div className="joy-product-images mk-product-media">
          <VariantImageGallery product={product} />
        </div>
        <div className="mk-product-summary">
          <ProductInfo product={product} />
          <div className="joy-product-purchase mk-product-purchase">
            <ProductOnboardingCta />
            <ProductActions product={product} region={region} />
          </div>
          <ProductDescription product={product} />
          <ProductTabs product={product} />
        </div>
      </div>
      <div
        className="content-container mk-related"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
