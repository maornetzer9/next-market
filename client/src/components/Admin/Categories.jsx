import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Alert, Fade, MenuItem, Select } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { loadProductsAction } from '../../actions/productActions';
import { ORIGIN } from '../../App';
import { MdSearch, MdSwapVert } from 'react-icons/md';
import Category from './Category';
import AdminPageContainer from './AdminPageContainer';
import AdminPageHeader from './AdminPageHeader';
import { buildAdminCategories, filterAndSortAdminCategories } from './adminCategoryData';
import { getCategoryTone } from '../../utils/categoryTone';
import { useDarkMode } from '../../hooks/darkMode';
import '../../css/admin-categories.css';

export default function Categories() {
  const { products } = useSelector((state) => state.productsReducer);

  const PRODUCTS_URL_LOAD = `${ORIGIN}/products/admin`;
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('az');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [darkMode] = useDarkMode();

  const categories = useMemo(() => buildAdminCategories(products), [products]);

  const visibleCategories = useMemo(
    () => filterAndSortAdminCategories(categories, search, sort),
    [categories, search, sort]
  );

  const loadCategories = useCallback(async () => {
    setLoadState('loading');
    setLoadError('');
    const result = await dispatch(loadProductsAction(PRODUCTS_URL_LOAD, { authenticated: true }));
    if (result?.code === 200) {
      setLoadState('ready');
      return;
    }
    setLoadError(result?.message || 'Categories could not be loaded. Please try again.');
    setLoadState('error');
  }, [dispatch, PRODUCTS_URL_LOAD]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  if (loadState === 'loading') {
    return (
      <AdminPageContainer className="admin-categories">
        <AdminPageHeader
          title="Categories"
          description="Manage your product categories. Rename or remove categories from your store."
        />
        <div className="admin-page__body">
          <div className="admin-categories__state admin-surface" role="status" aria-live="polite">
            <span className="admin-categories__spinner" aria-hidden="true" />
            <strong>Loading categories</strong>
            <span>Fetching the latest product catalog.</span>
          </div>
        </div>
      </AdminPageContainer>
    );
  }

  if (loadState === 'error') {
    return (
      <AdminPageContainer className="admin-categories">
        <AdminPageHeader
          title="Categories"
          description="Manage your product categories. Rename or remove categories from your store."
        />
        <div className="admin-page__body">
          <Alert severity="error" className="admin-categories__alert">
            {loadError}
          </Alert>
          <button type="button" className="admin-btn-secondary admin-categories__retry" onClick={loadCategories}>
            Try again
          </button>
        </div>
      </AdminPageContainer>
    );
  }

  return (
    <AdminPageContainer className="admin-categories">
      <AdminPageHeader
        title="Categories"
        description="Manage your product categories. Rename or remove categories from your store."
      />

      <div className="admin-page__body">
        <div className="admin-categories__toolbar">
          <label className="admin-categories__search" htmlFor="admin-category-search">
            <MdSearch aria-hidden="true" />
            <input
              id="admin-category-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              autoComplete="off"
            />
          </label>
          <div className={`admin-categories__sort${sortMenuOpen ? ' is-open' : ''}`}>
            <label className="visually-hidden" id="admin-category-sort-label" htmlFor="admin-category-sort">Sort by</label>
            <MdSwapVert aria-hidden="true" />
            <Select
              id="admin-category-sort"
              labelId="admin-category-sort-label"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              open={sortMenuOpen}
              onOpen={() => setSortMenuOpen(true)}
              onClose={() => setSortMenuOpen(false)}
              disableUnderline
              variant="standard"
              className="admin-categories__sort-select"
              inputProps={{ 'aria-label': 'Sort categories' }}
              MenuProps={{
                disableScrollLock: true,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                transformOrigin: { vertical: 'top', horizontal: 'right' },
                TransitionComponent: Fade,
                transitionDuration: { enter: 180, exit: 140 },
                PaperProps: {
                  className: `admin-category-sort-menu${darkMode ? ' is-dark' : ''}`,
                  elevation: 0,
                },
                MenuListProps: {
                  className: "admin-category-sort-menu__list",
                  'aria-label': 'Category sort options',
                },
              }}
            >
              <MenuItem className="admin-category-sort-menu__option" disableRipple value="az">Sort by: Name (A-Z)</MenuItem>
              <MenuItem className="admin-category-sort-menu__option" disableRipple value="za">Sort by: Name (Z-A)</MenuItem>
              <MenuItem className="admin-category-sort-menu__option" disableRipple value="count">Sort by: Product count</MenuItem>
            </Select>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="admin-categories__state admin-surface">
            <strong>No categories yet</strong>
            <span>Categories appear here when products are assigned to them.</span>
          </div>
        ) : (
          <div className="admin-categories__panel admin-surface">
            <div className="admin-categories__panel-heading">
              <div>
                <span className="admin-categories__panel-kicker">Category directory</span>
                <strong>{visibleCategories.length} of {categories.length} categories</strong>
              </div>
              <div className="admin-categories__panel-legend" aria-hidden="true">
                <span>Product coverage</span>
                <span>Actions</span>
              </div>
            </div>
            <ul className="admin-categories__list b25-internal-scroll" aria-label="Product categories">
              {visibleCategories.map(({ category, label, productCount }) => {
                const tone = getCategoryTone(category);
                return (
                  <li
                    key={category}
                    className="admin-categories__row"
                    style={{ '--category-tint': tone.bg, '--category-accent': tone.fg }}
                  >
                    <Category category={category} label={label} productCount={productCount} />
                  </li>
                );
              })}
            </ul>
            {visibleCategories.length === 0 ? (
              <div className="admin-categories__state admin-categories__state--inline" role="status">
                <strong>No matching categories</strong>
                <span>Try a different name or clear the search field.</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminPageContainer>
  );
}
