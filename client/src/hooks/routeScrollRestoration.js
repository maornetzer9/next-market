/** @typedef {'POP' | 'PUSH' | 'REPLACE'} NavigationType */

import {
  CATALOG_PATH,
  getCategoryFromSearch,
} from "../utils/storefrontNavigation.js";

const scrollPositions = new Map();

/** @type {{ cancel: () => void } | null} */
let activeScrollAnimation = null;

/**
 * @param {number} distance
 * @param {boolean} [reduceMotion=false]
 * @returns {number}
 */
export function resolveRouteScrollDuration(distance, reduceMotion = false) {
  if (reduceMotion) return 0;

  const travel = Math.abs(distance);
  if (travel <= 40) return 0;
  if (travel <= 160) return 200;
  if (travel <= 480) return 280;
  return 320;
}

/**
 * @param {number} t
 * @returns {number}
 */
export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * @param {string} destinationKey
 * @returns {string}
 */
export function getRoutePathnameFromDestinationKey(destinationKey) {
  return String(destinationKey || "").split("?")[0];
}

/**
 * @param {{ pathname?: string, search?: string }} location
 * @returns {string}
 */
export function getRouteDestinationKey(location) {
  const pathname = location?.pathname || "";

  if (pathname === CATALOG_PATH) {
    const category = getCategoryFromSearch(location?.search || "");
    return category ? `${pathname}?category=${category}` : pathname;
  }

  return pathname;
}

/**
 * @param {{
 *   navigationType: NavigationType,
 *   locationKey: string,
 *   destinationKey: string,
 *   previousDestinationKey: string | null,
 *   location: { pathname?: string, search?: string, state?: object },
 * }} input
 * @returns {{ shouldScroll: boolean, scrollTop: number, animate: boolean }}
 */
export function resolveRouteScrollBehavior({
  navigationType,
  locationKey,
  destinationKey,
  previousDestinationKey,
  location,
}) {
  if (previousDestinationKey === null) {
    const scrollTop = resolveRouteScrollTop(navigationType, locationKey);
    return {
      shouldScroll: true,
      scrollTop,
      animate: navigationType !== "POP" && scrollTop === 0,
    };
  }

  if (navigationType === "POP") {
    return {
      shouldScroll: true,
      scrollTop: resolveRouteScrollTop(navigationType, locationKey),
      animate: false,
    };
  }

  const pathnameChanged =
    getRoutePathnameFromDestinationKey(previousDestinationKey) !==
    getRoutePathnameFromDestinationKey(destinationKey);

  if (pathnameChanged) {
    return { shouldScroll: true, scrollTop: 0, animate: true };
  }

  const catalogCategoryDestinationChanged =
    location?.pathname === CATALOG_PATH &&
    destinationKey !== previousDestinationKey &&
    navigationType === "PUSH";

  if (catalogCategoryDestinationChanged) {
    return { shouldScroll: true, scrollTop: 0, animate: true };
  }

  return { shouldScroll: false, scrollTop: 0, animate: false };
}

/**
 * @param {string} key
 * @param {number} y
 */
export function saveScrollPosition(key, y) {
  scrollPositions.set(key, y);
}

/**
 * @param {NavigationType} navigationType
 * @param {string} locationKey
 * @returns {number}
 */
export function resolveRouteScrollTop(navigationType, locationKey) {
  if (navigationType === "POP") {
    const saved = scrollPositions.get(locationKey);
    if (typeof saved === "number") {
      return saved;
    }
  }

  return 0;
}

export function cancelRouteScrollAnimation() {
  activeScrollAnimation?.cancel();
  activeScrollAnimation = null;
}

/**
 * Scroll the document to the route target. Customer shell uses window scroll.
 * @param {number} targetY
 * @param {{ animate?: boolean, reduceMotion?: boolean }} [options]
 */
export function applyRouteScroll(targetY, options = {}) {
  const { animate = false, reduceMotion = false, duration: durationOption } = options;

  cancelRouteScrollAnimation();

  const startY = window.scrollY;
  const distance = targetY - startY;

  if (Math.abs(distance) < 1) {
    window.scrollTo(0, targetY);
    return;
  }

  const duration = typeof durationOption === "number"
    ? Math.max(0, durationOption)
    : (animate ? resolveRouteScrollDuration(distance, reduceMotion) : 0);

  if (!animate || reduceMotion || duration === 0) {
    window.scrollTo(0, targetY);
    return;
  }

  const startTime = performance.now();
  let frameId = 0;

  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(progress);
    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      frameId = requestAnimationFrame(step);
      return;
    }

    window.scrollTo(0, targetY);
    activeScrollAnimation = null;
  };

  activeScrollAnimation = {
    cancel: () => {
      cancelAnimationFrame(frameId);
      activeScrollAnimation = null;
    },
  };

  frameId = requestAnimationFrame(step);
}

/** @internal test helper */
export function __clearRouteScrollPositionsForTests() {
  scrollPositions.clear();
  cancelRouteScrollAnimation();
}
