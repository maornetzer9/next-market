import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MdChair,
  MdCheckroom,
  MdChevronRight,
  MdClose,
  MdDarkMode,
  MdHome,
  MdLaptopMac,
  MdLightMode,
  MdLocalFlorist,
  MdOutlineInventory2,
  MdReceiptLong,
  MdSearch,
  MdShoppingBag,
  MdShoppingBasket,
  MdShoppingCart,
  MdSmartphone,
  MdSpa,
  MdSportsMotorsports,
  MdWatch,
  MdWbSunny,
  MdCategory,
  MdDevicesOther,
  MdDirectionsCar,
} from "react-icons/md";
import AuthBrandMark from "../../auth/AuthBrandMark";
import { useDarkMode } from "../../hooks/darkMode";
import { lockBodyScroll } from "../../utils/bodyScrollLock";
import {
  CATALOG_PATH,
  STOREFRONT_CATEGORIES,
  buildCategoryCatalogPath,
  groupMobileMenuCategories,
} from "../../utils/storefrontNavigation";
import CategoryBrowseIcon from "./CategoryBrowseIcon";
import "../../css/storefront-mobile-nav.css";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SHEET_EASE = [0.22, 0.61, 0.36, 1];
const SHEET_DURATION = 0.32;

function resolveCategoryIcon(slug) {
  const key = String(slug || "").toLowerCase();
  if (key.includes("watch")) return MdWatch;
  if (key.includes("laptop")) return MdLaptopMac;
  if (key.includes("smartphone") || key === "phones") return MdSmartphone;
  if (key.includes("tablet")) return MdLaptopMac;
  if (key.includes("motorcycle")) return MdSportsMotorsports;
  if (key.includes("vehicle")) return MdDirectionsCar;
  if (key.includes("sport")) return MdSportsMotorsports;
  if (key.includes("mobile") || key.includes("accessories")) return MdDevicesOther;
  if (key.includes("sunglass")) return MdWbSunny;
  if (key.includes("home") || key.includes("decoration") || key.includes("kitchen")) return MdHome;
  if (key.includes("beauty") || key.includes("skin")) return MdSpa;
  if (key.includes("fragrance")) return MdLocalFlorist;
  if (key.includes("furniture")) return MdChair;
  if (key.includes("grocer")) return MdShoppingBasket;
  if (
    key.includes("shirt") ||
    key.includes("shoe") ||
    key.includes("dress") ||
    key.includes("bag") ||
    key.includes("top") ||
    key.includes("jewel")
  ) {
    return MdCheckroom;
  }
  return MdCategory;
}

function CategoryTile({ to, label, icon: Icon, accent = false, onNavigate }) {
  return (
    <Link
      to={to}
      className={`storefront-mobile-sheet__tile${accent ? " is-accent" : ""}`}
      onClick={onNavigate}
    >
      <span className="storefront-mobile-sheet__tile-icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="storefront-mobile-sheet__tile-label">{label}</span>
      <MdChevronRight className="storefront-mobile-sheet__tile-chevron" aria-hidden="true" />
    </Link>
  );
}

function CategoriesSheet({
  open,
  onClose,
  categories,
  darkMode,
  toggleDarkMode,
  returnFocusRef,
}) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const searchRef = useRef(null);
  const titleId = useId();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => groupMobileMenuCategories(categories), [categories]);

  const normalizedQuery = query.trim().toLowerCase();
  const filterItems = (items) => {
    if (!normalizedQuery) return items;
    return items.filter((item) => String(item.label || "").toLowerCase().includes(normalizedQuery));
  };

  const filteredShop = filterItems(groups.shop);
  const filteredExplore = filterItems(groups.explore);
  const filteredMore = filterItems(groups.more);
  const shopAllMatches =
    !normalizedQuery || "shop all".includes(normalizedQuery);
  const hasCategoryResults =
    shopAllMatches ||
    filteredShop.length > 0 ||
    filteredExplore.length > 0 ||
    filteredMore.length > 0;

  useEffect(() => {
    if (!open) {
      setQuery("");
      return undefined;
    }
    return lockBodyScroll("storefrontSheetScrollLock");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const focusTarget = searchRef.current || closeButtonRef.current;
    const timer = window.setTimeout(() => focusTarget?.focus(), 30);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusables = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return undefined;
    }
    if (!wasOpenRef.current) return undefined;
    wasOpenRef.current = false;
    const trigger = returnFocusRef?.current;
    if (!trigger) return undefined;
    const timer = window.setTimeout(() => trigger.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [open, returnFocusRef]);

  const ThemeIcon = darkMode ? MdLightMode : MdDarkMode;
  const sheetMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { y: "100%", opacity: 0.96 },
        animate: { y: 0, opacity: 1 },
        exit: { y: "100%", opacity: 0.96 },
      };

  const renderGroup = (label, items, includeShopAll = false) => {
    if (!includeShopAll && items.length === 0) return null;
    if (includeShopAll && !shopAllMatches && items.length === 0) return null;

    return (
      <section className="storefront-mobile-sheet__group" aria-label={label}>
        <h2 className="storefront-mobile-sheet__group-label">{label}</h2>
        <div className="storefront-mobile-sheet__grid">
          {includeShopAll && shopAllMatches ? (
            <CategoryTile
              to={CATALOG_PATH}
              label="Shop all"
              icon={MdShoppingBag}
              accent
              onNavigate={onClose}
            />
          ) : null}
          {items.map((item) => (
            <CategoryTile
              key={item.slug}
              to={buildCategoryCatalogPath(item.slug)}
              label={item.label}
              icon={resolveCategoryIcon(item.slug)}
              onNavigate={onClose}
            />
          ))}
        </div>
      </section>
    );
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="storefront-mobile-sheet-root" key="categories-sheet">
          <motion.button
            type="button"
            className="storefront-mobile-sheet__backdrop"
            aria-label="Close categories menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.28, ease: SHEET_EASE }}
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            className={`storefront-mobile-sheet${darkMode ? " is-dark" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            {...sheetMotion}
            transition={{ duration: reduceMotion ? 0.01 : SHEET_DURATION, ease: SHEET_EASE }}
          >
            <div className="storefront-mobile-sheet__chrome">
              <div className="storefront-mobile-sheet__handle" aria-hidden="true" />

              <header className="storefront-mobile-sheet__header">
                <div className="storefront-mobile-sheet__brand">
                  <AuthBrandMark
                    className="auth-brand-mark--mobile-sheet"
                    animateEnter={false}
                  />
                  <div className="storefront-mobile-sheet__brand-copy">
                    <p id={titleId} className="storefront-mobile-sheet__mark">
                      <span>NEXT</span>
                      <span aria-hidden="true"> / </span>
                      <strong>MARKET</strong>
                    </p>
                    <p className="storefront-mobile-sheet__tagline">
                      Thoughtfully selected goods for everyday living.
                    </p>
                  </div>
                </div>

                <div className="storefront-mobile-sheet__actions">
                  <button
                    type="button"
                    className="storefront-mobile-sheet__icon-btn"
                    onClick={toggleDarkMode}
                    aria-pressed={darkMode}
                    aria-label={darkMode ? "Use light theme" : "Use dark theme"}
                  >
                    <ThemeIcon aria-hidden="true" />
                  </button>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="storefront-mobile-sheet__icon-btn"
                    onClick={onClose}
                    aria-label="Close categories menu"
                  >
                    <MdClose aria-hidden="true" />
                  </button>
                </div>
              </header>

              <div className="storefront-mobile-sheet__search">
                <label
                  className="storefront-mobile-sheet__search-field"
                  htmlFor="storefront-mobile-category-search"
                >
                  <MdSearch aria-hidden="true" />
                  <input
                    ref={searchRef}
                    id="storefront-mobile-category-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search categories..."
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                </label>
              </div>
            </div>

            <div className="storefront-mobile-sheet__body b25-internal-scroll">
              {!hasCategoryResults ? (
                <div className="storefront-mobile-sheet__empty" role="status">
                  <p className="b25-ui-label">Browse</p>
                  <strong>No categories found</strong>
                </div>
              ) : (
                <>
                  {renderGroup("Shop", filteredShop, true)}
                  {renderGroup("Explore", filteredExplore)}
                  {renderGroup("More", filteredMore)}
                </>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Premium mobile-only bottom navigation + commerce menu sheet (≤767px).
 * Desktop / tablet footer and the 768–820 sticky dock remain unchanged.
 */
export default function StorefrontMobileBottomNav({
  authenticated = false,
  onOpenSignIn,
  categories = STOREFRONT_CATEGORIES,
}) {
  const location = useLocation();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const cart = useSelector((state) => state.cartReducer.user?.cart);
  const categoriesButtonRef = useRef(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const catalog = categories.length ? categories : STOREFRONT_CATEGORIES;
  const itemCount = cart?.items?.length || 0;
  const displayCount = itemCount > 99 ? "99+" : itemCount;

  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      if (!media.matches) setSheetOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const isHome = location.pathname === "/" || location.pathname === "/customer";
  const isShop =
    location.pathname === CATALOG_PATH || location.pathname.startsWith(`${CATALOG_PATH}/`);
  const isOrders = location.pathname.startsWith("/customer/orders");
  const isCart = /\/cart\/?$/.test(location.pathname);

  const handleProtectedNav = (event) => {
    if (authenticated) return;
    event.preventDefault();
    onOpenSignIn?.(event.currentTarget);
  };

  return (
    <>
      <nav className="storefront-mobile-nav" aria-label="Primary mobile navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `storefront-mobile-nav__item${isActive || isHome ? " is-active" : ""}`
          }
          aria-label="Home"
        >
          <MdHome aria-hidden="true" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to={CATALOG_PATH}
          className={({ isActive }) =>
            `storefront-mobile-nav__item${isActive || isShop ? " is-active" : ""}`
          }
          aria-label="Shop"
        >
          <MdOutlineInventory2 aria-hidden="true" />
          <span>Shop</span>
        </NavLink>

        <button
          ref={categoriesButtonRef}
          type="button"
          className={`storefront-mobile-nav__categories${sheetOpen ? " is-open" : ""}`}
          aria-label="Open categories menu"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
        >
          <span className="storefront-mobile-nav__categories-ring" aria-hidden="true">
            <CategoryBrowseIcon className="b25-category-browse__icon storefront-mobile-nav__categories-icon" />
          </span>
        </button>

        <Link
          to="/customer/orders"
          className={`storefront-mobile-nav__item${isOrders ? " is-active" : ""}`}
          aria-label="Orders"
          aria-current={isOrders ? "page" : undefined}
          onClick={handleProtectedNav}
        >
          <MdReceiptLong aria-hidden="true" />
          <span>Orders</span>
        </Link>

        <Link
          to="/customer/cart"
          className={`storefront-mobile-nav__item is-cart${isCart ? " is-active" : ""}`}
          aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          aria-current={isCart ? "page" : undefined}
          onClick={handleProtectedNav}
        >
          <span className="storefront-mobile-nav__cart-icon" aria-hidden="true">
            <MdShoppingCart />
            {itemCount > 0 ? (
              <span className="storefront-mobile-nav__badge b25-tabular">{displayCount}</span>
            ) : null}
          </span>
          <span>Cart</span>
        </Link>
      </nav>

      <CategoriesSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={catalog}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        returnFocusRef={categoriesButtonRef}
      />
    </>
  );
}
