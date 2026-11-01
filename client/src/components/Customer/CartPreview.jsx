import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { MdOutlineShoppingBag, MdShoppingCart } from "react-icons/md";

export const PREVIEW_LIMIT = 3;
const PREVIEW_EASE = [0.4, 0, 0.2, 1];
const REVEAL_EASE = [0.22, 1, 0.36, 1];
const EXIT_EASE = [0.4, 0, 1, 1];
const CONTAINER_MS = 300;
const ROW_ENTER_OPACITY_MS = 300;
const ROW_ENTER_Y_MS = 260;
const ROW_EXIT_MS = 220;
const STAGGER_MS = 35;
const LABEL_EXIT_MS = 140;
const LABEL_ENTER_MS = 170;

const formatMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : String(value ?? "");
};

const getItemKey = (item) => String(item.id ?? item._id ?? item.title);

function CartPreviewRow({ item }) {
  const lineTotal = Number(item.price) * Number(item.quantity || 1);

  return (
    <>
      <span className="nm-cart-preview__thumb">
        <MdOutlineShoppingBag aria-hidden="true" />
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </span>
      <span className="nm-cart-preview__name">{item.title}</span>
      <span className="nm-cart-preview__price b25-tabular">{formatMoney(lineTotal)}</span>
    </>
  );
}

export default function CartPreview({
  open,
  items = [],
  total = 0,
  style,
  panelRef,
  onMouseEnter,
  onMouseLeave,
  onViewCart,
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [scrollReady, setScrollReady] = useState(false);
  const listRef = useRef(null);
  const collapseTimerRef = useRef(null);
  const itemCount = items.length;
  const alwaysVisible = items.slice(0, PREVIEW_LIMIT);
  const extraItems = items.slice(PREVIEW_LIMIT);
  const remaining = Math.max(0, itemCount - PREVIEW_LIMIT);
  const isEmpty = itemCount === 0;
  const canExpand = remaining > 0;

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimerRef.current) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const resetExpansion = useCallback(() => {
    clearCollapseTimer();
    listRef.current?.scrollTo({ top: 0 });
    setExpanded(false);
    setPanelExpanded(false);
    setScrollReady(false);
  }, [clearCollapseTimer]);

  useEffect(() => {
    if (!open) {
      resetExpansion();
    }
  }, [open, resetExpansion]);

  useEffect(() => {
    if (!open) return undefined;
    window.dispatchEvent(new Event("resize"));
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!panelExpanded || !expanded) {
      setScrollReady(false);
      return undefined;
    }

    const totalStaggerMs = Math.max(0, extraItems.length - 1) * STAGGER_MS;
    const timer = window.setTimeout(
      () => setScrollReady(true),
      CONTAINER_MS + ROW_ENTER_OPACITY_MS + totalStaggerMs + 40,
    );
    return () => window.clearTimeout(timer);
  }, [panelExpanded, expanded, extraItems.length]);

  useEffect(() => () => clearCollapseTimer(), [clearCollapseTimer]);

  const handleExpand = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearCollapseTimer();
    setPanelExpanded(true);
    setExpanded(true);
  };

  const handleCollapse = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearCollapseTimer();
    setScrollReady(false);
    listRef.current?.scrollTo({ top: 0 });
    setExpanded(false);

    const exitDuration = reduceMotion
      ? 0
      : ROW_EXIT_MS + Math.max(0, extraItems.length - 1) * STAGGER_MS;

    collapseTimerRef.current = window.setTimeout(() => {
      setPanelExpanded(false);
      collapseTimerRef.current = null;
    }, exitDuration);
  };

  const layoutTransition = {
    layout: {
      duration: reduceMotion ? 0 : CONTAINER_MS / 1000,
      ease: REVEAL_EASE,
    },
  };

  const extraEnterTransition = (index) => {
    const delay = reduceMotion ? 0 : index * (STAGGER_MS / 1000);
    return {
      opacity: {
        duration: reduceMotion ? 0 : ROW_ENTER_OPACITY_MS / 1000,
        delay,
        ease: REVEAL_EASE,
      },
      y: {
        duration: reduceMotion ? 0 : ROW_ENTER_Y_MS / 1000,
        delay,
        ease: REVEAL_EASE,
      },
      layout: {
        duration: reduceMotion ? 0 : CONTAINER_MS / 1000,
        ease: REVEAL_EASE,
      },
    };
  };

  const extraExitTransition = (index) => {
    const delay = reduceMotion ? 0 : index * (STAGGER_MS / 1000);
    return {
      opacity: {
        duration: reduceMotion ? 0 : ROW_EXIT_MS / 1000,
        delay,
        ease: EXIT_EASE,
      },
      y: {
        duration: reduceMotion ? 0 : ROW_EXIT_MS / 1000,
        delay,
        ease: EXIT_EASE,
      },
      layout: {
        duration: reduceMotion ? 0 : CONTAINER_MS / 1000,
        ease: REVEAL_EASE,
      },
    };
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          id="nm-cart-preview"
          className={`nm-cart-preview${isEmpty ? " is-empty" : ""}${panelExpanded ? " is-expanded" : ""}${scrollReady ? " is-scroll-ready" : ""}`}
          role="dialog"
          aria-label="Cart preview"
          data-expanded={panelExpanded ? "true" : "false"}
          style={style}
          layout
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -6 }}
          transition={{
            duration: reduceMotion ? 0.08 : 0.2,
            ease: PREVIEW_EASE,
            layout: {
              duration: reduceMotion ? 0 : CONTAINER_MS / 1000,
              ease: REVEAL_EASE,
            },
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className="nm-cart-preview__surface">
          {isEmpty ? (
            <div className="nm-cart-preview__empty">
              <MdShoppingCart aria-hidden="true" />
              <p>Your cart is empty</p>
              <Link to="/customer/products" className="nm-cart-preview__browse" onClick={onViewCart}>
                Browse products
              </Link>
            </div>
          ) : (
            <LayoutGroup id="nm-cart-preview-stack">
              <motion.header
                className="nm-cart-preview__header"
                layout="position"
                transition={layoutTransition}
              >
                <p className="nm-cart-preview__count">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in your cart.
                </p>
              </motion.header>

              <motion.div
                ref={listRef}
                className="nm-cart-preview__products b25-internal-scroll"
                tabIndex={panelExpanded && scrollReady ? 0 : undefined}
                layout
                transition={layoutTransition}
              >
                <motion.div
                  className="nm-cart-preview__list"
                  role="list"
                  layout
                  transition={layoutTransition}
                >
                  {alwaysVisible.map((item) => (
                    <motion.div
                      key={getItemKey(item)}
                      className="nm-cart-preview__row"
                      role="listitem"
                      layout="position"
                      transition={layoutTransition}
                    >
                      <CartPreviewRow item={item} />
                    </motion.div>
                  ))}

                  <AnimatePresence initial={false} mode="popLayout">
                    {expanded &&
                      extraItems.map((item, index) => (
                        <motion.div
                          key={getItemKey(item)}
                          role="listitem"
                          className="nm-cart-preview__row nm-cart-preview__row--extra"
                          layout="position"
                          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            reduceMotion
                              ? undefined
                              : {
                                  opacity: 0,
                                  y: 4,
                                  transition: extraExitTransition(index),
                                }
                          }
                          transition={extraEnterTransition(index)}
                        >
                          <CartPreviewRow item={item} />
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {canExpand ? (
                <motion.div
                  className="nm-cart-preview__more-wrap"
                  layout="position"
                  transition={layoutTransition}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {!expanded ? (
                      <motion.button
                        key="more"
                        type="button"
                        className="nm-cart-preview__more"
                        onClick={handleExpand}
                        initial={reduceMotion ? false : { opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -2 }}
                        transition={{ duration: reduceMotion ? 0 : LABEL_EXIT_MS / 1000, ease: REVEAL_EASE }}
                      >
                        Show {remaining} more {remaining === 1 ? "item" : "items"}
                      </motion.button>
                    ) : (
                      <motion.button
                        key="less"
                        type="button"
                        className="nm-cart-preview__more is-collapse"
                        onClick={handleCollapse}
                        initial={reduceMotion ? false : { opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -2 }}
                        transition={{ duration: reduceMotion ? 0 : LABEL_ENTER_MS / 1000, ease: REVEAL_EASE }}
                      >
                        Show less
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : null}

              <motion.div
                className="nm-cart-preview__summary"
                layout="position"
                transition={layoutTransition}
              >
                <div className="nm-cart-preview__footer">
                  <span>Subtotal</span>
                  <strong className="b25-tabular">{formatMoney(total)}</strong>
                </div>
              </motion.div>

              <motion.footer
                className="nm-cart-preview__cta-wrap"
                layout="position"
                transition={layoutTransition}
              >
                <Link to="/customer/cart" className="nm-cart-preview__cta" onClick={onViewCart}>
                  View cart
                </Link>
              </motion.footer>
            </LayoutGroup>
          )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
