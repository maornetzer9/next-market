import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_ANALYTICS_COLORS, buildAdminStatisticsData } from "./adminStatisticsData.js";

const users = [
  {
    _id: "a",
    firstName: "Ada",
    lastName: "Lovelace",
    orders: [
      { category: "beauty", quantity: 3, total: 30 },
      { category: "furniture", quantity: 2, price: 12, total: undefined },
    ],
  },
  {
    _id: "b",
    firstName: "Grace",
    lastName: "Hopper",
    orders: [{ category: "beauty", quantity: 4, total: 44 }],
  },
  { _id: "c", firstName: "No", lastName: "Orders", orders: [] },
];

test("Statistics derives truthful KPI and category totals from purchase records", () => {
  const result = buildAdminStatisticsData(users);
  assert.deepEqual(result.metrics, {
    orderRecords: 3,
    customersWithOrders: 2,
    units: 9,
    revenue: 98,
  });
  assert.equal(result.categorizedUnits, 9);
  assert.deepEqual(
    result.categories.map(({ name, quantity, color }) => ({ name, quantity, color })),
    [
      { name: "beauty", quantity: 7, color: ADMIN_ANALYTICS_COLORS[0] },
      { name: "furniture", quantity: 2, color: ADMIN_ANALYTICS_COLORS[1] },
    ]
  );
});

test("Statistics builds the customer/category matrix without synthetic segments", () => {
  const result = buildAdminStatisticsData(users);
  assert.deepEqual(result.customers.map(({ label, units, orderRecords }) => ({ label, units, orderRecords })), [
    { label: "Ada Lovelace", units: 5, orderRecords: 2 },
    { label: "Grace Hopper", units: 4, orderRecords: 1 },
  ]);
  assert.equal(result.customers[0].byCategory.get("beauty"), 3);
  assert.equal(result.customers[0].byCategory.get("furniture"), 2);
  assert.equal(result.customers[1].byCategory.get("furniture"), undefined);
});

test("Statistics insights report real leaders and handle ties", () => {
  const result = buildAdminStatisticsData(users);
  assert.match(result.insights[0].title, /Beauty leads category volume/);
  assert.match(result.insights[1].title, /Ada Lovelace has the highest recorded quantity/);

  const tied = buildAdminStatisticsData([
    { firstName: "A", orders: [{ category: "one", quantity: 2, total: 2 }] },
    { firstName: "B", orders: [{ category: "two", quantity: 2, total: 2 }] },
  ]);
  assert.match(tied.insights[0].title, /2 categories share the lead/);
  assert.match(tied.insights[1].title, /2 customers share the quantity lead/);
});

test("Statistics empty state has no misleading leaders", () => {
  const result = buildAdminStatisticsData([]);
  assert.equal(result.hasData, false);
  assert.deepEqual(result.insights, []);
  assert.equal(result.categorizedUnits, 0);
});
