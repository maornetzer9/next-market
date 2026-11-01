const assert = require('node:assert/strict');
const test = require('node:test');
const { User } = require('../models/user');
const { generateToken } = require('../utils/jwt');
const { authenticate, requireAdmin } = require('./auth');

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('V91 authenticate rejects missing and non-persisted sessions', async () => {
  const missingResponse = response();
  let nextCalls = 0;
  await authenticate({ headers: {} }, missingResponse, () => { nextCalls += 1; });
  assert.equal(missingResponse.statusCode, 401);
  assert.equal(nextCalls, 0);

  const originalFindById = User.findById;
  const token = generateToken({ user: { _id: '507f1f77bcf86cd799439011' } });
  User.findById = () => ({ select: async () => ({
    _id: '507f1f77bcf86cd799439011', role: 'User', token: 'different-session',
  }) });
  try {
    const staleResponse = response();
    await authenticate(
      { headers: { authorization: `Bearer ${token}` } },
      staleResponse,
      () => { nextCalls += 1; }
    );
    assert.equal(staleResponse.statusCode, 401);
    assert.equal(nextCalls, 0);
  } finally {
    User.findById = originalFindById;
  }
});

test('V91 authenticate accepts active session and Admin guard rejects normal user', async () => {
  const originalFindById = User.findById;
  const userId = '507f1f77bcf86cd799439011';
  const token = generateToken({ user: { _id: userId } });
  User.findById = () => ({ select: async () => ({ _id: userId, role: 'User', token }) });

  try {
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = response();
    let authenticated = false;
    await authenticate(req, res, () => { authenticated = true; });
    assert.equal(authenticated, true);
    assert.deepEqual(req.auth, { userId, role: 'User', token });

    const adminResponse = response();
    requireAdmin[1](req, adminResponse, () => assert.fail('normal user must not pass Admin guard'));
    assert.equal(adminResponse.statusCode, 403);
  } finally {
    User.findById = originalFindById;
  }
});
