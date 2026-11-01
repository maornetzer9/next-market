import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { MdChevronLeft, MdDarkMode, MdLightMode } from "react-icons/md";
import Cart from "./Cart";
import CartPreview, { PREVIEW_LIMIT } from "./CartPreview";
import NeuralWaveField from "./NeuralWaveField";
import AuthBrandMark from "../../auth/AuthBrandMark";
import "../../css/neural-wave.css";

const OPEN_DELAY_MS = 70;
const CLOSE_DELAY_MS = 140;
const MOBILE_QUERY = "(max-width: 820px)";
const MAGNET_EASE_MS = 420;

const isMobileNav = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;

const magnetFromPath = (pathname) => {
  if (/\/cart\/?$/.test(pathname)) return "cart";
  if (/\/orders/.test(pathname)) return "orders";
  if (/\/account/.test(pathname)) return "account";
  if (/\/products/.test(pathname)) return "products";
  if (pathname === "/" || /\/customer\/?$/.test(pathname)) return "home";
  return "home";
};

const magnetKeyFromPage = (page, option = {}) => {
  if (option.magnetKey) return option.magnetKey;
  if (page === "/") return "home";
  if (page === "/login" || page === "/register") return "login";
  if (!page || page === "/") return "home";
  const segment = String(page).replace(/^\/+|\/+$/g, "").split("/").pop();
  return segment || "home";
};

export default function NeuralWaveNav({
  darkMode,
  toggleDarkMode,
  user,
  isAuthenticated = false,
  addToCart,
  removeFromCart,
  navigation,
  logoutOption,
  collapsed,
  onToggleCollapsed,
}) {
  const location = useLocation();
  const cart = useSelector((state) => state.cartReducer.user?.cart);
  const ThemeIcon = darkMode ? MdLightMode : MdDarkMode;
  const routeMagnet = magnetFromPath(location.pathname);
  const onCartPage = routeMagnet === "cart";

  const [hoverMagnet, setHoverMagnet] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPos, setPreviewPos] = useState({ top: 80, left: 220, arrowOffset: 0 });

  const spineRef = useRef(null);
  const anchorRef = useRef(null);
  const previewRef = useRef(null);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const magnet = hoverMagnet || routeMagnet;
  const items = cart?.items || [];
  const total = cart?.total || 0;

  const syncMagnetGeometry = useCallback(() => {
    const spine = spineRef.current;
    if (!spine || isMobileNav()) return;

    const spineRect = spine.getBoundingClientRect();
    const magnetEls = [...spine.querySelectorAll("[data-magnet-target]")];
    const activeEl =
      magnetEls.find((el) => el.dataset.magnetTarget === magnet) ||
      magnetEls.find((el) => el.dataset.magnetTarget === routeMagnet) ||
      magnetEls[0];

    if (!activeEl) return;

    const rect = activeEl.getBoundingClientRect();
    const mid = rect.top + rect.height / 2 - spineRect.top;
    const bloom = spine.querySelector(".nm-wave-bloom");
    const bloomHeight = bloom?.offsetHeight || 120;
    const bloomY = mid - bloomHeight / 2;

    const index = Math.max(magnetEls.indexOf(activeEl), 0);
    const center = Math.max((magnetEls.length - 1) / 2, 0.5);
    const bias = (index - center) * 5;
    const isHover = Boolean(hoverMagnet);
    const isCollapsed = spine.classList.contains("is-collapsed");
    const profileScale = isCollapsed ? 0.56 : 1;
    const exchange = isHover ? 1 : 0.62;

    spine.style.setProperty("--nm-bloom-y", `${Math.round(bloomY)}px`);
    spine.style.setProperty("--nm-magnet-mid", `${Math.round(mid)}px`);
    spine.style.setProperty("--nm-ex-ax", (5.5 * exchange * profileScale).toFixed(1));
    spine.style.setProperty("--nm-ex-ay", (bias * exchange * profileScale).toFixed(1));
    spine.style.setProperty("--nm-ex-bx", (-4.5 * exchange * profileScale).toFixed(1));
    spine.style.setProperty("--nm-ex-by", (-bias * 0.85 * exchange * profileScale).toFixed(1));
    spine.style.setProperty("--nm-ex-cx", (-3.5 * exchange * profileScale).toFixed(1));
    spine.style.setProperty("--nm-ex-cy", (bias * 0.55 * exchange * profileScale).toFixed(1));
    spine.style.setProperty("--nm-ex-dx", (4 * exchange * profileScale).toFixed(1));
    spine.style.setProperty("--nm-ex-dy", (-bias * 0.7 * exchange * profileScale).toFixed(1));
    spine.style.setProperty("--nm-bloom-strength", isHover ? (isCollapsed ? "0.32" : "0.46") : isCollapsed ? "0.22" : "0.28");
    spine.style.setProperty("--nm-wave-opacity", isHover ? (isCollapsed ? "0.72" : "0.88") : isCollapsed ? "0.64" : "0.82");
    spine.dataset.magnetIndex = String(index);
    spine.dataset.magnetMode = isHover ? "hover" : "route";
  }, [hoverMagnet, magnet, routeMagnet]);

  const clearPreviewTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  const closePreviewNow = useCallback(() => {
    clearPreviewTimers();
    setPreviewOpen(false);
  }, [clearPreviewTimers]);

  const updatePreviewPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const triggerCenter = rect.top + rect.height / 2;
    const margin = 12;
    const maxPopupHeight = Math.min(window.innerHeight - margin * 2, 420);

    // The popup is centered on the cart trigger. When the cart *can* expand
    // (items > preview limit), we anchor using the fully-expanded height so
    // the panel stays put through the expand/collapse animation. When it
    // cannot expand, we anchor using the panel's actual rendered height so
    // short popups sit close to the cart button instead of floating high.
    const canExpand = items.length > PREVIEW_LIMIT;
    const measuredHeight = previewRef.current?.getBoundingClientRect().height ?? 0;
    let popupHeight;
    if (items.length === 0) {
      popupHeight = 168;
    } else if (canExpand) {
      popupHeight = maxPopupHeight;
    } else {
      popupHeight = measuredHeight > 0 ? measuredHeight : maxPopupHeight;
    }

    const desiredTop = triggerCenter - popupHeight / 2;
    const top = Math.max(margin, Math.min(desiredTop, window.innerHeight - popupHeight - margin));
    const arrowOffset = triggerCenter - (top + popupHeight / 2);

    setPreviewPos({
      top: Math.round(top),
      left: Math.round(rect.right + 14),
      arrowOffset: Math.round(arrowOffset),
    });
  }, [items.length]);

  const openPreview = useCallback(() => {
    if (isMobileNav() || onCartPage) return;
    clearPreviewTimers();
    openTimer.current = window.setTimeout(() => {
      setPreviewOpen(true);
    }, OPEN_DELAY_MS);
  }, [clearPreviewTimers, onCartPage]);

  const scheduleClosePreview = useCallback(() => {
    clearPreviewTimers();
    closeTimer.current = window.setTimeout(() => setPreviewOpen(false), CLOSE_DELAY_MS);
  }, [clearPreviewTimers]);

  useEffect(() => {
    const onViewportChange = () => {
      if (isMobileNav()) closePreviewNow();
    };
    const media = window.matchMedia(MOBILE_QUERY);
    media.addEventListener("change", onViewportChange);
    window.addEventListener("resize", onViewportChange);
    return () => {
      media.removeEventListener("change", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [closePreviewNow]);

  useLayoutEffect(() => {
    if (!previewOpen) return undefined;
    updatePreviewPosition();
    window.addEventListener("resize", updatePreviewPosition);

    return () => {
      window.removeEventListener("resize", updatePreviewPosition);
    };
  }, [previewOpen, collapsed, updatePreviewPosition]);

  useEffect(() => {
    if (!previewOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        closePreviewNow();
        anchorRef.current?.querySelector("a")?.focus();
      }
    };
    const onPointer = (event) => {
      const target = event.target;
      if (anchorRef.current?.contains(target) || previewRef.current?.contains(target)) return;
      closePreviewNow();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [closePreviewNow, previewOpen]);

  useEffect(() => () => clearPreviewTimers(), [clearPreviewTimers]);

  useEffect(() => {
    syncMagnetGeometry();
    const spine = spineRef.current;
    if (!spine) return undefined;

    const onResize = () => syncMagnetGeometry();
    window.addEventListener("resize", onResize);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    observer?.observe(spine);
    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [syncMagnetGeometry, collapsed]);

  const handleSlotBlur = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (previewRef.current?.contains(event.relatedTarget)) return;
    scheduleClosePreview();
  };

  const renderLink = (option, compact = false) => {
    const magnetKey = magnetKeyFromPage(option.page, option);
    const label = option.label.replace("My ", "");
    const isHome = magnetKey === "home";

    return (
      <NavLink
        key={option.label}
        to={option.page}
        end={isHome}
        onClick={(event) => {
          if (option?.handler) {
            event.preventDefault();
            option.handler();
          }
        }}
        data-tooltip={collapsed && !compact ? label : undefined}
        data-magnet-target={magnetKey}
        onMouseEnter={() => !compact && setHoverMagnet(magnetKey)}
        onMouseLeave={() => setHoverMagnet(null)}
        onFocus={() => !compact && setHoverMagnet(magnetKey)}
        onBlur={() => setHoverMagnet(null)}
        className={({ isActive }) =>
          [
            "b25-customer-nav__link nm-link",
            isActive && magnetKey !== "logout" ? "is-active" : "",
            compact ? "is-compact" : "",
            !compact && hoverMagnet === magnetKey ? "is-magnet" : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
      >
        <span className="b25-customer-nav__icon nm-link__icon" aria-hidden="true">
          {option.icon}
        </span>
        <span className="b25-customer-nav__label nm-link__label">{label}</span>
      </NavLink>
    );
  };

  return (
    <>
      <aside
        ref={spineRef}
        className={`b25-customer-spine nm-spine${collapsed ? " is-collapsed" : ""}`}
        aria-label="Customer navigation"
        data-magnet={magnet}
        data-magnet-mode={hoverMagnet ? "hover" : "route"}
        style={{ "--nm-magnet-ease": `${MAGNET_EASE_MS}ms` }}
      >
        <div className="nm-spine__canvas" aria-hidden="true">
          <NeuralWaveField orientation="vertical" collapsed={collapsed} />
          <span className="nm-wave-bloom" />
        </div>

        <div className="b25-customer-spine__mark nm-brand" aria-label="Next Market">
          <div className="nm-brand__badge">
            <AuthBrandMark className="auth-brand-mark--rail" animateEnter={false} />
          </div>
          <small>NEXT MARKET</small>
        </div>

        <button
          type="button"
          className="nm-collapse"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          data-tooltip={collapsed ? "Expand navigation" : undefined}
          onClick={onToggleCollapsed}
        >
          <MdChevronLeft aria-hidden="true" />
        </button>

        <nav className="b25-customer-nav nm-nav">
          {navigation.map((option) => renderLink(option))}
        </nav>

        <div className="b25-customer-spine__footer nm-footer">
          {isAuthenticated ? (
            <div
              ref={anchorRef}
              className={`nm-cart-slot${previewOpen ? " is-preview-open" : ""}`}
              data-magnet-target="cart"
              onMouseEnter={() => {
                setHoverMagnet("cart");
                openPreview();
              }}
              onMouseLeave={() => {
                setHoverMagnet(null);
                scheduleClosePreview();
              }}
              onFocusCapture={() => {
                setHoverMagnet("cart");
                openPreview();
              }}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setHoverMagnet(null);
                }
                handleSlotBlur(event);
              }}
            >
              <Cart
                user={user}
                addToTheCart={addToCart}
                removeFromCart={removeFromCart}
                collapsed={collapsed}
                previewOpen={previewOpen}
              />
            </div>
          ) : null}

          <button
            type="button"
            className={`nm-link${hoverMagnet === "theme" ? " is-magnet" : ""}`}
            onClick={toggleDarkMode}
            aria-pressed={darkMode}
            aria-label={darkMode ? "Use light theme" : "Use dark theme"}
            data-tooltip={collapsed ? "Theme" : undefined}
            data-magnet-target="theme"
            onMouseEnter={() => setHoverMagnet("theme")}
            onMouseLeave={() => setHoverMagnet(null)}
            onFocus={() => setHoverMagnet("theme")}
            onBlur={() => setHoverMagnet(null)}
          >
            <span className="b25-customer-nav__icon nm-link__icon" aria-hidden="true">
              <ThemeIcon />
            </span>
            <span className="b25-customer-nav__label nm-link__label">Theme</span>
          </button>

          {logoutOption ? (
            <nav className="b25-customer-session-nav" aria-label="Customer session">
              {renderLink(logoutOption)}
            </nav>
          ) : null}
        </div>
      </aside>

      <CartPreview
        open={previewOpen}
        items={items}
        total={total}
        style={{
          top: previewPos.top,
          left: previewPos.left,
          "--nm-cart-preview-arrow-top": `${28 + (previewPos.arrowOffset ?? 0)}px`,
        }}
        panelRef={previewRef}
        onMouseEnter={() => {
          clearPreviewTimers();
          setPreviewOpen(true);
        }}
        onMouseLeave={scheduleClosePreview}
        onViewCart={closePreviewNow}
      />

      <nav className="b25-customer-mobile-nav nm-mobile" aria-label="Customer navigation">
        <div className="nm-mobile__wave" aria-hidden="true">
          <NeuralWaveField orientation="horizontal" />
        </div>
        {navigation.map((option) => renderLink(option, true))}
        {isAuthenticated ? (
          <Cart
            user={user}
            addToTheCart={addToCart}
            removeFromCart={removeFromCart}
            compact
          />
        ) : null}
        {logoutOption ? renderLink(logoutOption, true) : null}
      </nav>
    </>
  );
}
