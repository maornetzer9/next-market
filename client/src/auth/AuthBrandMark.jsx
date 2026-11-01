import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "../css/brand-mark.css";

const ENTRANCE_EASE = [0.22, 0.61, 0.36, 1];

/**
 * Shared animated NEXT / MARKET brand mark.
 * Presentation variants via className (e.g. auth-brand-mark--rail, auth-brand-mark--footer).
 */
export default function AuthBrandMark({
  className = "",
  animateEnter = true,
  pauseOffscreen = false,
}) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef(null);
  const [inView, setInView] = useState(!pauseOffscreen);

  useEffect(() => {
    if (!pauseOffscreen || reduceMotion) {
      setInView(true);
      return undefined;
    }

    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.15, rootMargin: "24px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [pauseOffscreen, reduceMotion]);

  const rootClass = [
    "auth-brand-mark",
    className,
    pauseOffscreen && !inView ? "is-paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const markBody = (
    <>
      <span className="auth-brand-mark__glow" aria-hidden="true" />
      <svg
        className="auth-brand-mark__canvas"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g className="auth-brand-mark__strand auth-brand-mark__strand--a">
          <path
            className="auth-brand-mark__line auth-brand-mark__line--a"
            d="M2 30 C 9 20, 16 24, 22 18 S 30 12, 38 8"
          />
        </g>
        <g className="auth-brand-mark__strand auth-brand-mark__strand--b">
          <path
            className="auth-brand-mark__line auth-brand-mark__line--b"
            d="M4 9 C 11 13, 18 9, 25 15 S 33 23, 38 31"
          />
        </g>
        <g className="auth-brand-mark__strand auth-brand-mark__strand--c">
          <path
            className="auth-brand-mark__line auth-brand-mark__line--c"
            d="M6 27 C 13 21, 20 25, 27 19 S 34 15, 38 11"
          />
        </g>
      </svg>
      <span className="auth-brand-mark__monogram">N/M</span>
    </>
  );

  if (reduceMotion || !animateEnter) {
    return (
      <div ref={rootRef} className={rootClass} aria-hidden="true">
        {markBody}
      </div>
    );
  }

  return (
    <motion.div
      ref={rootRef}
      className={rootClass}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.92, x: -3 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.3, ease: ENTRANCE_EASE }}
    >
      {markBody}
    </motion.div>
  );
}
