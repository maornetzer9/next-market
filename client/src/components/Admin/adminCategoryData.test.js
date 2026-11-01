import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildAdminCategories, filterAndSortAdminCategories } from './adminCategoryData.js';

test('admin categories are derived only from real product category values', () => {
  const categories = buildAdminCategories([
    { id: 1, category: 'mens-shoes' },
    { id: 2, category: 'mens-shoes' },
    { id: 3, category: 'beauty' },
    { id: 4, category: '  ' },
    { id: 5 },
  ]);

  assert.deepEqual(categories, [
    { category: 'mens-shoes', label: 'Mens Shoes', productCount: 2 },
    { category: 'beauty', label: 'Beauty', productCount: 1 },
  ]);
  assert.deepEqual(buildAdminCategories([]), []);
});

test('admin category search covers formatted labels and stored slugs', () => {
  const categories = buildAdminCategories([
    { category: 'mobile-accessories' },
    { category: 'skin-care' },
  ]);

  assert.equal(filterAndSortAdminCategories(categories, 'Mobile Accessories').length, 1);
  assert.equal(filterAndSortAdminCategories(categories, 'skin-care')[0].category, 'skin-care');
  assert.deepEqual(filterAndSortAdminCategories(categories, 'missing'), []);
});

test('admin categories sort deterministically by label or product count', () => {
  const categories = buildAdminCategories([
    { category: 'zeta' },
    { category: 'alpha' },
    { category: 'alpha' },
    { category: 'beta' },
    { category: 'beta' },
  ]);

  assert.deepEqual(filterAndSortAdminCategories(categories, '', 'az').map((item) => item.category), ['alpha', 'beta', 'zeta']);
  assert.deepEqual(filterAndSortAdminCategories(categories, '', 'za').map((item) => item.category), ['zeta', 'beta', 'alpha']);
  assert.deepEqual(filterAndSortAdminCategories(categories, '', 'count').map((item) => item.category), ['alpha', 'beta', 'zeta']);
});

test('categories UI omits unsupported create/status controls and protects destructive delete', async () => {
  const categories = await readFile(new URL('./Categories.jsx', import.meta.url), 'utf8');
  const category = await readFile(new URL('./Category.jsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../css/admin-categories.css', import.meta.url), 'utf8');

  assert.doesNotMatch(categories, /createCategoryAction|Add Category|products\/create/);
  assert.doesNotMatch(categories, /category-status|type="checkbox"|draggable=/i);
  assert.match(categories, /No categories yet/);
  assert.match(categories, /No matching categories/);
  assert.match(categories, /Category directory/);
  assert.match(categories, /visibleCategories\.length/);
  assert.match(categories, /getCategoryTone\(category\)/);
  assert.match(categories, /'--category-accent': tone\.fg/);
  assert.match(categories, /Try again/);
  assert.match(category, /window\.confirm/);
  assert.match(category, /MoreHorizIcon/);
  assert.match(category, /event\.key === 'Enter'/);
  assert.match(category, /event\.key === 'Escape'/);
  assert.match(category, /function iconFor\(category\)/);
  assert.match(category, /CategoryOutlinedIcon/);
  assert.match(category, /--category-accent/);
  assert.doesNotMatch(category, /markLetter/);
  assert.match(css, /height:\s*calc\(100dvh - var\(--b25-command-height\)\)/);
  assert.match(css, /\.admin-categories__list[\s\S]*overflow-y:\s*auto/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*min-height:\s*56px/);
  assert.match(css, /admin-categories__mobile-menu summary[\s\S]*width:\s*44px;[\s\S]*height:\s*44px/);
  assert.doesNotMatch(css, /admin-categories__toolbar::before/);
  assert.match(css, /row:has\(\.admin-categories__edit-field\)[\s\S]*grid-column:\s*auto/);
  assert.match(categories, /open=\{sortMenuOpen\}/);
  assert.match(categories, /onOpen=\{\(\) => setSortMenuOpen\(true\)\}/);
  assert.match(categories, /admin-category-sort-menu/);
  assert.match(categories, /aria-label': 'Category sort options'/);
  assert.match(css, /admin-category-sort-menu\.is-dark[\s\S]*background:\s*#111d2a;[\s\S]*color:\s*#f4f7fb/);
  assert.match(css, /row:has\(\.admin-categories__mobile-menu\[open\]\)[\s\S]*z-index:\s*4/);
});

test('Categories edit keeps Products before desktop Save, Cancel and Delete actions', async () => {
  const category = await readFile(new URL('./Category.jsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../css/admin-categories.css', import.meta.url), 'utf8');
  assert.ok(category.indexOf('className="admin-categories__count"') < category.indexOf('className="admin-categories__actions admin-categories__actions--desktop"'));
  assert.match(css, /\.admin-categories__row:has\(\.admin-categories__edit-field\)\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) var\(--category-count-column\) var\(--category-action-column\)/s);
  assert.match(css, /\.admin-categories__row:has\(\.admin-categories__edit-field\) \.admin-categories__count\s*\{[^}]*grid-column:\s*2/s);
  assert.match(css, /\.admin-categories__row:has\(\.admin-categories__edit-field\) \.admin-categories__actions--desktop\s*\{[^}]*grid-column:\s*3/s);
  assert.match(css, /--category-count-column:\s*72px/);
  assert.match(css, /--category-action-column:\s*112px/);
  assert.match(css, /\.admin-categories__panel-legend\s*\{[^}]*grid-template-columns:\s*var\(--category-count-column\) var\(--category-action-column\)/s);
  assert.match(css, /\.admin-categories__actions--desktop\s*\{[^}]*opacity:\s*0;[^}]*visibility:\s*hidden/s);
  assert.match(css, /row:has\(\.admin-categories__edit-field\) \.admin-categories__actions--desktop\s*\{[^}]*opacity:\s*1;[^}]*visibility:\s*visible/s);
  assert.match(css, /prefers-reduced-motion:[\s\S]*admin-categories__actions--desktop[\s\S]*transition-duration:\s*0\.01ms !important/);
  assert.doesNotMatch(category, /AnimatePresence|mode="wait"/);
  assert.match(category, /admin-categories__action-slot/);
  assert.match(category, /admin-categories__action-layer--normal/);
  assert.match(category, /admin-categories__action-layer--edit/);
  assert.match(category, /useReducedMotion\(\)/);
  assert.match(css, /\.admin-categories__action-slot\s*\{[^}]*grid-column:\s*3;[^}]*min-height:\s*44px/s);
  assert.match(css, /\.admin-categories__action-layer\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0/s);
  assert.match(css, /\.admin-categories__action-layer\[aria-hidden="true"\] \* \{ pointer-events: none; \}/);
  assert.doesNotMatch(css, /padding-inline-end:\s*116px/);
  assert.match(category, /aria-label="Save"/);
  assert.match(category, /aria-label="Cancel"/);
  assert.match(category, /aria-label=\{`Delete \$\{label\}`\}/);
  assert.match(category, /aria-hidden=\{edit\}/);
  assert.match(category, /aria-hidden=\{!edit\}/);
  assert.match(category, /tabIndex=\{normal \? 0 : -1\}/);
  assert.match(category, /aria-hidden=\{!normal\}/);
  assert.match(category, /useState\('idle'\)/);
  assert.match(category, /setEditPhase\('exiting'\)/);
  assert.match(category, /editPhase !== 'idle'/);
  assert.match(category, /admin-categories__identity-normal/);
  assert.match(css, /\.admin-categories__identity-copy\s*\{[^}]*display:\s*grid;[^}]*min-height:\s*44px/s);
  assert.match(css, /\.admin-categories__identity-normal[\s\S]*grid-area:\s*1\s*\/\s*1/s);
  assert.match(css, /\.admin-categories__action-layer--edit \.admin-categories__actions--desktop\s*\{[^}]*width:\s*112px/s);
  assert.match(css, /\.admin-categories__action-layer--edit \.admin-categories__btn\s*\{[^}]*flex:\s*0 0 34px/s);
  assert.match(category, /window\.confirm/);
});
