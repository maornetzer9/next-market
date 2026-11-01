import React, { useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { MdCheckCircle, MdClose, MdErrorOutline, MdInfoOutline, MdWarningAmber } from "react-icons/md";

import { dismissToast } from "../actions/toastActions";
import "../css/toasts.css";

const ICONS = {
  success: MdCheckCircle,
  error: MdErrorOutline,
  info: MdInfoOutline,
  warning: MdWarningAmber,
};

const ENTER_EASE = [0.22, 1, 0.36, 1];
const EXIT_EASE = [0.4, 0, 1, 1];

function ToastItem({ toast, onDismiss, reduceMotion }) {
  const Icon = ICONS[toast.kind] || MdInfoOutline;

  useEffect(() => {
    if (!toast.duration) return undefined;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
    // createdAt: cart mutations reuse a fixed id; restart the full duration on each push.
  }, [toast.id, toast.duration, toast.createdAt, onDismiss]);

  return (
    <motion.li
      layout={!reduceMotion}
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
      className={`b25-toast is-${toast.kind}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{
        duration: reduceMotion ? 0.09 : 0.24,
        ease: reduceMotion ? "easeOut" : ENTER_EASE,
        exit: { duration: reduceMotion ? 0.09 : 0.2, ease: EXIT_EASE },
      }}
    >
      <span className="b25-toast__icon" aria-hidden="true">
        <Icon />
      </span>
      <p className="b25-toast__message">{toast.message}</p>
      <button
        type="button"
        className="b25-toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <MdClose aria-hidden="true" />
      </button>
    </motion.li>
  );
}

export default function ToastRoot() {
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const toasts = useSelector((state) => state.toastsReducer.items);
  const handleDismiss = useCallback((id) => dispatch(dismissToast(id)), [dispatch]);

  const container = useMemo(() => (typeof document === "undefined" ? null : document.body), []);
  if (!container) return null;

  return createPortal(
    <ol className="b25-toast-stack" aria-label="Notifications" data-toast-count={toasts.length}>
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={handleDismiss}
            reduceMotion={reduceMotion}
          />
        ))}
      </AnimatePresence>
    </ol>,
    container,
  );
}
