import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdExpandMore } from "react-icons/md";
import {
  buildCategoryCatalogPath,
  getPrimaryNavLimit,
  isCategoryCatalogActive,
  selectOverflowNavCategories,
  selectPrimaryNavCategories,
} from "../../utils/storefrontNavigation";
import { useDarkMode } from "../../hooks/darkMode";
import CategoryBrowseIcon from "./CategoryBrowseIcon";

const MOBILE_NAV_QUERY = "(max-width: 820px)";

/**
 * Desktop: restrained primary category links + Categories mega-menu (overflow only).
 * Mobile: compact Categories control listing the full catalog (no primary strip).
 */
export default function StorefrontCategoryNav({ categories = [] }) {
  const location = useLocation();
  const [darkMode] = useDarkMode();
  const browseButtonRef = useRef(null);
  const menuRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_NAV_QUERY).matches : false
  );
  const [primaryLimit, setPrimaryLimit] = useState(() =>
    typeof window !== "undefined" ? getPrimaryNavLimit(window.innerWidth) : 6
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mobileMedia = window.matchMedia(MOBILE_NAV_QUERY);
    const breakpointMedia = [
      window.matchMedia("(max-width: 1179px)"),
      window.matchMedia("(max-width: 1479px)"),
      window.matchMedia("(max-width: 1679px)"),
    ];

    const syncMobile = () => setIsMobile(mobileMedia.matches);
    const syncPrimaryLimit = () => setPrimaryLimit(getPrimaryNavLimit(window.innerWidth));

    syncMobile();
    syncPrimaryLimit();
    mobileMedia.addEventListener("change", syncMobile);
    breakpointMedia.forEach((media) => media.addEventListener("change", syncPrimaryLimit));
    window.addEventListener("resize", syncPrimaryLimit);
    return () => {
      mobileMedia.removeEventListener("change", syncMobile);
      breakpointMedia.forEach((media) => media.removeEventListener("change", syncPrimaryLimit));
      window.removeEventListener("resize", syncPrimaryLimit);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const primaryCategories = useMemo(
    () => (isMobile ? [] : selectPrimaryNavCategories(categories, primaryLimit)),
    [categories, isMobile, primaryLimit]
  );

  const overflowCategories = useMemo(
    () => selectOverflowNavCategories(categories, primaryCategories),
    [categories, primaryCategories]
  );

  const showBrowse = overflowCategories.length > 0;

  useEffect(() => {
    if (!showBrowse) setMenuOpen(false);
  }, [showBrowse]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event) => {
      const target = event.target;
      if (browseButtonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const overflowActive = overflowCategories.some((item) =>
    isCategoryCatalogActive(location, item.slug)
  );
  const browseActive = menuOpen || overflowActive;

  return (
    <nav className="b25-customer-command__nav" aria-label="Store departments">
      {!isMobile ? (
        <div className="b25-category-nav__primary">
          {primaryCategories.map((item) => {
            const active = isCategoryCatalogActive(location, item.slug);
            return (
              <Link
                key={item.slug}
                to={buildCategoryCatalogPath(item.slug)}
                className={`b25-customer-command__nav-link is-category${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}

      {showBrowse ? (
        <div className={`b25-category-nav__browse${menuOpen ? " is-open" : ""}`}>
          <button
            ref={browseButtonRef}
            type="button"
            className={`b25-customer-command__nav-link is-category is-browse${
              browseActive ? " is-active" : ""
            }`}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-controls="b25-category-mega-menu"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <CategoryBrowseIcon className="b25-category-browse__icon" />
            <span>Categories</span>
            <MdExpandMore className="b25-category-browse__chevron" aria-hidden="true" />
          </button>

          {menuOpen ? (
            <div
              ref={menuRef}
              id="b25-category-mega-menu"
              className={`b25-category-mega b25-internal-scroll${darkMode ? " is-dark" : ""}${
                isMobile ? " is-mobile" : ""
              }`}
              role="dialog"
              aria-label={isMobile ? "All categories" : "More categories"}
            >
              <p className="b25-category-mega__eyebrow b25-ui-label">
                {isMobile ? "Browse categories" : "More categories"}
              </p>
              <div className="b25-category-mega__grid" role="list">
                {overflowCategories.map((item) => {
                  const active = isCategoryCatalogActive(location, item.slug);
                  return (
                    <Link
                      key={item.slug}
                      role="listitem"
                      to={buildCategoryCatalogPath(item.slug)}
                      className={`b25-category-mega__link${active ? " is-active" : ""}`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
