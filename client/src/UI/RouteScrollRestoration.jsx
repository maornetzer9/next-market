import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { useReducedMotion } from "framer-motion";

import {
  applyRouteScroll,
  cancelRouteScrollAnimation,
  getRouteDestinationKey,
  resolveRouteScrollBehavior,
  saveScrollPosition,
} from "../hooks/routeScrollRestoration";

/**
 * Resets document scroll on destination navigation with a capped smooth animation.
 * Mounted outside pathname-keyed route transitions so scroll can begin during exit.
 */
export default function RouteScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const reduceMotion = useReducedMotion();
  const previousDestinationKeyRef = useRef(null);

  useLayoutEffect(() => {
    const { key } = location;

    return () => {
      saveScrollPosition(key, window.scrollY);
    };
  }, [location.key]);

  useLayoutEffect(() => {
    const destinationKey = getRouteDestinationKey(location);
    const { shouldScroll, scrollTop, animate } = resolveRouteScrollBehavior({
      navigationType,
      locationKey: location.key,
      destinationKey,
      previousDestinationKey: previousDestinationKeyRef.current,
      location,
    });

    if (shouldScroll) {
      applyRouteScroll(scrollTop, {
        animate: animate && scrollTop === 0,
        reduceMotion,
      });
    }

    previousDestinationKeyRef.current = destinationKey;
  }, [location, navigationType, reduceMotion]);

  useLayoutEffect(() => () => {
    cancelRouteScrollAnimation();
  }, []);

  return null;
}
