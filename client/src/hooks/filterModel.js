import { useMemo, useState, useCallback } from "react";
import { getValidPriceBounds, resolvePriceRange } from "../utils/priceRange";

// Custom Hook For Filtering Products
export const useProductFilter = (products) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [filteredCategory, setFilteredCategory] = useState("");

  // Available bounds = full catalog (or active category), never the current page.
  const priceBounds = useMemo(
    () => getValidPriceBounds(products, { category: filteredCategory }),
    [products, filteredCategory]
  );

  const priceRange = useMemo(
    () => resolvePriceRange(products, selectedPriceRange, { category: filteredCategory }),
    [products, selectedPriceRange, filteredCategory]
  );

  // Memoize categories that have products with a price greater than 0
  const categories = useMemo(() => {
    const filteredProducts = products.filter((product) => Number(product.price) > 0);
    return [...new Set(filteredProducts.map((product) => product.category))];
  }, [products]);

  // Memoize categories that have products without a price greater than 0
  const categoriesAdmin = useMemo(() => {
    return [...new Set(products.map((product) => product.category))];
  }, [products]);

  // Filter products based on category, price range, and search term
  const filteredProducts = useMemo(() =>
    products.filter((product) => {
      const matchesCategory = filteredCategory
        ? product.category === filteredCategory
        : true;

      const price = Number(product.price);
      const matchesPrice = Number.isFinite(price)
        && price >= priceRange[0]
        && price <= priceRange[1];

      const matchesSearch = searchTerm
        ? product.title.toLowerCase().includes(searchTerm)
        : true;

      return matchesCategory && matchesPrice && matchesSearch;
    }),
  [products, filteredCategory, priceRange, searchTerm]);

  const isFiltering = useMemo(() => Boolean(
    searchTerm
    || filteredCategory
    || (selectedPriceRange && priceBounds && (
      selectedPriceRange[0] > priceBounds.min
      || selectedPriceRange[1] < priceBounds.max
    ))
  ), [filteredCategory, priceBounds, searchTerm, selectedPriceRange]);

  // Handlers for setting filters
  const handlePriceChange = useCallback((range) => setSelectedPriceRange(range), []);
  const handleCategoryChange = useCallback((category) => {
    setFilteredCategory(category);
    // Drop stale selected range so available bounds for the new category apply fully.
    setSelectedPriceRange(null);
  }, []);
  const handleSearchChange = useCallback((term) => setSearchTerm(term.toLowerCase()), []);

  return {
    categories,
    filteredProducts,
    categoriesAdmin,
    filteredCategory,
    priceBounds,
    priceRange,
    selectedPriceRange,
    searchTerm,
    isFiltering,
    handlePriceChange,
    handleCategoryChange,
    handleSearchChange,
  };
};
