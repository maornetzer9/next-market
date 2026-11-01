import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nm.storefront.favorites";

const readFavorites = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const writeFavorites = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("nm:favorites-changed"));
};

/**
 * Local-only storefront favorites (no account sync).
 * Persists product ids in localStorage for reusable UI state.
 */
export default function useStorefrontFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(() =>
    typeof window === "undefined" ? [] : readFavorites()
  );

  useEffect(() => {
    const sync = () => setFavoriteIds(readFavorites());
    window.addEventListener("storage", sync);
    window.addEventListener("nm:favorites-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("nm:favorites-changed", sync);
    };
  }, []);

  const isFavorite = useCallback(
    (productId) => favoriteIds.includes(String(productId ?? "")),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((productId) => {
    const id = String(productId ?? "");
    if (!id) return;

    setFavoriteIds((current) => {
      const next = current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id];
      writeFavorites(next);
      return next;
    });
  }, []);

  return { favoriteIds, isFavorite, toggleFavorite };
}
