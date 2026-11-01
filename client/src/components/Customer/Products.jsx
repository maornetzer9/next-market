import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useSelector } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";

import { useProductFilter } from "../../hooks/filterModel";
import { applyRouteScroll } from "../../hooks/routeScrollRestoration";
import { useCartOperations, useLoadProducts } from "../../utils/products";
import { isAuthenticatedUser } from "../../utils/auth";
import { useAuthModal } from "../../auth/AuthModalContext";
import { getCategoryFromSearch } from "../../utils/storefrontNavigation";
import {
  buildCatalogSearchParams,
  CATALOG_PAGE_SIZE,
  clampCatalogPage,
  getCatalogTotalPages,
  getPageFromSearch,
  resolveCatalogPageScrollDuration,
  sliceCatalogPage,
} from "../../utils/catalogPagination";
import {
  CATALOG_COLLECTION_EXIT_DURATION,
  getCatalogCollectionEnterMotion,
  getCatalogCollectionExitMotion,
  ReadyPageContent,
} from "../../UI/PageContentEntrance";
import FilterModel from "../Filter-Model/FilterModel";
import CatalogPagination from "./CatalogPagination";
import Product from "./Product";
import PageHeader from "./PageHeader";
import ScrollToTop from "./ScrollToTop";
import useStorefrontFavorites from "../../hooks/useStorefrontFavorites";
import { MdOutlineInventory2 } from "react-icons/md";
import "../../css/products.css";

function getCatalogCollectionKey(categoryFromUrl) {
  return categoryFromUrl || "all";
}

function getCatalogFilterKey(searchTerm, priceRange) {
  const minimum = priceRange?.[0] ?? "";
  const maximum = priceRange?.[1] ?? "";
  return `${searchTerm || ""}|${minimum}-${maximum}`;
}

export default function Products() {
  const productLoad = useLoadProducts();
  const { products } = useSelector((state) => state.productsReducer);
  const { user } = useSelector((state) => state.userReducer);
  const { addToCart } = useCartOperations();
  const { isFavorite, toggleFavorite } = useStorefrontFavorites();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const authenticated = isAuthenticatedUser(user);
  const { openAuthModal } = useAuthModal();
  const reduceMotion = useReducedMotion();
  const [isMobileShopLayout, setIsMobileShopLayout] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );
  const [catalogScrolled, setCatalogScrolled] = useState(false);
  const hasPresentedProducts = useRef(false);
  const collectionShellRef = useRef(null);
  const resultsAnchorRef = useRef(null);
  const previousCollectionKeyRef = useRef(null);
  const paginationResetKeyRef = useRef(null);
  const pageTransitionGenerationRef = useRef(0);
  const pendingPageScrollRef = useRef(false);
  const [collectionMinHeight, setCollectionMinHeight] = useState(undefined);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileShopLayout(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let frameId = 0;
    let lastCatalogScrolled;

    const updateScrollState = () => {
      const nextCatalogScrolled = window.scrollY > 150;

      if (nextCatalogScrolled !== lastCatalogScrolled) {
        lastCatalogScrolled = nextCatalogScrolled;
        setCatalogScrolled(nextCatalogScrolled);
      }
    };

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateScrollState();
      });
    };
    updateScrollState();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const {
    categories,
    filteredProducts,
    filteredCategory,
    priceBounds,
    priceRange,
    selectedPriceRange,
    searchTerm,
    isFiltering,
    handlePriceChange,
    handleCategoryChange,
    handleSearchChange,
  } = useProductFilter(products);

  const categoryFromUrl = getCategoryFromSearch(searchParams);
  const pageFromUrl = getPageFromSearch(searchParams);
  const categoryKey = getCatalogCollectionKey(categoryFromUrl);
  const liveFilterKey = getCatalogFilterKey(searchTerm, priceRange);
  const [filterKey, setFilterKey] = useState(liveFilterKey);
  const filterIdentity = `${categoryKey}|${filterKey}`;
  const paginationResetKey = `${categoryKey}|${searchTerm || ""}|${
    selectedPriceRange ? `${selectedPriceRange[0]}-${selectedPriceRange[1]}` : "bounds"
  }`;
  const collectionEnterMotion = getCatalogCollectionEnterMotion(reduceMotion);
  const collectionExitMotion = getCatalogCollectionExitMotion(reduceMotion);

  useEffect(() => {
    handleCategoryChange(categoryFromUrl);
  }, [categoryFromUrl, handleCategoryChange]);

  const writeCatalogParams = useCallback((category, page, { replace = true } = {}) => {
    setSearchParams(
      buildCatalogSearchParams({ category, page }),
      { replace },
    );
  }, [setSearchParams]);

  const handleCatalogCategoryChange = useCallback((category) => {
    handleCategoryChange(category);
    writeCatalogParams(category, 1, { replace: true });
  }, [handleCategoryChange, writeCatalogParams]);

  const visibleProducts = useMemo(
    () => filteredProducts.filter((item) => item.price > 0),
    [filteredProducts],
  );
  const [presentedProducts, setPresentedProducts] = useState(visibleProducts);

  useEffect(() => {
    if (filterKey === liveFilterKey) return undefined;
    const delay = searchTerm ? 180 : 80;
    const timer = window.setTimeout(() => setFilterKey(liveFilterKey), delay);
    return () => window.clearTimeout(timer);
  }, [filterKey, liveFilterKey, searchTerm]);

  useLayoutEffect(() => {
    if (filterKey !== liveFilterKey) return;
    setPresentedProducts(visibleProducts);
  }, [filterIdentity, filterKey, liveFilterKey, visibleProducts]);

  const totalPages = getCatalogTotalPages(presentedProducts.length, CATALOG_PAGE_SIZE);
  const currentPage = clampCatalogPage(pageFromUrl, totalPages || 1);
  const pageProducts = useMemo(
    () => sliceCatalogPage(presentedProducts, currentPage, CATALOG_PAGE_SIZE),
    [presentedProducts, currentPage],
  );
  const collectionKey = `${filterIdentity}|p${currentPage}`;
  const useCompactResults = isFiltering && presentedProducts.length <= 5;

  useLayoutEffect(() => {
    if (
      previousCollectionKeyRef.current !== null
      && previousCollectionKeyRef.current !== collectionKey
      && collectionShellRef.current
    ) {
      setCollectionMinHeight(collectionShellRef.current.offsetHeight);
    }

    previousCollectionKeyRef.current = collectionKey;
  }, [collectionKey]);

  // User filter identity changed → reset to page 1 (replace, no history spam).
  // Ignore price-bound initialization when products first load.
  useEffect(() => {
    if (paginationResetKeyRef.current === null) {
      paginationResetKeyRef.current = paginationResetKey;
      return;
    }

    if (paginationResetKeyRef.current === paginationResetKey) return;
    paginationResetKeyRef.current = paginationResetKey;

    if (pageFromUrl !== 1) {
      writeCatalogParams(categoryFromUrl, 1, { replace: true });
    }
  }, [paginationResetKey, pageFromUrl, categoryFromUrl, writeCatalogParams]);

  // Clamp out-of-range page after filters shrink the result set.
  useEffect(() => {
    if (totalPages <= 0) return;
    if (pageFromUrl !== currentPage) {
      writeCatalogParams(categoryFromUrl, currentPage, { replace: true });
    }
  }, [totalPages, pageFromUrl, currentPage, categoryFromUrl, writeCatalogParams]);

  useEffect(() => {
    if (products.length) hasPresentedProducts.current = true;
  }, [products.length]);

  const scrollToCatalogResults = useCallback(() => {
    const anchor = resultsAnchorRef.current;
    if (!anchor) return;

    const commandHeight = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--b25-command-height"),
    ) || 64;
    const top = Math.max(
      0,
      window.scrollY + anchor.getBoundingClientRect().top - commandHeight - 8,
    );
    const distance = top - window.scrollY;
    applyRouteScroll(top, {
      animate: !reduceMotion,
      reduceMotion: Boolean(reduceMotion),
      duration: resolveCatalogPageScrollDuration(distance, Boolean(reduceMotion)),
    });
  }, [reduceMotion]);

  const handlePageChange = useCallback((page) => {
    const nextPage = clampCatalogPage(page, totalPages || 1);
    if (nextPage === currentPage) return;

    pageTransitionGenerationRef.current += 1;
    pendingPageScrollRef.current = true;
    setIsPageTransitioning(true);
    writeCatalogParams(categoryFromUrl, nextPage, { replace: false });
  }, [
    totalPages,
    currentPage,
    writeCatalogParams,
    categoryFromUrl,
  ]);

  const requestAddToCart = useCallback(
    (product, quantity) => {
      if (!authenticated) {
        openAuthModal("sign-in", location);
        return Promise.resolve({ code: 401, message: "Authentication required" });
      }
      return addToCart(product, quantity);
    },
    [addToCart, authenticated, openAuthModal, location],
  );

  const handleCollectionExitComplete = useCallback(() => {
    if (pendingPageScrollRef.current) {
      pendingPageScrollRef.current = false;
      scrollToCatalogResults();
    }
  }, [scrollToCatalogResults]);

  const handleCollectionEnterComplete = useCallback(() => {
    setCollectionMinHeight(undefined);
    setIsPageTransitioning(false);
  }, []);

  // Safety unlock if exit never fires (e.g. reduced motion / identical content).
  useEffect(() => {
    if (!isPageTransitioning) return undefined;
    const generation = pageTransitionGenerationRef.current;
    const unlockAfter = (CATALOG_COLLECTION_EXIT_DURATION + 0.42) * 1000;
    const timer = window.setTimeout(() => {
      if (pageTransitionGenerationRef.current !== generation) return;
      if (pendingPageScrollRef.current) {
        pendingPageScrollRef.current = false;
        scrollToCatalogResults();
      }
      setCollectionMinHeight(undefined);
      setIsPageTransitioning(false);
    }, unlockAfter);
    return () => window.clearTimeout(timer);
  }, [isPageTransitioning, collectionKey, scrollToCatalogResults]);

  return (
    <ReadyPageContent ready={!productLoad.loading}>
      <section className="products_form" aria-labelledby="catalog-title">
        <PageHeader
          className="catalog-heading"
          icon={MdOutlineInventory2}
          title="Product catalog"
          titleId="catalog-title"
          description="Explore our handpicked products across all categories."
          meta={
            <p className="catalog-heading__count b25-tabular" aria-live="polite">
              {visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}
            </p>
          }
        />

      <div ref={resultsAnchorRef} className="catalog-results-anchor">
        <FilterModel
          variant="b25"
          categories={categories}
          selectedCategory={filteredCategory}
          onCategoryChange={handleCatalogCategoryChange}
          onPriceChange={handlePriceChange}
          onSearch={handleSearchChange}
          priceBounds={priceBounds}
          priceRange={priceRange}
          resultsCount={visibleProducts.length}
          stuck={catalogScrolled}
        />
      </div>

      <div
        ref={collectionShellRef}
        className="product-collection-shell"
        style={collectionMinHeight ? { minHeight: collectionMinHeight } : undefined}
      >
        <AnimatePresence mode="wait" initial={false} onExitComplete={handleCollectionExitComplete}>
          <motion.div
            key={collectionKey}
            className="product-collection"
            aria-live="polite"
            initial={collectionEnterMotion.initial}
            animate={collectionEnterMotion.animate}
            exit={collectionExitMotion}
            transition={collectionEnterMotion.transition}
            onAnimationComplete={(definition) => {
              // Ignore exit completion on the leaving node; unlock after enter only.
              if (definition && typeof definition === "object" && definition.opacity === 0) return;
              handleCollectionEnterComplete();
            }}
          >
            {presentedProducts.length ? (
              <LayoutGroup id="catalog-product-cards">
                <div className={`product-grid${useCompactResults ? " is-filtered-compact" : ""}`}>
                  {pageProducts.map((item, index) => {
                    const enableSiblingLayout = isMobileShopLayout && !reduceMotion;
                    return (
                      <motion.div
                        key={item.id ?? item._id}
                        className="product-grid__item"
                        layout={enableSiblingLayout ? "position" : false}
                        transition={
                          enableSiblingLayout
                            ? { layout: { duration: 0.46, ease: [0.33, 0.0, 0.2, 1] } }
                            : undefined
                        }
                      >
                        <Product
                          item={item}
                          variant={!useCompactResults && index === 0 ? "featured" : "standard"}
                          featured={!useCompactResults && index === 0}
                          favorited={isFavorite(item.id ?? item._id)}
                          onToggleFavorite={toggleFavorite}
                          onAddToCart={requestAddToCart}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </LayoutGroup>
            ) : (
              <div className="catalog-empty" role="status">
                <span className="catalog-empty__trace" aria-hidden="true" />
                <p className="b25-ui-label">No matching products</p>
                <h2>{productLoad.error ? "Products unavailable." : "Nothing occupies this range."}</h2>
                <p>{productLoad.error ? "The catalog could not be loaded." : "Adjust the existing category, price, or title controls above."}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

        <CatalogPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={presentedProducts.length}
          pageSize={CATALOG_PAGE_SIZE}
          onPageChange={handlePageChange}
          disabled={isPageTransitioning}
        />

        <ScrollToTop />
      </section>
    </ReadyPageContent>
  );
}
