import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  MdArrowForward,
  MdAutoAwesome,
  MdComputer,
  MdDirectionsBike,
  MdHeadphones,
  MdLocalOffer,
  MdLockOutline,
  MdLogin,
  MdOutlinePerson,
  MdPhoneIphone,
  MdShoppingBasket,
  MdSpeed,
  MdWatch,
  MdWaterDrop,
  MdWeekend,
} from "react-icons/md";

import { useLoadProducts, useCartOperations } from "../../utils/products";
import { isAuthenticatedUser } from "../../utils/auth";
import {
  deriveStorefrontCategories,
  buildCategoryCatalogPath,
  formatCategoryLabel,
} from "../../utils/storefrontNavigation";
import {
  resolveHomepageEditorPicks,
  resolveHomepageHeroProduct,
} from "../../utils/homepageCuration";
import { ReadyPageContent } from "../../UI/PageContentEntrance";
import { useAuthModal } from "../../auth/AuthModalContext";
import AuthBrandMark from "../../auth/AuthBrandMark";
import HomepageFeaturedProduct from "./HomepageFeaturedProduct";
import ScrollToTop from "./ScrollToTop";
import "../../css/homepage.css";

const CATEGORY_META = {
  "mens-watches": { label: "Mens Watches", icon: MdWatch },
  laptops: { label: "Laptops", icon: MdComputer },
  smartphones: { label: "Smartphones", icon: MdPhoneIphone },
  "mobile-accessories": { label: "Mobile Accessories", icon: MdHeadphones },
  motorcycle: { label: "Motorcycle", icon: MdDirectionsBike },
  sunglasses: { label: "Sunglasses", icon: MdAutoAwesome },
  beauty: { label: "Beauty", icon: MdAutoAwesome },
  fragrances: { label: "Fragrances", icon: MdWaterDrop },
  furniture: { label: "Furniture", icon: MdWeekend },
  groceries: { label: "Groceries", icon: MdShoppingBasket },
};

function sortById(a, b) {
  const left = Number(a.id ?? a._id ?? 0);
  const right = Number(b.id ?? b._id ?? 0);
  return left - right;
}

function categoryRepresentative(products, categoryKey) {
  const items = products
    .filter((item) => item.price > 0 && String(item.category || "").toLowerCase() === categoryKey)
    .sort(sortById);

  if (categoryKey === "fragrances") {
    return items.find((item) => !/calvin klein/i.test(String(item.title || ""))) || items[0];
  }

  return items[0];
}

function isWatchProduct(item) {
  return String(item?.category || "").toLowerCase() === "mens-watches";
}

export default function Homepage() {
  const productLoad = useLoadProducts();
  const { products } = useSelector((state) => state.productsReducer);
  const { user } = useSelector((state) => state.userReducer);
  const { addToCart } = useCartOperations();
  const location = useLocation();
  const { openAuthModal } = useAuthModal();

  const validProducts = useMemo(
    () => products.filter((item) => item.price > 0),
    [products]
  );

  const storefrontCategories = useMemo(
    () => deriveStorefrontCategories(validProducts),
    [validProducts]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    for (const item of validProducts) {
      const key = String(item.category || "").toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [validProducts]);

  const featuredProducts = useMemo(
    () => resolveHomepageEditorPicks(products),
    [products]
  );
  const heroProduct = useMemo(() => resolveHomepageHeroProduct(products), [products]);
  const heroIsWatch = isWatchProduct(heroProduct);

  const authenticated = isAuthenticatedUser(user);

  const requireAuthForCart = (item) => {
    if (!authenticated) {
      openAuthModal("sign-in", location);
      return;
    }
    addToCart(item, 1);
  };

  return (
    <ReadyPageContent
      ready={!productLoad.loading}
      as="main"
      className="storefront-home"
      aria-labelledby="storefront-home-title"
    >
        <section className="storefront-hero">
          <div className="storefront-hero__copy">
            <div className="storefront-hero__brand-row">
              <AuthBrandMark
                className="auth-brand-mark--hero"
                animateEnter={false}
                pauseOffscreen
              />
              <p className="storefront-hero__eyebrow b25-ui-label">
                <span>NEXT</span>
                <span aria-hidden="true">/</span>
                <strong>MARKET</strong>
              </p>
            </div>
            <h1 id="storefront-home-title">Essentials worth bringing home.</h1>
            <p className="storefront-hero__lead">
              Watches, tech and everyday essentials selected in one place.
            </p>
            <div className="storefront-hero__actions">
              <Link className="storefront-hero__cta" to="/customer/products">
                <span>Shop the collection</span>
                <span className="storefront-hero__icon" aria-hidden="true">
                  <MdArrowForward />
                </span>
              </Link>
              {authenticated ? (
                <Link className="storefront-hero__secondary" to="/customer/account">
                  <span className="storefront-hero__icon" aria-hidden="true">
                    <MdOutlinePerson />
                  </span>
                  <span>My account</span>
                </Link>
              ) : (
                <button
                  type="button"
                  className="storefront-hero__secondary"
                  onClick={(event) => openAuthModal("sign-in", location, event.currentTarget)}
                >
                  <span className="storefront-hero__icon" aria-hidden="true">
                    <MdLogin />
                  </span>
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>

          {heroProduct ? (
            <div className="storefront-hero__visual">
              <div className={`storefront-hero__visual-frame${heroIsWatch ? " is-watch-stage" : ""}`}>
                <img
                  src={heroProduct.thumbnail}
                  alt={heroProduct.title}
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                />
              </div>
              <div className="storefront-hero__visual-meta">
                <p className="storefront-hero__caption b25-ui-label">
                  {formatCategoryLabel(heroProduct.category)}
                </p>
                <p className="storefront-hero__product-name">{heroProduct.title}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="storefront-categories" aria-labelledby="storefront-categories-title">
          <div className="storefront-section-heading">
            <p className="b25-ui-label">Explore</p>
            <h2 id="storefront-categories-title">Shop by category</h2>
          </div>
          <div className="storefront-categories__grid">
            {storefrontCategories.map(({ slug, label }) => {
              const meta = CATEGORY_META[slug] || { label: formatCategoryLabel(slug), icon: MdArrowForward };
              const Icon = meta.icon;
              const preview = categoryRepresentative(validProducts, slug);
              const count = categoryCounts.get(slug) || 0;

              return (
                <div key={slug} className="storefront-categories__item">
                  <Link className="storefront-category-card" to={buildCategoryCatalogPath(slug)}>
                    <span className="storefront-category-card__main">
                      <span className="storefront-category-card__icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <span className="storefront-category-card__content">
                        <strong>{meta.label || label}</strong>
                        <span className="storefront-category-card__count b25-tabular">
                          {count ? `${count} products` : "Browse"}
                        </span>
                      </span>
                      <span className="storefront-category-card__arrow" aria-hidden="true">
                        <MdArrowForward />
                      </span>
                    </span>
                    <span className="storefront-category-card__media" aria-hidden="true">
                      {preview?.thumbnail ? (
                        <img src={preview.thumbnail} alt="" loading="lazy" decoding="async" />
                      ) : null}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section className="storefront-featured" aria-labelledby="storefront-featured-title">
          <div className="storefront-section-heading storefront-section-heading--split storefront-featured__heading">
            <div>
              <p className="b25-ui-label">Curated</p>
              <h2 id="storefront-featured-title">Editor&apos;s picks</h2>
              <p className="storefront-featured__lead">
                Handpicked highlights from across the store.
                <br />
                Quality picks, selected for everyday living.
              </p>
            </div>
            <Link className="storefront-section-heading__link storefront-featured__all" to="/customer/products">
              View all picks
              <MdArrowForward aria-hidden="true" />
            </Link>
          </div>

          {featuredProducts.length ? (
            <>
              <div className="storefront-featured__grid">
                {featuredProducts.map((item, index) => (
                  <HomepageFeaturedProduct
                    key={item.id ?? item._id}
                    item={item}
                    index={index}
                    onAddToCart={() => requireAuthForCart(item)}
                  />
                ))}
              </div>

              <ul className="storefront-featured__values" aria-label="Why shop Editor&apos;s picks">
                <li>
                  <span className="storefront-featured__value-icon" aria-hidden="true">
                    <MdAutoAwesome />
                  </span>
                  <span>
                    <strong>Curated quality</strong>
                    <span>Handpicked by our team</span>
                  </span>
                </li>
                <li>
                  <span className="storefront-featured__value-icon" aria-hidden="true">
                    <MdLocalOffer />
                  </span>
                  <span>
                    <strong>Best value</strong>
                    <span>Competitive everyday pricing</span>
                  </span>
                </li>
                <li>
                  <span className="storefront-featured__value-icon" aria-hidden="true">
                    <MdSpeed />
                  </span>
                  <span>
                    <strong>Fast &amp; reliable</strong>
                    <span>Designed for a smooth shopping experience</span>
                  </span>
                </li>
                <li>
                  <span className="storefront-featured__value-icon" aria-hidden="true">
                    <MdLockOutline />
                  </span>
                  <span>
                    <strong>Secure shopping</strong>
                    <span>Account and order flows protected</span>
                  </span>
                </li>
              </ul>
            </>
          ) : (
            <div className="storefront-empty" role="status">
              <p className="b25-ui-label">Shop</p>
              <h2>{productLoad.error ? "We couldn't load products right now." : "New arrivals coming soon."}</h2>
            </div>
          )}
        </section>
      <ScrollToTop />
    </ReadyPageContent>
  );
}
