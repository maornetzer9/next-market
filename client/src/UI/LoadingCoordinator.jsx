import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";

import GlobalLoader from "./GlobalLoader";
import { BOOTING, READY, REVEALING, initialLoadingState, loadingReducer } from "./loadingMachine";
import "../css/loading-coordinator.css";

export const ROUTE_WAIT_THRESHOLD_MS = 110;
export const REVEAL_DURATION_MS = 150;

const LoadingContext = createContext(null);

export function LoadingCoordinator({ children }) {
  const [state, dispatch] = useReducer(loadingReducer, initialLoadingState);
  const [routeWaitCount, setRouteWaitCount] = useState(0);
  const [routeLoaderVisible, setRouteLoaderVisible] = useState(false);

  const completeInitialView = useCallback(() => {
    dispatch({ type: "CRITICAL_READY" });
  }, []);

  const beginRouteWait = useCallback(() => {
    let active = true;
    setRouteWaitCount((count) => count + 1);
    return () => {
      if (!active) return;
      active = false;
      setRouteWaitCount((count) => Math.max(0, count - 1));
    };
  }, []);

  useEffect(() => {
    if (state.phase !== REVEALING) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: "REVEAL_COMPLETE" }), REVEAL_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== READY || routeWaitCount === 0) {
      setRouteLoaderVisible(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setRouteLoaderVisible(true), ROUTE_WAIT_THRESHOLD_MS);
    return () => window.clearTimeout(timer);
  }, [routeWaitCount, state.phase]);

  const value = useMemo(() => ({
    phase: state.phase,
    completeInitialView,
    beginRouteWait,
  }), [beginRouteWait, completeInitialView, state.phase]);

  const showInitialLoader = state.phase !== READY;
  const showLoader = showInitialLoader || routeLoaderVisible;

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {showLoader ? (
        <div
          className={`b293-loading-layer${showInitialLoader ? " is-initial" : " is-route"}${state.phase === REVEALING ? " is-revealing" : ""}`}
          data-loading-phase={state.phase}
        >
          <GlobalLoader context={showInitialLoader ? "bootstrap" : "route"} />
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}

function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("Loading lifecycle hooks require LoadingCoordinator");
  return context;
}

export function useInitialViewReady(ready = true) {
  const { phase, completeInitialView } = useLoadingContext();
  useEffect(() => {
    if (ready) completeInitialView();
  }, [completeInitialView, ready]);
  return phase;
}

export function InitialViewReady({ children = null }) {
  useInitialViewReady(true);
  return children;
}

export function RouteWaitSignal() {
  const { beginRouteWait } = useLoadingContext();
  useEffect(() => beginRouteWait(), [beginRouteWait]);
  return null;
}

export { BOOTING, READY, REVEALING };
