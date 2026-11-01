import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const table = readFileSync(new URL('./AdminCustomersTable.jsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('./Customers.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../css/admin-customers.css', import.meta.url), 'utf8');
const image = readFileSync(new URL('./AdminEntityImage.jsx', import.meta.url), 'utf8');
const dashboardData = readFileSync(new URL('./adminDashboardData.js', import.meta.url), 'utf8');

test('Admin Customers keeps the real users-orders endpoint and explicit load states', () => {
  assert.match(page, /loadUsersOrders\(LOAD_ADMIN_ORDERS_URL\)/);
  assert.match(page, /loading=\{loadState\.loading\}/);
  assert.match(page, /loadError=\{loadState\.error\}/);
});

test('desktop Customers starts unselected and animates a coordinated split detail', () => {
  assert.match(table, /useState\(null\)/);
  assert.match(table, /AnimatePresence/);
  assert.match(table, /x: 34/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 0fr\)/);
  assert.match(css, /is-detail-open[\s\S]*grid-template-columns/);
  assert.match(table, /function AdminCustomerRow/);
  assert.doesNotMatch(table, /<table|<tbody|role="button"/);
});

test('compact Customers uses a bottom sheet and preserves bounded scroll ownership', () => {
  assert.match(table, /y: '100%'/);
  assert.match(table, /role="dialog"/);
  assert.match(css, /admin-customers__sheet[\s\S]*position: fixed/);
  assert.match(css, /admin-customers__directory[\s\S]*overflow-y: auto/);
  assert.match(css, /admin-customers__order-cards[\s\S]*overflow-y: auto/);
  assert.match(css, /grid-template-areas:[\s\S]*"meta meta total"[\s\S]*"thumb info total"/);
  assert.match(css, /@media \(max-width: 1200px\) \{[\s\S]*\.admin-shell \.admin-customers \{ animation: none; \}/);
});

test('mobile Customers stays content-sized and keeps its summary attached', () => {
  const mobile = css.slice(css.indexOf('@media (max-width: 600px)'), css.indexOf('@media (max-width: 390px)'));
  assert.match(mobile, /admin-customers__layout[^}]*flex: 0 0 auto[^}]*overflow: visible/s);
  assert.match(mobile, /admin-customers__master \{[^}]*height: auto[^}]*overflow: visible/s);
  assert.match(mobile, /admin-customers__list-region \{[^}]*flex: 0 1 auto[^}]*max-height: 430px/s);
  assert.match(mobile, /admin-customers__directory \{[^}]*flex: 0 1 auto[^}]*overflow-y: auto/s);
  assert.match(mobile, /admin-customers__customer-row \{[^}]*min-height: clamp\(90px, 11dvh, 94px\)/s);
  assert.match(mobile, /admin-customers__avatar \{[^}]*width: clamp\(44px, 11\.8vw, 48px\)[^}]*height: clamp\(44px, 11\.8vw, 48px\)/s);
  assert.match(mobile, /admin-customers__search \{[^}]*min-height: 54px/s);
  assert.match(mobile, /admin-customers__pagination \{[^}]*min-height: 56px[^}]*border: 1px solid[^}]*border-radius: 0 0 17px 17px/s);
  assert.doesNotMatch(mobile, /admin-customers__(?:list-region|directory) \{[^}]*flex: 1 1 auto/s);
});

test('selected customer preserves one reusable row structure and accessible detail state', () => {
  assert.match(table, /admin-customers__customer-row/);
  assert.match(table, /aria-expanded=\{selected\}/);
  assert.match(table, /aria-controls="admin-customer-orders-panel"/);
  assert.match(css, /admin-customers__customer-row\.is-selected/);
});

test('Customers presents only persisted customer and order fields', () => {
  for (const field of ['user.createAt', 'user.username', 'order.createAt', 'order.quantity', 'order.status']) {
    assert.match(table, new RegExp(field.replace('.', '\\.')));
  }
  assert.match(table, /getOrderRevenue\(order\)/);
  assert.match(dashboardData, /order\?\.total/);
  assert.match(dashboardData, /order\?\.price/);
  assert.match(table, /resolveAdminPurchaseImage\(order\)/);
  assert.doesNotMatch(table, /Emma Johnson|Liam Anderson|May 24, 2024|Delivered/);
});

test('Customers exposes truthful Total Price in rows and the reusable detail summary', () => {
  assert.match(table, /getCustomerOrderTotal/);
  assert.match(table, /formatCatalogPrice/);
  assert.match(table, /admin-customers__spent/);
  assert.match(table, /admin-customers__summary-metric[^\n]*Total Price/);
  assert.match(table, /aria-label=\{`Total price /);
  assert.doesNotMatch(table, /Total spent/i);
  assert.match(css, /admin-customers__activity/);
  assert.match(css, /admin-customers__summary-metrics/);
});

test('desktop iPhone stacks customer summary metrics without compressing currency values', () => {
  assert.match(css, /@media \(min-width: 1201px\) \{[\s\S]*admin-device-frame \.admin-customers__summary-metrics \{[\s\S]*grid-template-columns: minmax\(92px, auto\)[\s\S]*grid-template-rows: repeat\(2, auto\)/);
  assert.match(css, /admin-device-frame \.admin-customers__summary-metric \{[\s\S]*justify-items: start/);
  assert.match(css, /admin-device-frame \.admin-customers__summary-metric \+ \.admin-customers__summary-metric \{ border-left: 0/);
  assert.match(css, /admin-device-frame \.admin-customers__summary-metric\.is-spent strong \{ font-size: 11\.5px; white-space: nowrap/);
});

test('mobile Orders sheet gives Total Orders and Total Price equal readable hierarchy', () => {
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*admin-customers__sheet \.admin-customers__summary \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) 180px/);
  assert.match(css, /admin-customers__sheet \.admin-customers__summary-metrics \{[\s\S]*grid-template-columns: 75px 1px 88px/);
  assert.match(css, /admin-customers__sheet \.admin-customers__summary-metric span \{[\s\S]*font-size: clamp\(9px, 2\.3vw, 9\.5px\)/);
  assert.match(css, /admin-customers__sheet \.admin-customers__summary-metric strong,[\s\S]*admin-customers__sheet \.admin-customers__summary-metric\.is-spent strong \{[\s\S]*font-size: clamp\(14px, 3\.8vw, 15px\)/);
});

test('mobile Customers composes identity stacks, centered footer halves, and an explicit summary divider', () => {
  assert.match(table, /admin-customers__identity-date/);
  assert.match(table, /admin-customers__summary-identity/);
  assert.match(table, /admin-customers__summary-copy[^\n]*Joined \{user\.createAt\}/);
  assert.doesNotMatch(table, /admin-customers__summary-date/);
  assert.match(table, /admin-customers__summary-divider/);
  assert.match(css, /admin-customers__pagination-meta \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)[\s\S]*width: 100%/);
  assert.match(css, /admin-customers__summary-metrics \{[\s\S]*grid-template-columns: 75px 1px 88px/);
  assert.match(css, /admin-customers__summary-divider \{[\s\S]*display: block[\s\S]*width: 1px[\s\S]*height: 76%/);
});

test('mobile Customers keeps directory identity primary while preserving sheet metric sizing', () => {
  assert.match(css, /@media \(max-width: 600px\) \{[\s\S]*admin-customers__list-region \{[\s\S]*max-height: 430px/);
  assert.match(css, /admin-customers__customer-row \{[\s\S]*min-height: clamp\(90px, 11dvh, 94px\)[\s\S]*padding: 12px 13px/);
  assert.match(css, /admin-customers__spent span, \.admin-shell \.admin-customers__orders-count span \{[\s\S]*font-size: clamp\(8px, 2\.2vw, 9px\)/);
  assert.match(css, /admin-customers__spent strong \{ font-size: clamp\(12\.5px, 3\.3vw, 13\.5px\); font-weight: 600/);
  assert.match(css, /admin-customers__orders-count strong \{ font-size: clamp\(12\.5px, 3\.3vw, 13\.5px\); font-weight: 600/);
  assert.match(css, /admin-customers__name \{ font-size: clamp\(13\.5px, 3\.6vw, 14\.5px\); font-weight: 600/);
  assert.match(css, /admin-customers__email \{[\s\S]*font-size: clamp\(10\.5px, 2\.8vw, 11\.5px\)/);
  assert.match(css, /admin-customers__identity-date \{[\s\S]*font-size: clamp\(10px, 2\.6vw, 11px\)/);
  assert.match(css, /admin-customers__sheet \.admin-customers__summary-metric strong,[\s\S]*font-size: clamp\(14px, 3\.8vw, 15px\)/);
  assert.match(css, /admin-customers__pagination \{[\s\S]*min-height: 56px/);
  assert.match(css, /admin-customers__sheet \.admin-customers__summary-divider \{[\s\S]*display: block[\s\S]*width: 1px[\s\S]*height: 76%/);
  assert.match(css, /@media \(max-width: 390px\) \{[\s\S]*admin-customers__customer-row \{ grid-template-columns: minmax\(0, 1fr\) 92px 26px/);
  assert.match(css, /@media \(max-width: 375px\) \{[\s\S]*admin-customers__identity-date \{[\s\S]*white-space: normal/);
});

test('Customers reuses normalized entity imagery and hides one-page pagination controls', () => {
  assert.match(table, /function ProductThumbnail/);
  assert.match(table, /function AdminOrderRecord/);
  assert.match(table, /AdminEntityImage/);
  assert.match(table, /resolveAdminPurchaseImage\(order\)/);
  assert.match(table, /loading=\{priority \? 'eager' : 'lazy'\}/);
  assert.match(table, /priority=\{index < 6\}/);
  assert.match(image, /admin-customers__order-cards/);
  assert.match(image, /key=\{normalizedSrc\}/);
  assert.match(table, /totalPages > 1/);
  assert.match(css, /admin-customers__thumb-frame/);
});

test('desktop Orders uses a presentation-only device around live detail while mobile remains a sheet', () => {
  const frame = readFileSync(new URL('./AdminDeviceFrame.jsx', import.meta.url), 'utf8');
  assert.match(table, /<AdminDeviceFrame><OrdersDetail user=\{selectedUser\} compact=\{false\}/);
  assert.match(table, /className="admin-customers__detail admin-customers__sheet admin-surface"/);
  assert.match(frame, /\{children\}/);
  assert.match(frame, /admin-device-frame__screen/);
  assert.match(frame, /admin-device-frame__hardware" aria-hidden="true"/);
  assert.match(frame, /admin-device-frame__home" aria-hidden="true"/);
  assert.doesNotMatch(frame, /Redux|API|orders|customer|useSelector|useDispatch/);
  assert.match(css, /@media \(min-width: 1201px\) \{[\s\S]*admin-device-frame/);
  assert.match(css, /admin-customers__detail \{[\s\S]*align-items: flex-start/);
  assert.match(css, /admin-device-frame \{[\s\S]*align-self: flex-start/);
  assert.doesNotMatch(table, /x: 34, scale:/);
  assert.match(css, /admin-device-frame__screen[\s\S]*overflow: hidden/);
  assert.match(css, /admin-device-frame__viewport[\s\S]*overflow: hidden; padding: 0 13px 34px; background: inherit/);
  assert.match(css, /admin-device-frame \.admin-customers__order-cards[\s\S]*padding: 0 3px 28px 0[\s\S]*scroll-padding-bottom: 28px[\s\S]*scrollbar-gutter: stable/);
});

test('Customers desktop directory polish stays scoped and retains bottom clearance', () => {
  const polish = css.slice(css.lastIndexOf('@media (min-width: 1201px)'), css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(table, /admin-customers__directory-intro/);
  assert.match(table, /totalOrderRecords/);
  assert.match(table, /filteredOrderRecords/);
  assert.match(polish, /admin-shell__main:has\(\.admin-customers\)[\s\S]*padding-bottom: 72px/);
  assert.match(polish, /admin-customers__layout \{ overflow: visible; \}/);
  assert.match(polish, /admin-customers__master[\s\S]*height: fit-content/);
  assert.match(polish, /admin-customers__customer-row\.is-selected/);
  assert.match(polish, /admin-customers__directory-summary/);
  assert.match(polish, /admin-customers__pagination[\s\S]*border: 1px solid/);
  assert.doesNotMatch(polish, /background: linear-gradient\(100deg, #0c1722, #111f2c\)/);
  assert.doesNotMatch(polish, /admin-device-frame|admin-customers__sheet|admin-customers__order-card/);
});
