const INVALID_IMAGE_VALUES = new Set(["", "add link to product image"]);

function firstValidImage(candidates) {
  for (const candidate of candidates.flat(Infinity)) {
    if (typeof candidate !== "string") continue;
    const value = candidate.trim();
    if (!INVALID_IMAGE_VALUES.has(value.toLowerCase())) return value;
  }
  return "";
}

/** One precedence path for current Admin product imagery. */
export function resolveAdminProductImage(product, fallbackProduct) {
  return firstValidImage([
    product?.thumbnail,
    product?.image,
    product?.imageUrl,
    product?.imageURL,
    product?.images,
    fallbackProduct?.thumbnail,
    fallbackProduct?.image,
    fallbackProduct?.imageUrl,
    fallbackProduct?.imageURL,
    fallbackProduct?.images,
  ]);
}

/** Historical snapshot fields win; current catalog media is the existing fallback. */
export function resolveAdminPurchaseImage(purchase, product) {
  return firstValidImage([
    purchase?.thumbnail,
    purchase?.image,
    purchase?.imageUrl,
    purchase?.imageURL,
    purchase?.images,
    resolveAdminProductImage(product),
  ]);
}
