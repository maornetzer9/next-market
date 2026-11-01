import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { MdCached, MdChevronRight, MdShield, MdVerified } from "react-icons/md";
import AuthBrandMark from "../../auth/AuthBrandMark";
import PaymentMethodTile from "./PaymentMethodTile";
import { PAYMENT_METHODS } from "./payment-methods";
import {
  CATALOG_PATH,
  STOREFRONT_CATEGORIES,
  buildCategoryCatalogPath,
  selectFooterExploreCategories,
  selectFooterExploreExtraCategory,
  selectFooterShopCategories,
} from "../../utils/storefrontNavigation";
import "../../css/storefront-footer.css";

const MOBILE_QUICK_PREFERRED_SLUGS = ["mens-watches", "laptops", "motorcycle"];

const MOBILE_TRUST_ITEMS = [
  { id: "secure", label: "Secure shopping", Icon: MdShield },
  { id: "returns", label: "Easy returns", Icon: MdCached },
  { id: "quality", label: "Curated quality", Icon: MdVerified },
];

/**
 * Compact discovery links for the phone footer — Shop all + up to 3 preferred
 * live categories (never a full category dump; Categories sheet owns that).
 */
function selectMobileFooterQuickCategories(categories = []) {
  const catalog = Array.isArray(categories) ? categories : [];
  const bySlug = new Map(
    catalog.map((item) => [String(item.slug || "").toLowerCase(), item])
  );
  const picks = [];

  for (const slug of MOBILE_QUICK_PREFERRED_SLUGS) {
    const match = bySlug.get(slug);
    if (match) picks.push(match);
    if (picks.length >= 3) return picks;
  }

  for (const item of catalog) {
    if (picks.length >= 3) break;
    const slug = String(item.slug || "").toLowerCase();
    if (picks.some((pick) => String(pick.slug || "").toLowerCase() === slug)) continue;
    picks.push(item);
  }

  return picks;
}

export default function StorefrontFooter({
  authenticated = false,
  onOpenSignIn,
  onOpenRegister,
  categories = STOREFRONT_CATEGORIES,
}) {
  const catalog = categories.length ? categories : STOREFRONT_CATEGORIES;
  const shopCategories = useMemo(() => selectFooterShopCategories(catalog), [catalog]);
  const exploreCategories = useMemo(() => selectFooterExploreCategories(catalog), [catalog]);
  const exploreExtraCategory = useMemo(
    () => selectFooterExploreExtraCategory(catalog),
    [catalog]
  );
  const mobileQuickCategories = useMemo(
    () => selectMobileFooterQuickCategories(catalog),
    [catalog]
  );

  const customerLinks = authenticated ? (
    <>
      <Link to="/customer/account" className="storefront-footer__chip">
        <span>My account</span>
        <MdChevronRight aria-hidden="true" />
      </Link>
      <Link to="/customer/orders" className="storefront-footer__chip">
        <span>Orders</span>
        <MdChevronRight aria-hidden="true" />
      </Link>
    </>
  ) : (
    <>
      <button
        type="button"
        className="storefront-footer__chip"
        onClick={(event) => onOpenSignIn?.(event.currentTarget)}
      >
        <span>Sign in</span>
        <MdChevronRight aria-hidden="true" />
      </button>
      <button
        type="button"
        className="storefront-footer__chip"
        onClick={(event) => onOpenRegister?.(event.currentTarget)}
      >
        <span>Create account</span>
        <MdChevronRight aria-hidden="true" />
      </button>
    </>
  );

  return (
    <footer className="storefront-footer" aria-label="Store footer">
      <span className="storefront-footer__trace" aria-hidden="true" />

      {/* Desktop / tablet — approved multi-column layout (unchanged). */}
      <div className="storefront-footer__inner">
        <div className="storefront-footer__brand">
          <AuthBrandMark
            className="auth-brand-mark--footer"
            animateEnter={false}
            pauseOffscreen
          />
          <p className="storefront-footer__mark">
            <span>NEXT</span>
            <span aria-hidden="true">/</span>
            <strong>MARKET</strong>
          </p>
          <p className="storefront-footer__tagline">
            Thoughtfully selected goods for everyday living.
          </p>
        </div>

        <nav className="storefront-footer__nav" aria-label="Shop">
          <p className="storefront-footer__label b25-ui-label">Shop</p>
          <Link to={CATALOG_PATH}>Shop all</Link>
          {shopCategories.map(({ slug, label }) => (
            <Link key={slug} to={buildCategoryCatalogPath(slug)}>
              {label}
            </Link>
          ))}
        </nav>

        <nav className="storefront-footer__nav" aria-label="Explore categories">
          <p className="storefront-footer__label b25-ui-label">Explore</p>
          {exploreCategories.map(({ slug, label }) => (
            <Link key={slug} to={buildCategoryCatalogPath(slug)}>
              {label}
            </Link>
          ))}
          {exploreExtraCategory ? (
            <Link
              key={exploreExtraCategory.slug}
              to={buildCategoryCatalogPath(exploreExtraCategory.slug)}
            >
              {exploreExtraCategory.label}
            </Link>
          ) : null}
        </nav>

        <nav className="storefront-footer__nav" aria-label="Customer">
          <p className="storefront-footer__label b25-ui-label">Customer</p>
          {authenticated ? (
            <>
              <Link to="/customer/account">My account</Link>
              <Link to="/customer/orders">Orders</Link>
            </>
          ) : (
            <>
              <button
                type="button"
                className="storefront-footer__action"
                onClick={(event) => onOpenSignIn?.(event.currentTarget)}
              >
                Sign in
              </button>
              <button
                type="button"
                className="storefront-footer__action"
                onClick={(event) => onOpenRegister?.(event.currentTarget)}
              >
                Create account
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Phone-only compact footer — separate from Categories sheet / bottom nav. */}
      <div className="storefront-footer__mobile">
        <div className="storefront-footer__mobile-brand">
          <AuthBrandMark
            className="auth-brand-mark--footer auth-brand-mark--footer-mobile"
            animateEnter={false}
            pauseOffscreen
          />
          <p className="storefront-footer__mark">
            <span>NEXT</span>
            <span aria-hidden="true">/</span>
            <strong>MARKET</strong>
          </p>
          <p className="storefront-footer__tagline">
            Thoughtfully selected goods for everyday living.
          </p>
        </div>

        <nav className="storefront-footer__chips" aria-label="Quick links">
          <Link to={CATALOG_PATH} className="storefront-footer__chip">
            <span>Shop all</span>
            <MdChevronRight aria-hidden="true" />
          </Link>
          {mobileQuickCategories.map(({ slug, label }) => (
            <Link
              key={slug}
              to={buildCategoryCatalogPath(slug)}
              className="storefront-footer__chip"
            >
              <span>{label}</span>
              <MdChevronRight aria-hidden="true" />
            </Link>
          ))}
          {customerLinks}
        </nav>

        <ul className="storefront-footer__trust">
          {MOBILE_TRUST_ITEMS.map(({ id, label, Icon }) => (
            <li key={id}>
              <span>{label}</span>
              <Icon aria-hidden="true" />
            </li>
          ))}
        </ul>

        <div
          className="storefront-footer__payments"
          aria-label="Accepted payment methods"
        >
          {PAYMENT_METHODS.map((method) => (
            <PaymentMethodTile key={method.id} method={method.id} />
          ))}
        </div>

        <p className="storefront-footer__legal b25-ui-label">
          NEXT / MARKET — curated everyday commerce
        </p>
      </div>

      <p className="storefront-footer__legal storefront-footer__legal--desktop b25-ui-label">
        NEXT / MARKET — curated everyday commerce
      </p>
    </footer>
  );
}
