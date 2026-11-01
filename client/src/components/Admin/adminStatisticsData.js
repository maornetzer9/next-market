import { getOrderRevenue } from "./adminDashboardData.js";

export const ADMIN_ANALYTICS_COLORS = [
  "#ff512f",
  "#168cff",
  "#8f4dff",
  "#08c7c4",
  "#f34f9d",
  "#ffc43d",
  "#00c97a",
];

const positiveQuantity = (value) => Math.max(0, Number(value) || 0);

const categoryLabel = (value) =>
  String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const customerName = (user, index) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
  user?.username ||
  `Customer ${index + 1}`;

function uniqueCustomerLabels(customers) {
  const counts = new Map();
  return customers.map((customer) => {
    const seen = (counts.get(customer.label) || 0) + 1;
    counts.set(customer.label, seen);
    return { ...customer, label: seen === 1 ? customer.label : `${customer.label} · ${seen}` };
  });
}

function leaders(items, valueKey) {
  const maximum = Math.max(0, ...items.map((item) => item[valueKey]));
  return maximum > 0 ? items.filter((item) => item[valueKey] === maximum) : [];
}

export function buildAdminStatisticsData(users = []) {
  const categoryTotals = new Map();
  const customers = [];
  let orderRecords = 0;
  let units = 0;
  let revenue = 0;

  (Array.isArray(users) ? users : []).forEach((user, userIndex) => {
    const orders = Array.isArray(user?.orders) ? user.orders : [];
    if (!orders.length) return;

    const byCategory = new Map();
    let customerUnits = 0;

    orders.forEach((order) => {
      const quantity = positiveQuantity(order?.quantity);
      const category = String(order?.category || "").trim();
      orderRecords += 1;
      units += quantity;
      customerUnits += quantity;
      revenue += getOrderRevenue(order);

      if (!category || quantity <= 0) return;
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + quantity);
      byCategory.set(category, (byCategory.get(category) || 0) + quantity);
    });

    customers.push({
      key: String(user?._id || user?.username || `${userIndex}`),
      label: customerName(user, userIndex),
      units: customerUnits,
      orderRecords: orders.length,
      byCategory,
    });
  });

  const categories = [...categoryTotals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, quantity], index) => ({
      name,
      label: categoryLabel(name),
      quantity,
      color: ADMIN_ANALYTICS_COLORS[index % ADMIN_ANALYTICS_COLORS.length],
    }));
  const categorizedUnits = categories.reduce((sum, category) => sum + category.quantity, 0);
  const namedCustomers = uniqueCustomerLabels(customers);
  const topCategories = leaders(categories, "quantity");
  const topCustomers = leaders(namedCustomers, "units");
  const insights = [];

  if (topCategories.length === 1) {
    const top = topCategories[0];
    const share = categorizedUnits ? Math.round((top.quantity / categorizedUnits) * 100) : 0;
    insights.push({
      id: "category",
      tone: "orange",
      title: `${top.label} leads category volume`,
      body: `${top.quantity.toLocaleString()} of ${categorizedUnits.toLocaleString()} categorized units (${share}%).`,
    });
  } else if (topCategories.length > 1) {
    insights.push({
      id: "category",
      tone: "orange",
      title: `${topCategories.length} categories share the lead`,
      body: `${topCategories.map((item) => item.label).join(", ")} recorded ${topCategories[0].quantity.toLocaleString()} units each.`,
    });
  }

  if (topCustomers.length === 1) {
    const top = topCustomers[0];
    insights.push({
      id: "customer",
      tone: "blue",
      title: `${top.label} has the highest recorded quantity`,
      body: `${top.units.toLocaleString()} units across ${top.orderRecords.toLocaleString()} purchase records.`,
    });
  } else if (topCustomers.length > 1) {
    insights.push({
      id: "customer",
      tone: "blue",
      title: `${topCustomers.length} customers share the quantity lead`,
      body: `${topCustomers.map((item) => item.label).join(", ")} recorded ${topCustomers[0].units.toLocaleString()} units each.`,
    });
  }

  if (orderRecords > 0) {
    insights.push({
      id: "volume",
      tone: "purple",
      title: `${units.toLocaleString()} recorded units`,
      body: `${orderRecords.toLocaleString()} purchase records across ${namedCustomers.length.toLocaleString()} customers with orders.`,
    });
  }

  return {
    metrics: { orderRecords, customersWithOrders: namedCustomers.length, units, revenue },
    categories,
    categorizedUnits,
    customers: namedCustomers,
    insights,
    hasData: orderRecords > 0,
  };
}
