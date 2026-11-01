import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  buildAdminDashboardData,
  getOrderRevenue,
} from './components/Admin/adminDashboardData.js';

test('Admin Dashboard derives metrics and rankings only from supplied data', () => {
  const products = [
    { title: 'Lamp', category: 'Furniture' },
    { title: 'Chair', category: 'Furniture' },
    { title: 'Soap', category: 'Beauty' },
  ];
  const users = [
    {
      _id: 'u1',
      firstName: 'Ari',
      lastName: 'Levi',
      orders: [
        { id: 1, title: 'Lamp', quantity: 2, price: 10, total: 20, joinedAt: '2026-08-01', status: 'Delivered' },
        { id: 2, title: 'Soap', quantity: 3, price: 4, total: 12, joinedAt: '2026-08-02', status: 'Shipped' },
      ],
    },
    { _id: 'u2', firstName: 'Noa', orders: [] },
  ];

  const result = buildAdminDashboardData(products, users);

  assert.deepEqual(result.metrics, {
    products: 3,
    orders: 2,
    customers: 1,
    revenue: 32,
    units: 5,
  });
  assert.equal(result.topProducts[0].title, 'Soap');
  assert.deepEqual(result.catalogMix[0], { name: 'Furniture', count: 2 });
  assert.equal(result.revenueSeries.length, 2);
  assert.equal(result.recentOrders[0].title, 'Soap');
});

test('Admin Dashboard revenue uses existing total or the existing price and quantity fallback', () => {
  assert.equal(getOrderRevenue({ total: 42, price: 10, quantity: 9 }), 42);
  assert.equal(getOrderRevenue({ price: 12.5, quantity: 2 }), 25);
  assert.equal(getOrderRevenue({ total: 'invalid', price: 'invalid', quantity: 2 }), 0);
});

test('V89 Admin Dashboard accepts persisted DD/MM/YYYY order timestamps', () => {
  const result = buildAdminDashboardData([], [{
    _id: 'u1',
    orders: [{ title: 'Lamp', total: 20, quantity: 1, joinedAt: '30/08/2024, 19:43:22' }],
  }]);

  assert.equal(result.revenueSeries.length, 1);
  assert.equal(result.revenueSeries[0].value, 20);
  assert.match(result.dateRange, /Aug 30, 2024/);
});

test('Admin foundation reuses Customer shell primitives while keeping Admin routes and content isolated', async () => {
  const [shell, navbar, brand, nav, dashboard, css] = await Promise.all([
    readFile(new URL('./components/Admin/AdminShell.jsx', import.meta.url), 'utf8'),
    readFile(new URL('./components/Navbar-Model/NavbarModel.jsx', import.meta.url), 'utf8'),
    readFile(new URL('./components/Shell/MarketBrandLink.jsx', import.meta.url), 'utf8'),
    readFile(new URL('./components/Admin/adminNav.js', import.meta.url), 'utf8'),
    readFile(new URL('./components/Admin/AdminDashboard.jsx', import.meta.url), 'utf8'),
    readFile(new URL('./css/admin-shell.css', import.meta.url), 'utf8'),
  ]);

  assert.match(shell, /AuthBrandMark/);
  assert.match(shell, /useDarkMode\(\)/);
  assert.match(shell, /ADMIN_PRIMARY_NAV/);
  assert.match(shell, /ADMIN_MOBILE_NAV/);
  assert.doesNotMatch(shell, /import\s+.*NavbarModel/);
  assert.match(shell, /MarketBrandLink/);
  assert.match(navbar, /MarketBrandLink/);
  assert.match(brand, /b25-customer-command__brand/);
  for (const primitive of [
    'b25-customer-shell',
    'b25-customer-spine nm-spine',
    'b25-customer-command',
    'b25-customer-main',
    'storefront-mobile-nav',
  ]) assert.match(shell, new RegExp(primitive));
  assert.match(shell, /NeuralWaveField/);
  assert.match(shell, /products: ShoppingBagTwoToneIcon/);
  assert.match(shell, /storefront-mobile-nav__categories-ring[\s\S]*<AdminNavIcon id=\{item\.id\}/);
  assert.doesNotMatch(shell, /CategoryBrowseIcon/);
  assert.match(css, /admin-shell \.storefront-mobile-nav__categories-ring > svg \{ width: 28px; height: 28px; \}/);
  assert.equal((nav.match(/export const ADMIN_DESTINATIONS/g) || []).length, 1);
  assert.match(dashboard, /buildAdminDashboardData\(products, users\)/);
  assert.match(dashboard, /AdminEntityImage/);
  assert.match(dashboard, /getAdminChartTheme/);
  assert.match(css, /\.admin-shell/);
  assert.doesNotMatch(css, /\.admin-shell__sidebar\s*\{/);
  assert.doesNotMatch(css, /\.admin-shell__topbar\s*\{/);
});
