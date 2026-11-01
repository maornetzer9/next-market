/**
 * Locks document scroll without horizontal page jump (scrollbar compensation).
 * Returns an unlock function that restores scroll position.
 */
export function lockBodyScroll(lockKey = "bodyScrollLock") {
  if (typeof document === "undefined") return () => {};

  const scrollY = window.scrollY;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.dataset[lockKey] = String(scrollY);
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";

  return () => {
    const stored = Number(document.body.dataset[lockKey] || 0);
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.paddingRight = "";
    delete document.body.dataset[lockKey];
    window.scrollTo(0, stored);
  };
}
