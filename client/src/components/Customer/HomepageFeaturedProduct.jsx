import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdAddShoppingCart,
  MdArrowForward,
  MdInventory2,
  MdStar,
} from "react-icons/md";
import { HiHeart, HiOutlineHeart } from "react-icons/hi";
import { buildCategoryCatalogPath, formatCategoryLabel } from "../../utils/storefrontNavigation";
import {
  getDisplayReviewCount,
} from "../../utils/storefrontReviews";
import useStorefrontFavorites from "../../hooks/useStorefrontFavorites";

const formatPrice = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "";
};

const needsPortraitStage = (title = "") => /calvin klein|ck one/i.test(String(title));

const getOpticalStageClass = (item = {}) => {
  const category = String(item.category || "").toLowerCase();
  if (category === "mens-watches") return " is-watch-stage";
  if (category === "motorcycle") return " is-wide-stage";
  if (category === "mobile-accessories" && /airpods max/i.test(String(item.title || ""))) {
    return " is-accessory-stage";
  }
  if (needsPortraitStage(item.title)) return " is-portrait-stage";
  return "";
};

export default function HomepageFeaturedProduct({
  item = {},
  index = 0,
  onAddToCart = () => {},
}) {
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(index === 0);
  const { isFavorite, toggleFavorite } = useStorefrontFavorites();
  const productId = item.id ?? item._id;
  const favorited = isFavorite(productId);
  const outOfStock = item.stock <= 0;
  const stockClass = outOfStock ? "is-out" : item.stock <= 10 ? "is-low" : "is-available";
  const opticalStageClass = getOpticalStageClass(item);
  const rating = Number(item.rating);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const reviewCount = getDisplayReviewCount(item);
  const categoryLabel = formatCategoryLabel(item.category);

  useEffect(() => {
    if (index === 0 || imageRef.current?.complete) setImageLoaded(true);
  }, [index, item.thumbnail]);

  return (
    <article className={`storefront-feature-card${outOfStock ? " is-out-of-stock" : ""}`}>
      <div className="storefront-feature-card__media">
        <img
          ref={imageRef}
          className={`${imageLoaded ? "is-loaded" : ""}${opticalStageClass}`}
          src={item.thumbnail}
          alt={item.title}
          loading={index < 2 ? "eager" : "lazy"}
          fetchpriority={index === 0 ? "high" : "auto"}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
        <span className={`storefront-feature-card__stock ${stockClass} b25-tabular`}>
          <MdInventory2 aria-hidden="true" />
          {outOfStock ? "Out of stock" : `${item.stock} in stock`}
        </span>
      </div>

      <div className="storefront-feature-card__body">
        <div className="storefront-feature-card__identity">
          <p className="storefront-feature-card__category b25-ui-label">{categoryLabel}</p>
          <h3>{item.title}</h3>
          <p className="storefront-feature-card__price b25-tabular">{formatPrice(item.price)}</p>
          {hasRating ? (
            <p className="storefront-feature-card__rating">
              <MdStar aria-hidden="true" />
              <span className="storefront-feature-card__rating-value b25-tabular">
                {rating.toFixed(1)}
              </span>
              <span className="storefront-feature-card__rating-sep" aria-hidden="true" />
              <span className="storefront-feature-card__reviews">
                <span className="storefront-feature-card__reviews-count b25-tabular">
                  {reviewCount}
                </span>
                {" "}
                <span className="storefront-feature-card__reviews-label">
                  {reviewCount === 1 ? "review" : "reviews"}
                </span>
              </span>
            </p>
          ) : null}
        </div>

        <div className="storefront-feature-card__actions">
          <div className="storefront-feature-card__cta-row">
            <button
              type="button"
              className="storefront-feature-card__buy"
              onClick={onAddToCart}
              disabled={outOfStock}
              aria-disabled={outOfStock}
            >
              <span className="storefront-feature-card__icon" aria-hidden="true">
                <MdAddShoppingCart />
              </span>
              Add to bag
            </button>
            <button
              type="button"
              className={`storefront-feature-card__favorite${favorited ? " is-active" : ""}`}
              aria-label={favorited ? `Remove ${item.title} from favorites` : `Save ${item.title} to favorites`}
              aria-pressed={favorited}
              onClick={() => toggleFavorite(productId)}
            >
              {favorited ? <HiHeart aria-hidden="true" /> : <HiOutlineHeart aria-hidden="true" />}
            </button>
          </div>
          <Link
            className="storefront-feature-card__view"
            to={buildCategoryCatalogPath(item.category)}
            aria-label={`View ${item.title} in shop`}
          >
            View product
            <span className="storefront-feature-card__icon storefront-feature-card__icon--arrow" aria-hidden="true">
              <MdArrowForward />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
