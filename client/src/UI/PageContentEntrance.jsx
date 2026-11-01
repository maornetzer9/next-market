import React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { READY, useInitialViewReady } from "./LoadingCoordinator";

export const PAGE_CONTENT_EASE = [0.22, 0.61, 0.36, 1];
export const PAGE_CONTENT_DURATION = 0.38;
export const PAGE_CONTENT_OFFSET_Y = 8;
export const PAGE_CONTENT_EXIT_DURATION = 0.18;
export const PAGE_CONTENT_EXIT_OFFSET_Y = 4;

export const CATALOG_COLLECTION_ENTER_DURATION = 0.32;
export const CATALOG_COLLECTION_EXIT_DURATION = 0.16;
export const CATALOG_COLLECTION_OFFSET_Y = 8;
export const CATALOG_COLLECTION_EXIT_OFFSET_Y = 4;

export function getCatalogCollectionEnterMotion(reduceMotion) {
  if (reduceMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: CATALOG_COLLECTION_OFFSET_Y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: CATALOG_COLLECTION_ENTER_DURATION,
      ease: PAGE_CONTENT_EASE,
    },
  };
}

export function getCatalogCollectionExitMotion(reduceMotion) {
  if (reduceMotion) {
    return {
      opacity: 1,
      transition: { duration: 0 },
    };
  }

  return {
    opacity: 0,
    y: -CATALOG_COLLECTION_EXIT_OFFSET_Y,
    transition: {
      duration: CATALOG_COLLECTION_EXIT_DURATION,
      ease: PAGE_CONTENT_EASE,
    },
  };
}

export function getPageContentEntranceMotion(reduceMotion) {
  if (reduceMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: PAGE_CONTENT_OFFSET_Y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: PAGE_CONTENT_DURATION,
      ease: PAGE_CONTENT_EASE,
    },
  };
}

export function getPageContentExitMotion(reduceMotion) {
  if (reduceMotion) {
    return { opacity: 1 };
  }

  return {
    opacity: 0,
    y: -PAGE_CONTENT_EXIT_OFFSET_Y,
  };
}

export function PageContentEntrance({
  children,
  className,
  as = "div",
  ...rest
}) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = motion[as] || motion.div;
  const motionProps = getPageContentEntranceMotion(reduceMotion);

  return (
    <MotionComponent className={className} {...motionProps} {...rest}>
      {children}
    </MotionComponent>
  );
}

export function ReadyPageContent({
  ready = true,
  children,
  className,
  as = "div",
  ...rest
}) {
  const phase = useInitialViewReady(ready);

  if (phase !== READY) return null;

  return (
    <PageContentEntrance className={className} as={as} {...rest}>
      {children}
    </PageContentEntrance>
  );
}
