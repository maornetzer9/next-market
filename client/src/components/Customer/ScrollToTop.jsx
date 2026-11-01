import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MdArrowUpward } from "react-icons/md";

import "../../css/products.css";

export default function ScrollToTop() {
  const reduceMotion = useReducedMotion();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let frameId = 0;
    let lastShowScrollTop;

    const updateScrollState = () => {
      const nextShowScrollTop = window.scrollY > 420;

      if (nextShowScrollTop !== lastShowScrollTop) {
        lastShowScrollTop = nextShowScrollTop;
        setShowScrollTop(nextShowScrollTop);
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

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {showScrollTop ? (
        <motion.button
          type="button"
          className="catalog-scroll-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        >
          <MdArrowUpward aria-hidden="true" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
