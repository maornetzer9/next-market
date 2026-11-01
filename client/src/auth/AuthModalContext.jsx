import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("sign-in");
  const [returnLocation, setReturnLocation] = useState(null);
  const triggerRef = useRef(null);
  const consumedRouteStateRef = useRef(null);

  const openAuthModal = useCallback((nextMode = "sign-in", from = null, triggerEl = null) => {
    triggerRef.current = triggerEl || document.activeElement;
    setMode(nextMode === "register" ? "register" : "sign-in");
    setReturnLocation(from || null);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    window.setTimeout(() => {
      triggerRef.current?.focus?.();
    }, 180);
  }, []);

  const switchMode = useCallback((nextMode) => {
    setMode(nextMode === "register" ? "register" : "sign-in");
  }, []);

  useEffect(() => {
    const routeModal = location.state?.authModal;
    if (!routeModal) return;
    if (consumedRouteStateRef.current === location.key) return;

    consumedRouteStateRef.current = location.key;
    openAuthModal(routeModal, location.state?.from || null);
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: {},
    });
  }, [location.key, location.pathname, location.search, location.state, navigate, openAuthModal]);

  const value = useMemo(
    () => ({
      isOpen,
      mode,
      returnLocation,
      openAuthModal,
      closeAuthModal,
      switchMode,
    }),
    [closeAuthModal, isOpen, mode, openAuthModal, returnLocation, switchMode]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={isOpen}
        mode={mode}
        returnLocation={returnLocation}
        onClose={closeAuthModal}
        onSwitchMode={switchMode}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}
