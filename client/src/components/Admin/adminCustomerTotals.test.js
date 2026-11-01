import assert from 'node:assert/strict';
import test from 'node:test';

import { getCustomerOrderTotal, getOrderRevenue } from './adminDashboardData.js';

test('customer Total Price reuses persisted historical order revenue', () => {
  const orders = [
    { total: 49.95, price: 999, quantity: 999 },
    { total: '299.85' },
    { total: null, price: 12.5, quantity: 2 },
    { total: -1, price: 10, quantity: 3 },
    { total: 'invalid', price: 'invalid', quantity: 4 },
  ];

  assert.equal(getOrderRevenue(orders[0]), 49.95);
  assert.equal(getCustomerOrderTotal({ orders }), 404.8);
  assert.equal(getCustomerOrderTotal({ orders: [] }), 0);
  assert.equal(getCustomerOrderTotal({}), 0);
});
