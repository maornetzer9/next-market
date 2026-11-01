import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  MdAdd,
  MdAddShoppingCart,
  MdExpandLess,
  MdExpandMore,
  MdFavorite,
  MdFavoriteBorder,
  MdInventory2,
  MdRemove,
} from "react-icons/md";
import {
  LuBadgeCheck,
  LuClock,
  LuHeadphones,
  LuLock,
  LuMapPin,
  LuPackage,
  LuPackageCheck,
  LuRotateCcw,
  LuShield,
  LuShieldCheck,
  LuSparkles,
  LuTruck,
  LuZap,
} from "react-icons/lu";

import { formatCategoryLabel } from "../../utils/storefrontNavigation";
import "../../css/product.css";

const BENEFIT_STROKE = 1.65;

/** Curated storefront benefits — claims the shop can reasonably make. */
const B = {
  secure: { id: "secure", label: "Secure checkout", Icon: LuShieldCheck },
  returns: { id: "returns", label: "Easy returns", Icon: LuRotateCcw },
  delivery: { id: "delivery", label: "Fast delivery", Icon: LuTruck },
  selected: { id: "selected", label: "Carefully selected", Icon: LuBadgeCheck },
  authenticity: { id: "authenticity", label: "Authenticity checked", Icon: LuShield },
  payment: { id: "payment", label: "Protected payment", Icon: LuLock },
  tracked: { id: "tracked", label: "Tracked delivery", Icon: LuMapPin },
  support: { id: "support", label: "Customer support", Icon: LuHeadphones },
  quality: { id: "quality", label: "Quality checked", Icon: LuPackageCheck },
  exchanges: { id: "exchanges", label: "Easy exchanges", Icon: LuRotateCcw },
  ready: { id: "ready", label: "Ready to ship", Icon: LuPackage },
  packaging: { id: "packaging", label: "Secure packaging", Icon: LuPackage },
  curated: { id: "curated", label: "Curated pick", Icon: LuSparkles },
  popular: { id: "popular", label: "Popular choice", Icon: LuSparkles },
  dispatch: { id: "dispatch", label: "Fast dispatch", Icon: LuZap },
  purchase: { id: "purchase", label: "Secure purchase", Icon: LuShieldCheck },
  prompt: { id: "prompt", label: "Prompt handling", Icon: LuClock },
};

const CATEGORY_BENEFIT_POOLS = {
  beauty: [B.selected, B.returns, B.secure, B.popular, B.quality, B.curated, B.exchanges],
  "skin-care": [B.selected, B.quality, B.returns, B.secure, B.curated, B.popular, B.packaging],
  fragrances: [B.authenticity, B.packaging, B.tracked, B.returns, B.secure, B.curated, B.selected],
  furniture: [B.tracked, B.returns, B.support, B.quality, B.packaging, B.secure, B.ready],
  "home-decoration": [B.selected, B.returns, B.tracked, B.quality, B.curated, B.packaging, B.ready],
  motorcycle: [B.purchase, B.support, B.tracked, B.selected, B.payment, B.secure, B.quality],
  laptops: [B.secure, B.payment, B.dispatch, B.tracked, B.support, B.ready, B.quality],
  smartphones: [B.secure, B.payment, B.dispatch, B.tracked, B.support, B.ready, B.purchase],
  "mobile-accessories": [B.secure, B.dispatch, B.returns, B.tracked, B.payment, B.ready, B.quality],
  "mens-watches": [B.authenticity, B.secure, B.returns, B.packaging, B.tracked, B.curated, B.payment],
  sunglasses: [B.authenticity, B.returns, B.secure, B.packaging, B.selected, B.quality, B.curated],
  groceries: [B.delivery, B.selected, B.returns, B.ready, B.dispatch, B.quality, B.tracked],
  "kitchen-accessories": [B.returns, B.delivery, B.selected, B.quality, B.ready, B.secure, B.exchanges],
  "mens-shoes": [B.returns, B.tracked, B.selected, B.secure, B.quality, B.exchanges, B.ready],
};

const DEFAULT_BENEFIT_POOL = [B.secure, B.returns, B.delivery, B.tracked, B.quality, B.support, B.ready];

/** FNV-1a — stable across renders; never Math.random. */
function stableProductHash(value) {
  const text = String(value ?? "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Pick 3 category-aware benefits from a pool using a product-id offset.
 * Same product always gets the same set; adjacent ids rarely match.
 */
function getProductBenefits(category, productId) {
  const slug = String(category || "").trim().toLowerCase();
  const pool = CATEGORY_BENEFIT_POOLS[slug] || DEFAULT_BENEFIT_POOL;
  const hash = stableProductHash(`${slug}:${productId ?? ""}`);
  const start = hash % pool.length;
  const stride = (hash % Math.max(pool.length - 1, 1)) + 1;
  const picked = [];
  let index = start;

  while (picked.length < 3 && picked.length < pool.length) {
    const candidate = pool[index % pool.length];
    if (!picked.some((entry) => entry.id === candidate.id)) {
      picked.push(candidate);
    }
    index += stride;
  }

  return picked;
}

/** Gentler than `--std-ease` so unlocked mobile card height does not front-load. */
const STD_HEIGHT_EASE = [0.33, 0.0, 0.2, 1];

/*
 * Desktop CSS keeps card height locked, so benefits height can delay after shell.
 * Mobile card height is unlocked — shell + benefits heights must trade in parallel
 * or the card grows then shrinks (visible next-card jump).
 */
const SHELL_OPEN_TRANSITION = { duration: 0.46, delay: 0, ease: STD_HEIGHT_EASE };
const SHELL_CLOSE_TRANSITION = { duration: 0.46, delay: 0, ease: STD_HEIGHT_EASE };

const BENEFITS_HEIGHT_HIDE_TRANSITION = {
  height: { duration: 0.46, delay: 0, ease: STD_HEIGHT_EASE },
  marginTop: { duration: 0.46, delay: 0, ease: STD_HEIGHT_EASE },
};

const BENEFITS_HEIGHT_SHOW_TRANSITION = {
  height: { duration: 0.46, delay: 0, ease: STD_HEIGHT_EASE },
  marginTop: { duration: 0.46, delay: 0, ease: STD_HEIGHT_EASE },
};

function useIsMobileShopLayout() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

function ProductBenefits({ items, hidden = false, motionEnabled = false, benefitsOpen = true, bandPx = 70 }) {
  const reduceMotion = useReducedMotion();
  if (!items?.length) return null;

  const open = motionEnabled ? benefitsOpen || reduceMotion : true;

  const listProps = {
    className: [
      "b25-product-card__benefits",
      motionEnabled ? (open ? "is-benefits-visible" : "is-benefits-faded") : "",
    ]
      .filter(Boolean)
      .join(" "),
    "aria-label": "Shopping benefits",
    "aria-hidden": hidden ? "true" : undefined,
  };

  const children = items.map(({ id, label, Icon }) => (
    <li key={id} className="b25-product-card__benefit">
      <Icon aria-hidden="true" strokeWidth={BENEFIT_STROKE} />
      <span>{label}</span>
    </li>
  ));

  /*
   * Mobile: animate height/margin only on the wrapper.
   * Opacity must NOT run on this ul — Framer's will-change:opacity promotes a
   * translucent compositor layer that flattens to a solid gray panel over the
   * card gradient. Fade the benefit children via CSS instead.
   */
  if (motionEnabled) {
    return (
      <motion.ul
        {...listProps}
        initial={false}
        animate={{
          height: open ? bandPx : 0,
          marginTop: 0,
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : open
              ? BENEFITS_HEIGHT_SHOW_TRANSITION
              : BENEFITS_HEIGHT_HIDE_TRANSITION
        }
        style={{
          overflow: "hidden",
          background: "transparent",
          backgroundColor: "transparent",
        }}
      >
        {children}
      </motion.ul>
    );
  }

  return <ul {...listProps}>{children}</ul>;
}

/**
 * In-flow height twin of the absolute lower-band.
 * Shrinks by exactly the description-shell growth (shellDelta) so outer card
 * height stays identical collapsed ↔ expanded. Benefits still collapse fully
 * inside the absolute lower-band; only this footprint is residual-matched.
 */
const LOWER_BAND_SPACER_MT = 8;

function LowerBandHeightSpacer({ open = true, bandPx = 78, shellDelta = 0 }) {
  const reduceMotion = useReducedMotion();
  const expandedHeight = Math.max(0, bandPx + LOWER_BAND_SPACER_MT - Math.max(0, shellDelta));
  return (
    <motion.div
      className="b25-product-card__lower-band-spacer"
      aria-hidden="true"
      initial={false}
      animate={{
        height: open || reduceMotion ? bandPx : expandedHeight,
        marginTop: open || reduceMotion ? LOWER_BAND_SPACER_MT : 0,
      }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : open
            ? BENEFITS_HEIGHT_SHOW_TRANSITION
            : BENEFITS_HEIGHT_HIDE_TRANSITION
      }
    />
  );
}

function ProductCategoryTag({ category }) {
  if (!category) return null;

  return (
    <span className="b25-product-tag" aria-label={`Category: ${category}`}>
      <span className="b25-product-tag__dot" aria-hidden="true" />
      <span className="b25-product-tag__label">{category}</span>
    </span>
  );
}

/**
 * Shop-card description preview.
 * Shared lifecycle with desktop: shell height + benefits opacity/height crossfade.
 * Desktop: CSS drives geometry inside a locked card height.
 * Mobile: Framer Motion drives the same timings so card height + sibling Y interpolate.
 */
function ExpandableProductDescription({
  text,
  productId,
  title,
  benefits,
  motionLayout = false,
  renderBenefits = true,
  onMotionStateChange,
}) {
  const textRef = useRef(null);
  const shellRef = useRef(null);
  const collapseTimerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [shellExpandedPx, setShellExpandedPx] = useState(null);
  const [bandPx, setBandPx] = useState(78);
  const [collapsedShellPx, setCollapsedShellPx] = useState(37.5);
  const descId = `product-desc-${String(productId ?? "item")}`;

  const clearTimers = useCallback(() => {
    if (collapseTimerRef.current) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setExpanded(false);
    setCollapsing(false);
    setShellExpandedPx(null);
    clearTimers();
  }, [productId, text, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const benefitsOpen = !expanded || collapsing;
  const shellOpen = expanded && !collapsing;
  const shellDelta =
    shellOpen && shellExpandedPx != null
      ? Math.max(0, shellExpandedPx - collapsedShellPx)
      : 0;

  // Sync parent lower-band before paint so spacer/benefits collapse with the shell.
  useLayoutEffect(() => {
    onMotionStateChange?.({
      expanded,
      collapsing,
      benefitsOpen,
      bandPx,
      shellDelta,
      motionLayout,
    });
  }, [expanded, collapsing, benefitsOpen, bandPx, shellDelta, motionLayout, onMotionStateChange]);

  const readShellTokens = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) {
      return { fontSize: 12.5, lineHeight: 1.5, maxLines: 8, collapsedLines: 2, band: 78 };
    }
    const styles = window.getComputedStyle(shell.closest(".b25-product-card") || shell);
    return {
      fontSize: parseFloat(styles.getPropertyValue("--std-desc-size")) || 12.5,
      lineHeight: parseFloat(styles.getPropertyValue("--std-desc-lh")) || 1.5,
      maxLines: parseFloat(styles.getPropertyValue("--std-desc-expanded")) || 8,
      collapsedLines: parseFloat(styles.getPropertyValue("--std-desc-collapsed")) || 2,
      band: parseFloat(styles.getPropertyValue("--std-lower-band")) || 78,
    };
  }, []);

  const measureExpandedShellPx = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return null;

    const { fontSize, lineHeight, maxLines, collapsedLines } = readShellTokens();
    const maxPx = fontSize * lineHeight * maxLines;
    const minPx = fontSize * lineHeight * collapsedLines;

    const probe = document.createElement("p");
    probe.setAttribute("aria-hidden", "true");
    probe.textContent = text;
    probe.style.cssText = [
      "position:absolute",
      "visibility:hidden",
      "pointer-events:none",
      "inset:0 auto auto 0",
      `width:${shell.clientWidth}px`,
      `font-size:${fontSize}px`,
      `line-height:${lineHeight}`,
      "font-family:inherit",
      "font-weight:inherit",
      "letter-spacing:inherit",
      "margin:0",
      "padding:0",
      "white-space:normal",
      "overflow:visible",
    ].join(";");
    shell.appendChild(probe);
    const natural = probe.scrollHeight;
    shell.removeChild(probe);

    return Math.round(Math.min(Math.max(natural, minPx), maxPx));
  }, [text, readShellTokens]);

  const syncTokenMetrics = useCallback(() => {
    const { fontSize, lineHeight, collapsedLines, band } = readShellTokens();
    setCollapsedShellPx(fontSize * lineHeight * collapsedLines);
    setBandPx(band);
  }, [readShellTokens]);

  const measureTruncation = useCallback(() => {
    const node = textRef.current;
    if (!node || expanded || collapsing) return;

    const overflowsCollapsed = node.scrollHeight > node.clientHeight + 1;
    setTruncated(overflowsCollapsed);
  }, [expanded, collapsing]);

  useLayoutEffect(() => {
    syncTokenMetrics();
    measureTruncation();
  }, [syncTokenMetrics, measureTruncation, text, productId]);

  // Mobile only: keep Framer shell height in sync with content. Desktop uses CSS
  // line tokens + transitions — inline min-height snaps Show Less downward.
  useLayoutEffect(() => {
    if (!motionLayout || !expanded || collapsing) return undefined;

    const applyMeasure = () => {
      const measured = measureExpandedShellPx();
      if (measured != null) setShellExpandedPx(measured);
    };

    applyMeasure();
    const raf = window.requestAnimationFrame(applyMeasure);
    return () => window.cancelAnimationFrame(raf);
  }, [motionLayout, expanded, collapsing, measureExpandedShellPx, text]);

  useEffect(() => {
    const node = textRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      syncTokenMetrics();
      measureTruncation();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [measureTruncation, syncTokenMetrics]);

  const handleToggle = useCallback(() => {
    if (expanded) {
      setCollapsing(true);
      onMotionStateChange?.({
        expanded: true,
        collapsing: true,
        benefitsOpen: true,
        bandPx,
        shellDelta: 0,
        motionLayout,
      });
      clearTimers();
      collapseTimerRef.current = window.setTimeout(() => {
        setExpanded(false);
        setCollapsing(false);
        setShellExpandedPx(null);
        onMotionStateChange?.({
          expanded: false,
          collapsing: false,
          benefitsOpen: true,
          bandPx,
          shellDelta: 0,
          motionLayout,
        });
        collapseTimerRef.current = null;
      }, reduceMotion ? 0 : 500);
      return;
    }

    setCollapsing(false);
    let measured = null;
    let nextShellDelta = 0;
    if (motionLayout) {
      measured = measureExpandedShellPx();
      setShellExpandedPx(measured);
      nextShellDelta = Math.max(0, (measured ?? collapsedShellPx) - collapsedShellPx);
    } else {
      setShellExpandedPx(null);
    }
    setExpanded(true);
    onMotionStateChange?.({
      expanded: true,
      collapsing: false,
      benefitsOpen: false,
      bandPx,
      shellDelta: nextShellDelta,
      motionLayout,
    });
  }, [
    expanded,
    clearTimers,
    motionLayout,
    measureExpandedShellPx,
    reduceMotion,
    onMotionStateChange,
    bandPx,
    collapsedShellPx,
  ]);

  if (!text) {
    if (!renderBenefits) return null;
    return (
      <ProductBenefits
        items={benefits}
        motionEnabled={motionLayout}
        benefitsOpen
        bandPx={bandPx}
      />
    );
  }

  const blockClass = [
    "b25-product-card__description-block",
    expanded ? "is-expanded" : "",
    collapsing ? "is-collapsing" : "",
    truncated ? "is-truncated" : "",
    motionLayout ? "is-motion-layout" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shellTarget = shellOpen
    ? shellExpandedPx ?? collapsedShellPx
    : collapsedShellPx;

  const shellNode = motionLayout ? (
    <motion.div
      ref={shellRef}
      className="b25-product-card__description-shell"
      initial={false}
      animate={{ height: reduceMotion ? shellTarget : shellTarget }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : shellOpen
            ? SHELL_OPEN_TRANSITION
            : SHELL_CLOSE_TRANSITION
      }
      style={{ overflow: "hidden" }}
    >
      <p ref={textRef} id={descId} className="b25-product-card__description b25-product-card__description--base">
        {text}
      </p>
      {expanded || collapsing ? (
        <p
          className={`b25-product-card__description b25-product-card__description--reveal${collapsing ? " is-exiting" : ""}`}
          aria-hidden="true"
        >
          {text}
        </p>
      ) : null}
    </motion.div>
  ) : (
    <div ref={shellRef} className="b25-product-card__description-shell">
      <p ref={textRef} id={descId} className="b25-product-card__description b25-product-card__description--base">
        {text}
      </p>
      {expanded || collapsing ? (
        <p
          className={`b25-product-card__description b25-product-card__description--reveal${collapsing ? " is-exiting" : ""}`}
          aria-hidden="true"
        >
          {text}
        </p>
      ) : null}
    </div>
  );

  return (
    <>
      <div className={blockClass}>
        {shellNode}
        {truncated || expanded || collapsing ? (
          <button
            type="button"
            className="b25-product-card__description-toggle"
            aria-expanded={expanded && !collapsing}
            aria-controls={descId}
            aria-label={
              expanded && !collapsing
                ? `Show less of ${title || "product"} description`
                : `Show more of ${title || "product"} description`
            }
            onClick={(event) => {
              handleToggle();
              if (event.detail > 0) event.currentTarget.blur();
            }}
          >
            <span>{expanded && !collapsing ? "Show less" : "Show more"}</span>
            {expanded && !collapsing ? (
              <MdExpandLess aria-hidden="true" />
            ) : (
              <MdExpandMore aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
      {renderBenefits ? (
        <ProductBenefits
          items={benefits}
          hidden={expanded && !collapsing}
          motionEnabled={motionLayout}
          benefitsOpen={benefitsOpen}
          bandPx={bandPx}
        />
      ) : null}
    </>
  );
}

export default function Product({
  item = {},
  featured = false,
  variant,
  favorited = false,
  onToggleFavorite,
  onAddToCart = () => {},
}) {
  const isFeatured = variant === "featured" || (variant !== "standard" && featured);
  const isMobileLayout = useIsMobileShopLayout();
  const imageRef = useRef(null);
  const bodyRef = useRef(null);
  const infoRef = useRef(null);
  const lowerBandTopRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(featured);
  const [quantity, setQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lowerBandTop, setLowerBandTop] = useState(null);
  const [descMotion, setDescMotion] = useState({
    expanded: false,
    collapsing: false,
    benefitsOpen: true,
    bandPx: 78,
    shellDelta: 0,
    motionLayout: false,
  });
  const productId = item.id ?? item._id;
  const useMotionLayout = !isFeatured && isMobileLayout;
  const productBenefits = getProductBenefits(item.category, productId);

  const handleMotionStateChange = useCallback((next) => {
    setDescMotion(next);
  }, []);

  /*
   * Freeze lower-band top from the collapsed title+description stack only
   * (excludes the in-flow height spacer). Never remeasure while open.
   */
  useLayoutEffect(() => {
    if (!useMotionLayout) {
      lowerBandTopRef.current = null;
      setLowerBandTop(null);
      return undefined;
    }
    if (descMotion.expanded || descMotion.collapsing) return undefined;

    const measure = () => {
      const main = infoRef.current;
      const body = bodyRef.current;
      if (!main || !body) return;
      const nextTop = Math.round(main.getBoundingClientRect().bottom - body.getBoundingClientRect().top + 8);
      if (lowerBandTopRef.current === nextTop) return;
      lowerBandTopRef.current = nextTop;
      setLowerBandTop(nextTop);
    };

    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(infoRef.current);
    return () => observer.disconnect();
  }, [
    useMotionLayout,
    descMotion.expanded,
    descMotion.collapsing,
    item.description,
    item.title,
    productId,
  ]);

  const stock = Number(item.stock) || 0;
  const outOfStock = stock <= 0;
  const stockClass = outOfStock
    ? "is-out"
    : stock <= 10
      ? "is-low"
      : "is-available";

  const controlsLocked = outOfStock || submitting;
  const canDecrease = !controlsLocked && quantity > 0;
  const canIncrease = !controlsLocked && quantity < stock;
  const canAdd = !controlsLocked && quantity > 0;

  useEffect(() => {
    if (featured || imageRef.current?.complete) setImageLoaded(true);
  }, [featured, item.thumbnail]);

  useEffect(() => {
    if (outOfStock && quantity !== 0) setQuantity(0);
  }, [outOfStock, quantity]);

  const handleDecrease = useCallback(() => {
    if (!canDecrease) return;
    setQuantity((prev) => Math.max(0, prev - 1));
  }, [canDecrease]);

  const handleIncrease = useCallback(() => {
    if (!canIncrease) return;
    setQuantity((prev) => Math.min(stock, prev + 1));
  }, [canIncrease, stock]);

  const handleAdd = useCallback(async () => {
    if (!canAdd) return;
    setSubmitting(true);
    try {
      const result = await onAddToCart(item, quantity);
      if (result && result.code === 200) {
        setQuantity(0);
      }
    } finally {
      setSubmitting(false);
    }
  }, [canAdd, item, onAddToCart, quantity]);

  const category = formatCategoryLabel(item.category);
  const hasCategory = Boolean(category);

  const actions = (
    <div className="b25-product-card__actions" aria-label={`Cart quantity for ${item.title}`}>
      <div
        className={`product_amount_form${outOfStock ? " is-disabled" : ""}`}
        role="group"
        aria-label={`Select quantity for ${item.title}`}
      >
        <button
          type="button"
          disabled={!canDecrease}
          aria-disabled={!canDecrease}
          onClick={handleDecrease}
          aria-label={`Decrease quantity of ${item.title}`}
        >
          <MdRemove aria-hidden="true" />
        </button>
        <output
          className="b25-tabular"
          aria-live="polite"
          aria-label={`Selected quantity: ${quantity}`}
        >
          {quantity}
        </output>
        <button
          type="button"
          disabled={!canIncrease}
          aria-disabled={!canIncrease}
          onClick={handleIncrease}
          aria-label={`Increase quantity of ${item.title}`}
        >
          <MdAdd aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="b25-product-card__add"
        disabled={!canAdd}
        aria-disabled={!canAdd}
        onClick={handleAdd}
        aria-label={
          outOfStock
            ? `${item.title} is out of stock`
            : `Add ${quantity || 1} ${item.title} to cart`
        }
      >
        {!(outOfStock && !isFeatured) ? (
          <MdAddShoppingCart aria-hidden="true" />
        ) : null}
        <span className="b25-product-card__add-label">
          {outOfStock ? (
            "Out of stock"
          ) : (
            <>
              <span className="b25-product-card__add-lead">Add</span>
              {" "}
              <span className="b25-product-card__add-rest">to cart</span>
            </>
          )}
        </span>
      </button>
    </div>
  );

  const lowerBandClass = [
    "b25-product-card__lower-band",
    descMotion.motionLayout ? "is-motion-layout" : "",
    descMotion.expanded ? "is-expanded" : "",
    descMotion.collapsing ? "is-collapsing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={`b25-product-card${isFeatured ? " is-featured" : " is-standard"}${quantity ? " is-in-cart" : ""}${outOfStock ? " is-out-of-stock" : ""}`}
    >
      <button
        type="button"
        className={`b25-product-card__favorite${favorited ? " is-active" : ""}`}
        aria-label={favorited ? `Remove ${item.title} from favorites` : `Save ${item.title} to favorites`}
        aria-pressed={favorited}
        onClick={() => onToggleFavorite?.(productId)}
      >
        {favorited ? <MdFavorite aria-hidden="true" /> : <MdFavoriteBorder aria-hidden="true" />}
      </button>
      <div className="b25-product-card__media">
        {!isFeatured && hasCategory ? (
          <ProductCategoryTag category={category} />
        ) : null}
        <img
          ref={imageRef}
          className={imageLoaded ? "is-loaded" : ""}
          src={item.thumbnail}
          alt={item.title}
          loading={featured ? "eager" : "lazy"}
          fetchpriority={featured ? "high" : "auto"}
          decoding={featured ? "auto" : "async"}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
        <span className="b25-product-card__ground" aria-hidden="true" />
      </div>

      <div className="b25-product-card__body" ref={bodyRef}>
        {isFeatured ? (
          <>
            <ProductCategoryTag category={hasCategory ? category : ""} />
            <h2>{item.title}</h2>
            <p className="b25-product-card__description">{item.description}</p>
            <div className="b25-product-card__commerce">
              <p className="b25-product-card__price b25-tabular">${Number(item.price).toFixed(2)}</p>
            </div>
            <span className={`b25-product-card__stock ${stockClass} b25-tabular`}>
              <MdInventory2 aria-hidden="true" />
              {outOfStock ? "Out of stock" : `${stock} in stock`}
            </span>
            {actions}
          </>
        ) : useMotionLayout ? (
          <>
            <div className="b25-product-card__info">
              <div className="b25-product-card__info-main" ref={infoRef}>
                <h2>{item.title}</h2>
                <ExpandableProductDescription
                  text={item.description}
                  productId={productId}
                  title={item.title}
                  benefits={productBenefits}
                  motionLayout
                  renderBenefits={false}
                  onMotionStateChange={handleMotionStateChange}
                />
              </div>
              <LowerBandHeightSpacer
                open={descMotion.benefitsOpen}
                bandPx={descMotion.bandPx}
                shellDelta={descMotion.shellDelta}
              />
            </div>
            <div className="b25-product-card__commerce-col b25-product-card__commerce-col--meta">
              <div className="b25-product-card__commerce">
                <p className="b25-product-card__price b25-tabular">${Number(item.price).toFixed(2)}</p>
              </div>
              <span className={`b25-product-card__stock ${stockClass} b25-tabular`}>
                <MdInventory2 aria-hidden="true" />
                {outOfStock ? "Out of stock" : `${stock} in stock`}
              </span>
            </div>
            <div
              className={lowerBandClass}
              style={lowerBandTop != null ? { top: lowerBandTop } : undefined}
            >
              <ProductBenefits
                items={productBenefits}
                hidden={descMotion.expanded && !descMotion.collapsing}
                motionEnabled
                benefitsOpen={descMotion.benefitsOpen}
                bandPx={descMotion.bandPx}
              />
              <span className="b25-product-card__lower-band-divider" aria-hidden="true" />
              {actions}
            </div>
          </>
        ) : (
          <>
            <div className="b25-product-card__info">
              <h2>{item.title}</h2>
              <ExpandableProductDescription
                text={item.description}
                productId={productId}
                title={item.title}
                benefits={productBenefits}
                motionLayout={false}
              />
            </div>
            <div className="b25-product-card__commerce-col">
              <div className="b25-product-card__commerce">
                <p className="b25-product-card__price b25-tabular">${Number(item.price).toFixed(2)}</p>
              </div>
              <span className={`b25-product-card__stock ${stockClass} b25-tabular`}>
                <MdInventory2 aria-hidden="true" />
                {outOfStock ? "Out of stock" : `${stock} in stock`}
              </span>
              {actions}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
