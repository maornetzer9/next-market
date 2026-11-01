/** Shared Admin destinations — mirrors existing /admin routes only. */

export const ADMIN_DESTINATIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    to: '/admin',
    end: true,
    description: 'Store overview and quick links to admin sections.',
  },
  {
    id: 'categories',
    label: 'Categories',
    shortLabel: 'Categories',
    to: '/admin/categories',
    description: 'Add, edit, or remove product categories.',
  },
  {
    id: 'customers',
    label: 'Customers',
    shortLabel: 'Customers',
    to: '/admin/customers',
    description: 'View customers, join dates, and purchase history.',
  },
  {
    id: 'products',
    label: 'Products',
    shortLabel: 'Products',
    to: '/admin/products',
    description: 'Search, filter, and update store products.',
  },
  {
    id: 'statistics',
    label: 'Statistics',
    shortLabel: 'Stats',
    to: '/admin/statistics',
    description: 'Category and customer quantity charts.',
  },
];

export const ADMIN_PRIMARY_NAV = ADMIN_DESTINATIONS;

/** Mobile bottom nav — Products centered as elevated FAB (matches refs). */
export const ADMIN_MOBILE_NAV = [
  ADMIN_DESTINATIONS.find((d) => d.id === 'dashboard'),
  ADMIN_DESTINATIONS.find((d) => d.id === 'categories'),
  ADMIN_DESTINATIONS.find((d) => d.id === 'products'),
  ADMIN_DESTINATIONS.find((d) => d.id === 'customers'),
  ADMIN_DESTINATIONS.find((d) => d.id === 'statistics'),
].filter(Boolean);

export const ADMIN_LANDING_TILES = ADMIN_DESTINATIONS.filter(
  (item) => item.id !== 'dashboard',
);

export function getAdminBreadcrumbLabel(pathname) {
  const match = ADMIN_DESTINATIONS.find((item) => {
    if (item.end) return pathname === '/admin' || pathname === '/admin/';
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  });
  return match?.label ?? 'Admin';
}
