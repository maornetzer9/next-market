import React, { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MdClose } from "react-icons/md";
import SignInForm from "./SignInForm";
import RegisterForm from "./RegisterForm";
import AuthBrandLockup from "./AuthBrandLockup";
import "../css/auth-modal.css";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function lockBodyScroll() {
  const scrollY = window.scrollY;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.dataset.authScrollLock = String(scrollY);
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "";

  return () => {
    const stored = Number(document.body.dataset.authScrollLock || 0);
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.paddingRight = "";
    delete document.body.dataset.authScrollLock;
    window.scrollTo(0, stored);
  };
}

export default function AuthModal({
  isOpen,
  mode,
  returnLocation,
  onClose,
  onSwitchMode,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();
  const isRegister = mode === "register";

  useEffect(() => {
    if (!isOpen) return undefined;
    return lockBodyScroll();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusables = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const timer = window.setTimeout(() => {
      const firstInput = dialogRef.current?.querySelector("input:not([type='checkbox'])");
      if (firstInput) {
        firstInput.focus();
        return;
      }
      closeButtonRef.current?.focus();
    }, reduceMotion ? 0 : 40);

    return () => window.clearTimeout(timer);
  }, [isOpen, mode, reduceMotion]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const motionDuration = reduceMotion ? 0 : 0.26;
  const modalEase = [0.22, 0.61, 0.36, 1];

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="auth-modal-root"
          role="presentation"
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: reduceMotion ? 1 : 0 }}
          transition={{ duration: motionDuration, ease: modalEase }}
          onMouseDown={handleBackdropClick}
        >
          <motion.div
            ref={dialogRef}
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: motionDuration, ease: modalEase }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="auth-modal__close"
              onClick={onClose}
              aria-label="Close authentication dialog"
            >
              <MdClose aria-hidden="true" />
            </button>

            <header className="auth-modal__header">
              <AuthBrandLockup />
              <h2 id={titleId}>
                {isRegister ? "Create your account" : "Welcome back"}
              </h2>
              <p id={descriptionId} className="auth-modal__lead">
                {isRegister
                  ? "Save your cart, place orders and manage purchases."
                  : "Sign in to continue shopping."}
              </p>
            </header>

            <div className="auth-modal__body">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  className="auth-modal__panel"
                  initial={reduceMotion ? false : { opacity: 0, x: isRegister ? 6 : -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: isRegister ? -6 : 6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.15, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  {isRegister ? (
                    <RegisterForm key="register" onSwitchMode={onSwitchMode} />
                  ) : (
                    <SignInForm
                      key="sign-in"
                      returnLocation={returnLocation}
                      onSwitchMode={onSwitchMode}
                      onSuccess={onClose}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
