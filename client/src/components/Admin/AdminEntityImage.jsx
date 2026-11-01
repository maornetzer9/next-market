import React, { useEffect, useRef, useState } from "react";

/** Shared Admin image with a deterministic title-derived fallback. */
export default function AdminEntityImage({
  src,
  title = "",
  className = "",
  width = 64,
  height = 64,
  loading = "lazy",
}) {
  const normalizedSrc = typeof src === "string" ? src.trim() : src;
  const [failedSrc, setFailedSrc] = useState("");
  const [loadedSrc, setLoadedSrc] = useState("");
  const [requestedSrc, setRequestedSrc] = useState(
    loading !== "lazy" ? normalizedSrc : ""
  );
  const hostRef = useRef(null);
  const imageRef = useRef(null);
  const failed = Boolean(normalizedSrc) && failedSrc === normalizedSrc;
  const loaded = Boolean(normalizedSrc) && loadedSrc === normalizedSrc;
  const shouldLoad = loading !== "lazy" || requestedSrc === normalizedSrc;

  useEffect(() => {
    setFailedSrc("");
    setLoadedSrc("");
    setRequestedSrc(loading !== "lazy" ? normalizedSrc : "");
  }, [loading, normalizedSrc]);

  useEffect(() => {
    const host = hostRef.current;
    if (!normalizedSrc || shouldLoad || !host) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setRequestedSrc(normalizedSrc);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRequestedSrc(normalizedSrc);
        observer.disconnect();
      },
      {
        root: host.closest(".admin-products__list-viewport, .admin-products__purchases-list, .admin-customers__order-cards"),
        rootMargin: "96px 0px",
        threshold: 0.01,
      }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [normalizedSrc, shouldLoad]);

  useEffect(() => {
    const image = imageRef.current;
    if (!shouldLoad || !image?.complete) return;
    if (image.naturalWidth > 0) setLoadedSrc(normalizedSrc);
    else setFailedSrc(normalizedSrc);
  }, [normalizedSrc, shouldLoad]);

  const initial = String(title || "?").trim().slice(0, 1).toUpperCase() || "?";
  const classes = ["admin-entity-image", className].filter(Boolean).join(" ");
  const imageStatus = !normalizedSrc || failed
    ? "failed"
    : loaded
      ? "loaded"
      : shouldLoad
        ? "loading"
        : "idle";

  return (
    <span
      ref={hostRef}
      className={`${classes}${loaded ? " is-loaded" : ""}`}
      data-image-status={imageStatus}
      data-image-src={normalizedSrc || undefined}
      style={{ width, height }}
    >
      {imageStatus === "failed" ? (
        <span className="admin-entity-image__fallback" aria-label="Image unavailable">
          {initial}
        </span>
      ) : null}
      {imageStatus === "idle" || imageStatus === "loading" ? (
        <span className="admin-entity-image__loading" aria-hidden="true" />
      ) : null}
      {normalizedSrc && shouldLoad && !failed ? (
        <img
          key={normalizedSrc}
          ref={imageRef}
          src={normalizedSrc}
          alt=""
          width={width}
          height={height}
          loading="eager"
          onLoad={() => setLoadedSrc(normalizedSrc)}
          onError={() => {
            setFailedSrc(normalizedSrc);
            setLoadedSrc("");
          }}
        />
      ) : null}
    </span>
  );
}
