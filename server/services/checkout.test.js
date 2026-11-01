const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const { createNewOrderService } = require('./orders');
const ordersSchema = require('../models/orders');

const clone = (value) => structuredClone(value);

const queryWithSession = (resolve) => ({
  session: (session) => Promise.resolve(resolve(session)),
});

class FakeCheckoutDatabase {
  constructor({ users, products }) {
    this.state = {
      users: new Map(users.map((user) => [user._id, clone(user)])),
      products: new Map(products.map((product) => [product.id, clone(product)])),
      receipts: new Set(),
    };
    this.lock = Promise.resolve();
    this.releaseLock = null;
    this.reservationCalls = 0;
    this.receiptCreates = 0;
    this.failAfterReservation = null;
    this.transientFailures = 0;
    this.sessionStarts = 0;
  }

  cloneState() {
    return {
      users: new Map([...this.state.users].map(([key, value]) => [key, clone(value)])),
      products: new Map([...this.state.products].map(([key, value]) => [key, clone(value)])),
      receipts: new Set(this.state.receipts),
    };
  }

  async startSession() {
    this.sessionStarts += 1;
    const database = this;
    return {
      state: null,
      async withTransaction(work) {
        if (database.transientFailures > 0) {
          database.transientFailures -= 1;
          const error = new Error('write conflict');
          error.code = 112;
          throw error;
        }

        const previous = database.lock;
        let release;
        database.lock = new Promise((resolve) => { release = resolve; });
        await previous;
        this.state = database.cloneState();

        try {
          await work();
          for (const user of this.state.users.values()) delete user.save;
          database.state = this.state;
        } finally {
          release();
        }
      },
      async endSession() {},
    };
  }

  dependencies() {
    const database = this;
    const UserModel = {
      findById(userId) {
        return queryWithSession((session) => {
          const user = session.state.users.get(userId);
          if (!user) return null;
          user.save = async ({ session: saveSession }) => {
            assert.equal(saveSession, session);
            session.state.users.set(userId, user);
          };
          return user;
        });
      },
    };

    const ProductsModel = {
      async findOneAndUpdate(filter, update, options) {
        const product = options.session.state.products.get(filter.id);
        if (!product || product.stock < filter.stock.$gte) return null;

        product.stock += update.$inc.stock;
        product.bought = Number(product.bought || 0) + update.$inc.bought;
        product.purchases = [...(product.purchases || []), clone(update.$push.purchases)];
        database.reservationCalls += 1;

        if (database.failAfterReservation === database.reservationCalls) {
          throw new Error('simulated failure after reservation');
        }

        return product;
      },
      findOne({ id }) {
        return queryWithSession((session) => session.state.products.get(id) || null);
      },
    };

    const CheckoutRequestModel = {
      findOne({ userId, keyHash }) {
        return queryWithSession((session) => (
          session.state.receipts.has(`${userId}:${keyHash}`) ? { userId, keyHash } : null
        ));
      },
      async create([receipt], { session }) {
        const key = `${receipt.userId}:${receipt.keyHash}`;
        if (session.state.receipts.has(key)) {
          const error = new Error('duplicate idempotency key');
          error.code = 11000;
          throw error;
        }
        session.state.receipts.add(key);
        database.receiptCreates += 1;
      },
    };

    return {
      UserModel,
      ProductsModel,
      CheckoutRequestModel,
      mongooseInstance: { startSession: () => database.startSession() },
    };
  }
}

const makeUser = (id, items) => ({
  _id: id,
  firstName: `User-${id}`,
  lastName: 'Checkout',
  createAt: '30/10/2026, 10:00:00',
  orders: [],
  cart: {
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    items,
  },
});

const makeItem = (id, quantity = 1) => ({
  id,
  title: `Cart product ${id}`,
  category: 'test',
  price: 10,
  quantity,
  thumbnail: `product-${id}.png`,
});

const makeProduct = (id, stock = 5) => ({
  id,
  title: `Product ${id}`,
  category: 'test',
  price: 10,
  stock,
  bought: 0,
  purchases: [],
  thumbnail: `product-${id}.png`,
});

const makeRequest = (userId, key) => ({
  auth: { userId },
  headers: { 'idempotency-key': key },
});

test('V96 successful checkout commits stock, order snapshot, receipt, and cart clear', async () => {
  const database = new FakeCheckoutDatabase({
    users: [makeUser('user-1', [makeItem(1, 2)])],
    products: [makeProduct(1, 5)],
  });
  const checkout = createNewOrderService(database.dependencies());

  const result = await checkout(makeRequest('user-1', 'checkout-success-1'));

  assert.equal(result.code, 200);
  assert.equal(database.state.products.get(1).stock, 3);
  assert.equal(database.state.users.get('user-1').orders[0].quantity, 2);
  assert.deepEqual(database.state.users.get('user-1').cart, { total: 0, items: [] });
  assert.equal(database.state.receipts.size, 1);
});

test('V97 insufficient stock aborts without changing stock, orders, receipts, or cart', async () => {
  const database = new FakeCheckoutDatabase({
    users: [makeUser('user-1', [makeItem(1, 2)])],
    products: [makeProduct(1, 1)],
  });
  const checkout = createNewOrderService(database.dependencies());

  const result = await checkout(makeRequest('user-1', 'checkout-stock-1'));

  assert.equal(result.code, 400);
  assert.equal(result.message, 'Stock Is Not Available');
  assert.equal(database.state.products.get(1).stock, 1);
  assert.equal(database.state.users.get('user-1').orders.length, 0);
  assert.equal(database.state.users.get('user-1').cart.items.length, 1);
  assert.equal(database.state.receipts.size, 0);
});

test('V96 failure midway rolls back every earlier product reservation', async () => {
  const database = new FakeCheckoutDatabase({
    users: [makeUser('user-1', [makeItem(1), makeItem(2)])],
    products: [makeProduct(1, 2), makeProduct(2, 2)],
  });
  database.failAfterReservation = 2;
  const checkout = createNewOrderService(database.dependencies());

  const result = await checkout(makeRequest('user-1', 'checkout-rollback-1'));

  assert.equal(result.code, 500);
  assert.equal(database.state.products.get(1).stock, 2);
  assert.equal(database.state.products.get(2).stock, 2);
  assert.equal(database.state.users.get('user-1').orders.length, 0);
  assert.equal(database.state.users.get('user-1').cart.items.length, 2);
  assert.equal(database.state.receipts.size, 0);
});

test('V97 two concurrent buyers cannot oversell one remaining unit', async () => {
  const database = new FakeCheckoutDatabase({
    users: [
      makeUser('user-1', [makeItem(1)]),
      makeUser('user-2', [makeItem(1)]),
    ],
    products: [makeProduct(1, 1)],
  });
  const checkout = createNewOrderService(database.dependencies());

  const results = await Promise.all([
    checkout(makeRequest('user-1', 'checkout-buyer-1')),
    checkout(makeRequest('user-2', 'checkout-buyer-2')),
  ]);

  assert.deepEqual(results.map((result) => result.code).sort(), [200, 400]);
  assert.equal(database.state.products.get(1).stock, 0);
  const orderCount = [...database.state.users.values()]
    .reduce((total, user) => total + user.orders.length, 0);
  assert.equal(orderCount, 1);
  assert.equal([...database.state.users.values()].filter((user) => user.cart.items.length === 0).length, 1);
});

test('V98 repeated idempotency key returns success without duplicate order or stock deduction', async () => {
  const database = new FakeCheckoutDatabase({
    users: [makeUser('user-1', [makeItem(1)])],
    products: [makeProduct(1, 3)],
  });
  const checkout = createNewOrderService(database.dependencies());
  const request = makeRequest('user-1', 'checkout-repeat-1');

  const first = await checkout(request);
  const second = await checkout(request);

  assert.equal(first.code, 200);
  assert.equal(first.idempotent, false);
  assert.equal(second.code, 200);
  assert.equal(second.idempotent, true);
  assert.equal(database.state.products.get(1).stock, 2);
  assert.equal(database.state.users.get('user-1').orders[0].quantity, 1);
  assert.equal(database.state.receipts.size, 1);
});

test('V99 cart is cleared only after a successful transaction commit', async () => {
  const failedDatabase = new FakeCheckoutDatabase({
    users: [makeUser('failed', [makeItem(1)])],
    products: [makeProduct(1, 1)],
  });
  failedDatabase.failAfterReservation = 1;
  const failedCheckout = createNewOrderService(failedDatabase.dependencies());
  await failedCheckout(makeRequest('failed', 'checkout-cart-failure'));

  const successDatabase = new FakeCheckoutDatabase({
    users: [makeUser('success', [makeItem(1)])],
    products: [makeProduct(1, 1)],
  });
  const successfulCheckout = createNewOrderService(successDatabase.dependencies());
  await successfulCheckout(makeRequest('success', 'checkout-cart-success'));

  assert.equal(failedDatabase.state.users.get('failed').cart.items.length, 1);
  assert.equal(successDatabase.state.users.get('success').cart.items.length, 0);
});

test('V99 surfaced write conflict receives a bounded retry and then commits once', async () => {
  const database = new FakeCheckoutDatabase({
    users: [makeUser('user-1', [makeItem(1)])],
    products: [makeProduct(1, 2)],
  });
  database.transientFailures = 1;
  const checkout = createNewOrderService(database.dependencies());

  const result = await checkout(makeRequest('user-1', 'checkout-retry-1'));

  assert.equal(result.code, 200);
  assert.equal(database.sessionStarts, 2);
  assert.equal(database.state.products.get(1).stock, 1);
  assert.equal(database.state.receipts.size, 1);
});

test('V101 an order snapshot remains valid when optional catalog media is absent', () => {
  const OrderSnapshot = mongoose.models.CheckoutSnapshotTest
    || mongoose.model('CheckoutSnapshotTest', ordersSchema.clone());
  const snapshot = new OrderSnapshot({
    id: 1,
    title: 'No-media product',
    fullName: 'Checkout QA',
    price: 1,
    total: 1,
    quantity: 1,
  });

  assert.equal(snapshot.validateSync(), undefined);
  assert.equal(snapshot.thumbnail, '');
});
