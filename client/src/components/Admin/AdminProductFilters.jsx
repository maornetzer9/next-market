import React, { useEffect, useState } from "react";
import { Slider } from "@mui/material";
import { MdCategory, MdPayments, MdSearch, MdTune } from "react-icons/md";
import { formatCatalogPrice } from "../../utils/priceRange";
import { getCategoryTone } from "../../utils/categoryTone";

/**
 * Admin-only product filter presentation.
 * Calls the same useProductFilter handlers as FilterModel default — does not touch b25 / Shop.
 */
export default function AdminProductFilters({
  categories = [],
  selectedCategory = "",
  onCategoryChange,
  onPriceChange,
  onSearch,
  priceBounds = null,
  priceRange,
  resultsCount,
}) {
  const [draftPrice, setDraftPrice] = useState(null);
  const [searchTitle, setSearchTitle] = useState("");

  const minimumPrice = priceBounds?.min ?? 0;
  const maximumPrice = priceBounds?.max ?? minimumPrice;
  const committedPrice = priceRange || [minimumPrice, maximumPrice];
  const price = draftPrice || committedPrice;
  const categoryTone = selectedCategory ? getCategoryTone(selectedCategory) : null;

  useEffect(() => {
    setDraftPrice(null);
  }, [minimumPrice, maximumPrice, priceRange?.[0], priceRange?.[1]]);

  const handleCategoryChange = ({ target: { value } }) => {
    onCategoryChange?.(value);
  };

  const handlePriceInput = (_event, newValue) => {
    setDraftPrice(newValue);
  };

  const handlePriceCommit = (_event, newValue) => {
    setDraftPrice(null);
    onPriceChange?.(newValue);
  };

  const handleSearchChange = ({ target: { value } }) => {
    setSearchTitle(value);
    onSearch?.(value);
  };

  return (
    <section className="admin-product-filters" aria-label="Product filters">
      <header className="admin-product-filters__header">
        <span className="admin-product-filters__header-icon" aria-hidden="true"><MdTune /></span>
        <div>
          <span>Product command bar</span>
          <strong>Find and refine inventory</strong>
        </div>
        {typeof resultsCount === "number" ? (
          <span className="admin-product-filters__result" aria-live="polite">
            <strong>{resultsCount}</strong> results
          </span>
        ) : null}
      </header>
      <div className="admin-product-filters__search">
        <label htmlFor="admin-product-search" className="admin-product-filters__label">
          Search
        </label>
        <div className="admin-product-filters__search-field">
          <input
            id="admin-product-search"
            type="search"
            value={searchTitle}
            onChange={handleSearchChange}
            placeholder="Search by product title..."
            autoComplete="off"
          />
          <MdSearch className="admin-product-filters__search-icon" aria-hidden="true" />
        </div>
      </div>

      <div
        className={`admin-product-filters__category${selectedCategory ? " is-selected" : ""}`}
        style={categoryTone ? { "--category-tint": categoryTone.bg, "--category-accent": categoryTone.fg } : undefined}
      >
        <label htmlFor="admin-product-category" className="admin-product-filters__label">
          <MdCategory aria-hidden="true" />
          Category
        </label>
        <select
          id="admin-product-category"
          className="admin-product-filters__select"
          value={selectedCategory}
          onChange={handleCategoryChange}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="admin-product-filters__price" disabled={!priceBounds}>
        <legend className="admin-product-filters__label">
          <MdPayments aria-hidden="true" />
          Price range
        </legend>
        <div className="admin-product-filters__price-stage">
          <div className="admin-product-filters__price-values">
            <output aria-label="Minimum price">{formatCatalogPrice(price[0])}</output>
            <output aria-label="Maximum price">{formatCatalogPrice(price[1])}</output>
          </div>
          <Slider
            className="admin-product-filters__slider"
            size="small"
            value={price}
            onChange={handlePriceInput}
            onChangeCommitted={handlePriceCommit}
            min={minimumPrice}
            max={maximumPrice}
            step={0.01}
            disabled={!priceBounds}
            disableSwap
            valueLabelDisplay="off"
            getAriaLabel={(index) =>
              index === 0 ? "Minimum price range" : "Maximum price range"
            }
            getAriaValueText={(value) => formatCatalogPrice(value)}
          />
        </div>
      </fieldset>
    </section>
  );
}
