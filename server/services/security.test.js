const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

const read = (relativePath) => readFile(path.join(__dirname, '..', relativePath), 'utf8');

test('V91 protected and Admin APIs enforce server-side authorization', async () => {
  const [userRoutes, cartRoutes, orderRoutes, productRoutes, adminRoutes] = await Promise.all([
    read('routes/user.js'),
    read('routes/cart.js'),
    read('routes/orders.js'),
    read('routes/products.js'),
    read('routes/admin.js'),
  ]);

  assert.match(userRoutes, /router\.get\('\/auth',\s*authenticate,/);
  assert.match(userRoutes, /router\.put\('\/update',\s*authenticate,/);
  assert.match(cartRoutes, /router\.use\(authenticate\)/);
  assert.match(orderRoutes, /router\.use\(authenticate\)/);
  assert.match(productRoutes, /router\.use\(requireAdmin\)/);
  assert.match(adminRoutes, /router\.use\(requireAdmin\)/);
});

test('V92 private services derive ownership from verified auth identity', async () => {
  const [userService, cartService, orderService] = await Promise.all([
    read('services/user.js'),
    read('services/cart.js'),
    read('services/orders.js'),
  ]);

  for (const source of [userService, cartService, orderService]) {
    assert.match(source, /req\.auth\.userId/);
  }
  assert.doesNotMatch(cartService, /const \{ userId[^}]*\} = req\.body/);
  assert.doesNotMatch(orderService, /const \{ _id \} = req\.query/);
  assert.doesNotMatch(orderService, /const \{ id \} = req\.body/);
});

test('V93 user serializers exclude password and persisted token by default', async () => {
  const source = await read('utils/userView.js');
  assert.match(source, /SAFE_USER_FIELDS/);
  assert.doesNotMatch(source, /password\s*:/);
  assert.match(source, /includeToken/);
});

test('V94 login endpoint has bounded abuse protection', async () => {
  const routes = await read('routes/user.js');
  assert.match(routes, /router\.post\('\/login',\s*loginRateLimit,/);
});

test('V95 service failures do not expose internal exception messages', async () => {
  const sources = await Promise.all([
    read('services/admin.js'),
    read('services/cart.js'),
    read('services/orders.js'),
    read('services/products.js'),
  ]);

  for (const source of sources) {
    assert.doesNotMatch(source, /message:\s*(?:err|error)\.message/);
  }
});

test('V100 CORS permits the checkout idempotency header', async () => {
  const server = await read('server.js');
  assert.match(server, /allowedHeaders:\s*\[[^\]]*'Content-Type'[^\]]*'Authorization'[^\]]*'Idempotency-Key'/);
});

test('Vercel Express entrypoint exports the app and lazily reuses MongoDB', async () => {
  const [server, database] = await Promise.all([
    read('server.js'),
    read('config/db.js'),
  ]);

  assert.match(server, /module\.exports = app/);
  assert.match(server, /mongooseConnection\(\)\.then\(\(\) => next\(\)\)\.catch\(next\)/);
  assert.match(database, /mongoose\.connection\.readyState === 1/);
  assert.match(database, /connectionPromise/);
  assert.match(database, /maxPoolSize:\s*10/);
  assert.match(database, /minPoolSize:\s*0/);
  assert.match(database, /maxIdleTimeMS:\s*10000/);
});
