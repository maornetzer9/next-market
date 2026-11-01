const parseOrderDate = (order) => {
  const value = order?.joinedAt || order?.createAt;
  const persistedMatch = String(value || '').match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (persistedMatch) {
    const [, day, month, year, hour = '0', minute = '0', second = '0'] = persistedMatch;
    const persistedTimestamp = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ).getTime();
    return Number.isFinite(persistedTimestamp) ? persistedTimestamp : null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const getOrderRevenue = (order) => {
  const persistedTotal = order?.total;
  const hasPersistedTotal = persistedTotal !== null && persistedTotal !== undefined && String(persistedTotal).trim() !== '';
  const total = Number(persistedTotal);
  if (hasPersistedTotal && Number.isFinite(total) && total >= 0) return total;

  const price = Number(order?.price);
  const quantity = Number(order?.quantity);
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return 0;
  return Math.max(0, price * quantity);
};

export const getCustomerOrderTotal = (user) => {
  const orders = Array.isArray(user?.orders) ? user.orders : [];
  return orders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
};

const getCustomerName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
  user?.username ||
  'Customer';

const formatSeriesLabel = (timestamp) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(timestamp)
  );

const formatRangeDate = (timestamp) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));

export function buildAdminDashboardData(products = [], users = []) {
  const customersWithOrders = users.filter(
    (user) => Array.isArray(user?.orders) && user.orders.length > 0
  );
  const orders = [];
  const revenueByDate = new Map();
  const productSales = new Map();
  let units = 0;
  let revenue = 0;

  customersWithOrders.forEach((user) => {
    user.orders.forEach((order, orderIndex) => {
      const quantity = Math.max(0, Number(order?.quantity) || 0);
      const orderRevenue = getOrderRevenue(order);
      const timestamp = parseOrderDate(order);
      const customerName = getCustomerName(user);
      const title = order?.title || 'Product';
      const orderRecord = {
        ...order,
        customerName,
        quantity,
        revenue: orderRevenue,
        timestamp,
        key: `${user?._id || user?.username || customerName}-${order?._id || order?.id || orderIndex}`,
      };

      orders.push(orderRecord);
      units += quantity;
      revenue += orderRevenue;

      if (timestamp !== null) {
        const dateKey = new Date(timestamp).toISOString().slice(0, 10);
        const current = revenueByDate.get(dateKey) || {
          timestamp: new Date(`${dateKey}T00:00:00`).getTime(),
          value: 0,
        };
        current.value += orderRevenue;
        revenueByDate.set(dateKey, current);
      }

      const productKey = String(order?.id ?? title);
      const currentProduct = productSales.get(productKey) || {
        key: productKey,
        title,
        thumbnail: order?.thumbnail || '',
        units: 0,
        revenue: 0,
      };
      currentProduct.units += quantity;
      currentProduct.revenue += orderRevenue;
      if (!currentProduct.thumbnail && order?.thumbnail) {
        currentProduct.thumbnail = order.thumbnail;
      }
      productSales.set(productKey, currentProduct);
    });
  });

  orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const revenueSeries = [...revenueByDate.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((point) => ({ ...point, label: formatSeriesLabel(point.timestamp) }));

  const topProducts = [...productSales.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, 5);

  const categoryCounts = new Map();
  products.forEach((product) => {
    const category = String(product?.category || '').trim();
    if (!category) return;
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });
  const catalogMix = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);

  const validTimestamps = orders
    .map((order) => order.timestamp)
    .filter((timestamp) => timestamp !== null)
    .sort((a, b) => a - b);
  const firstDate = validTimestamps[0];
  const lastDate = validTimestamps[validTimestamps.length - 1];
  const dateRange = firstDate
    ? firstDate === lastDate
      ? formatRangeDate(firstDate)
      : `${formatRangeDate(firstDate)} – ${formatRangeDate(lastDate)}`
    : 'All available data';

  return {
    metrics: {
      products: products.length,
      orders: orders.length,
      customers: customersWithOrders.length,
      revenue,
      units,
    },
    dateRange,
    revenueSeries,
    recentOrders: orders.slice(0, 5),
    topProducts,
    catalogMix,
  };
}
