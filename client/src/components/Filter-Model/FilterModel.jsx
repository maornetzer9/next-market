import React, { useEffect, useState } from "react";
import { AppBar, Box, Fade, MenuItem, Select, Slider, TextField, Toolbar, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { MdCategory, MdPayments, MdSearch, MdTune } from "react-icons/md";

import { useDarkMode } from "../../hooks/darkMode";
import { formatCategoryLabel } from "../../utils/storefrontNavigation";
import { formatCatalogPrice } from "../../utils/priceRange";

export default function FilterModel({
  categories,
  selectedCategory: controlledCategory,
  onCategoryChange,
  onPriceChange,
  onSearch,
  priceBounds,
  priceRange: controlledPriceRange,
  resultsCount,
  stuck = false,
  variant = "default",
}) {
  const [darkMode] = useDarkMode();
  const reduceMotion = useReducedMotion();
  const [localPrice, setLocalPrice] = useState([0, 8]);
  const [draftPrice, setDraftPrice] = useState(null);
  const [localCategory, setLocalCategory] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const selectedCategory = controlledCategory ?? localCategory;

  const handleCategoryChange = ({ target: { value } }) => {
    if (controlledCategory === undefined) setLocalCategory(value);
    onCategoryChange(value);
  };

  // Visual-only while dragging — commit on release so filters don't thrash every pixel.
  const handlePriceInput = (event, newValue) => {
    setDraftPrice(newValue);
    if (!controlledPriceRange) setLocalPrice(newValue);
  };

  const handlePriceCommit = (event, newValue) => {
    setDraftPrice(null);
    if (!controlledPriceRange) setLocalPrice(newValue);
    onPriceChange(newValue);
  };

  const handleSearchChange = ({ target: { value } }) => {
    setSearchTitle(value);
    onSearch(value);
  };

  const handleCategoryClose = () => {
    setCategoryMenuOpen(false);
    // Pointer dismiss leaves MUI "focused" without :focus-visible — release that
    // so coral idle-resets. Keyboard focus-visible stays untouched for a11y.
    const focused = typeof document !== "undefined" ? document.activeElement : null;
    if (
      focused?.closest?.(".catalog-controls__category-select") &&
      typeof focused.matches === "function" &&
      !focused.matches(":focus-visible")
    ) {
      focused.blur();
    }
  };

  const minimumPrice = priceBounds?.min ?? 0;
  const maximumPrice = priceBounds?.max ?? minimumPrice;
  const committedPrice = controlledPriceRange || localPrice;
  const price = draftPrice || committedPrice;

  useEffect(() => {
    setDraftPrice(null);
  }, [minimumPrice, maximumPrice, controlledPriceRange?.[0], controlledPriceRange?.[1]]);

  if (variant === "b25") {
    return (
      <motion.section
        className={`catalog-controls${stuck ? " is-stuck" : ""}`}
        aria-label="Catalog filters"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.09 : 0.26, delay: reduceMotion ? 0 : 0.11, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="catalog-controls__search">
          <div className="catalog-controls__search-head">
            <label htmlFor="catalog-search" className="b25-ui-label"><MdSearch aria-hidden="true" /> Search products</label>
            <p className="catalog-controls__inline-count b25-tabular" aria-live="polite">
              <strong>{resultsCount}</strong>
              <span>shown</span>
            </p>
          </div>
          <div className="catalog-controls__field">
            <input
              id="catalog-search"
              type="search"
              value={searchTitle}
              onChange={handleSearchChange}
              placeholder="Search by product title..."
              autoComplete="off"
            />
          </div>
        </div>

        <div className="catalog-controls__category">
          <label id="catalog-category-label" htmlFor="catalog-category" className="b25-ui-label"><MdCategory aria-hidden="true" /> Category</label>
          <Select
            id="catalog-category"
            labelId="catalog-category-label"
            value={selectedCategory}
            onChange={handleCategoryChange}
            open={categoryMenuOpen}
            onOpen={() => setCategoryMenuOpen(true)}
            onClose={handleCategoryClose}
            displayEmpty
            disableUnderline
            variant="standard"
            className={`catalog-controls__category-select${categoryMenuOpen ? " is-open" : ""}`}
            inputProps={{ "aria-label": "Category" }}
            renderValue={(value) => (value ? formatCategoryLabel(value) : "All categories")}
            MenuProps={{
              disableScrollLock: true,
              anchorOrigin: { vertical: "bottom", horizontal: "left" },
              transformOrigin: { vertical: "top", horizontal: "left" },
              TransitionComponent: Fade,
              transitionDuration: { enter: 180, exit: 140 },
              PaperProps: {
                className: `b27-category-menu__paper${darkMode ? " is-dark" : ""}`,
                elevation: 0,
              },
              MenuListProps: {
                className: "b27-category-menu__list b25-internal-scroll",
                "aria-label": "Category options",
                onWheel: (event) => event.stopPropagation(),
              },
            }}
          >
            <MenuItem className="b27-category-menu__option" disableRipple value="">All categories</MenuItem>
            {categories.map((category) => (
              <MenuItem className="b27-category-menu__option" disableRipple key={category} value={category}>
                {formatCategoryLabel(category)}
              </MenuItem>
            ))}
          </Select>
        </div>

        <fieldset className="catalog-controls__price" disabled={!priceBounds}>
          <legend className="sr-only">Price range</legend>
          <div className="b25-ui-label catalog-controls__section-label" aria-hidden="true">
            <MdPayments aria-hidden="true" /> Price range
          </div>
          <div className="catalog-controls__price-stage">
            <div className="catalog-controls__price-inputs b25-tabular">
              <output className="catalog-controls__price-value" aria-label="Minimum price">
                <span className="catalog-controls__price-caption">Min</span>
                <span className="catalog-controls__price-amount">{formatCatalogPrice(price[0])}</span>
              </output>
              <output className="catalog-controls__price-value is-max" aria-label="Maximum price">
                <span className="catalog-controls__price-caption">Max</span>
                <span className="catalog-controls__price-amount">{formatCatalogPrice(price[1])}</span>
              </output>
            </div>
            <Slider
              className="catalog-controls__price-slider"
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
              getAriaLabel={(index) => (index === 0 ? "Minimum price range" : "Maximum price range")}
              getAriaValueText={(value) => formatCatalogPrice(value)}
            />
          </div>
        </fieldset>

        <div className="catalog-controls__result" aria-live="polite">
          <span className="catalog-controls__result-label b25-ui-label">
            <MdTune aria-hidden="true" />
            <span className="catalog-controls__result-title">Filter products</span>
          </span>
          <strong className="b25-tabular">{resultsCount}</strong>
          <span className="b25-ui-label catalog-controls__result-unit">shown</span>
        </div>
      </motion.section>
    );
  }

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ mt: 5, px: 2 }}>
      <Toolbar
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: { xs: "center", sm: "space-between" },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Select
          value={selectedCategory}
          onChange={handleCategoryChange}
          displayEmpty
          sx={{
            mr: { sm: 2 },
            minWidth: { xs: 120, sm: 150 },
            bgcolor: darkMode ? "white" : "",
          }}
        >
          <MenuItem value=""><em>All Categories</em></MenuItem>
          {categories.map((category) => (
            <MenuItem key={category} value={category}>{category}</MenuItem>
          ))}
        </Select>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mr: { sm: 2 },
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>Price:</Typography>
          <Slider
            value={price}
            onChange={handlePriceInput}
            onChangeCommitted={handlePriceCommit}
            valueLabelDisplay="auto"
            sx={{ width: { xs: "80%", sm: 200 }, ml: 2 }}
            min={minimumPrice}
            max={maximumPrice}
            disabled={!priceBounds && Boolean(controlledPriceRange)}
          />
          <Typography variant="body2" sx={{ ml: 2, whiteSpace: "nowrap" }}>
            ${price[0]} - ${price[1]}
          </Typography>
        </Box>

        <TextField
          value={searchTitle}
          onChange={handleSearchChange}
          label="Search by title"
          variant="outlined"
          size="small"
          sx={{
            width: { xs: "100%", sm: 300 },
            bgcolor: darkMode ? "white" : "",
            mt: { xs: 2, sm: 0 },
          }}
        />
      </Toolbar>
    </AppBar>
  );
}
