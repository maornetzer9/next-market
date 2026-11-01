import { formatCategoryLabel } from '../../utils/storefrontNavigation.js';

export function buildAdminCategories(products = []) {
  const counts = new Map();

  for (const product of Array.isArray(products) ? products : []) {
    const category = String(product?.category || '').trim();
    if (!category) continue;
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  return [...counts.entries()].map(([category, productCount]) => ({
    category,
    label: formatCategoryLabel(category),
    productCount,
  }));
}

export function filterAndSortAdminCategories(categories = [], search = '', sort = 'az') {
  const query = String(search).trim().toLocaleLowerCase();
  const visible = categories.filter(({ category, label }) => {
    if (!query) return true;
    return `${label} ${category}`.toLocaleLowerCase().includes(query);
  });

  return [...visible].sort((a, b) => {
    if (sort === 'za') return b.label.localeCompare(a.label);
    if (sort === 'count') {
      return b.productCount - a.productCount || a.label.localeCompare(b.label);
    }
    return a.label.localeCompare(b.label);
  });
}
