const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Products = require('../models/products');
const CheckoutRequest = require('../models/checkoutRequest');
const { User } = require('../models/user');
const israelTime = require('../utils/dateFormat');
const { toSafeUser } = require('../utils/userView');

const ORDER_USER_FIELDS = ['_id', 'firstName', 'lastName', 'username', 'orders', 'checked', 'createAt'];
const MAX_TRANSACTION_ATTEMPTS = 3;
const TRANSACTION_OPTIONS = {
  readConcern: { level: 'snapshot' },
  writeConcern: { w: 'majority' },
  readPreference: 'primary',
  maxCommitTimeMS: 10000,
};

class CheckoutError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.publicMessage = message;
  }
}

const withSession = (query, session) => (
  typeof query?.session === 'function' ? query.session(session) : query
);

const getIdempotencyKey = (req) => {
  const value = req.get?.('Idempotency-Key') ?? req.headers?.['idempotency-key'];
  if (typeof value !== 'string') return '';
  const key = value.trim();
  return key.length >= 8 && key.length <= 128 && /^[A-Za-z0-9._:-]+$/.test(key) ? key : '';
};

const hashIdempotencyKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

const isRetryableTransactionError = (error) => (
  error?.code === 11000
  || error?.code === 112
  || error?.code === 244
  || error?.code === 251
  || error?.hasErrorLabel?.('TransientTransactionError')
  || error?.hasErrorLabel?.('UnknownTransactionCommitResult')
);

const normalizeCartLines = (items) => {
  const lines = new Map();

  for (const item of items) {
    const id = Number(item?.id);
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1) {
      throw new CheckoutError(400, 'Invalid cart item');
    }

    const existing = lines.get(id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      lines.set(id, { item, id, quantity });
    }
  }

  return [...lines.values()];
};

const createNewOrderService = ({
  UserModel = User,
  ProductsModel = Products,
  CheckoutRequestModel = CheckoutRequest,
  mongooseInstance = mongoose,
  transactionAttempts = MAX_TRANSACTION_ATTEMPTS,
} = {}) => async (req) => {
  const userId = req.auth.userId;
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) {
    return { code: 400, message: 'A valid Idempotency-Key header is required' };
  }

  const keyHash = hashIdempotencyKey(idempotencyKey);

  for (let attempt = 1; attempt <= transactionAttempts; attempt += 1) {
    const session = await mongooseInstance.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        const user = await withSession(UserModel.findById(userId), session);
        if (!user) throw new CheckoutError(404, 'User Not Found');

        const priorRequest = await withSession(
          CheckoutRequestModel.findOne({ userId, keyHash }),
          session
        );
        if (priorRequest) {
          result = {
            code: 200,
            orders: user.orders,
            cart: user.cart,
            idempotent: true,
          };
          return;
        }

        const cartItems = Array.isArray(user.cart?.items) ? user.cart.items : [];
        if (cartItems.length === 0) throw new CheckoutError(400, 'Cart Is Empty');

        const lines = normalizeCartLines(cartItems);
        const reservedProducts = [];

        // MongoDB transactions do not support parallel operations on one session.
        for (const line of lines) {
          const purchase = {
            name: user.firstName,
            quantity: line.quantity,
            date: israelTime,
          };
          const product = await ProductsModel.findOneAndUpdate(
            { id: line.id, stock: { $gte: line.quantity } },
            {
              $inc: { stock: -line.quantity, bought: line.quantity },
              $push: { purchases: purchase },
            },
            { new: true, session }
          );

          if (!product) {
            const existingProduct = await withSession(ProductsModel.findOne({ id: line.id }), session);
            if (!existingProduct) throw new CheckoutError(404, 'Product Not Found');
            throw new CheckoutError(400, 'Stock Is Not Available');
          }

          reservedProducts.push({ line, product });
        }

        for (const { line, product } of reservedProducts) {
          const index = user.orders.findIndex((order) => order.id === line.id);
          const total = Number(product.price) * line.quantity;

          if (index !== -1) {
            user.orders[index].quantity += line.quantity;
            user.orders[index].total += total;
          } else {
            const cartSnapshot = typeof line.item.toObject === 'function'
              ? line.item.toObject()
              : line.item;
            user.orders.push({
              ...cartSnapshot,
              id: line.id,
              title: product.title,
              fullName: `${user.firstName} ${user.lastName}`,
              joinedAt: user.createAt,
              quantity: line.quantity,
              category: line.item.category,
              thumbnail: String(line.item.thumbnail || product.thumbnail || '').trim(),
              price: product.price,
              total,
            });
          }
        }

        user.cart = { total: 0, items: [] };
        await user.save({ session });
        await CheckoutRequestModel.create([{ userId, keyHash }], { session });

        result = {
          code: 200,
          orders: user.orders,
          cart: user.cart,
          idempotent: false,
        };
      }, TRANSACTION_OPTIONS);

      return result;
    } catch (error) {
      if (error instanceof CheckoutError) {
        return { code: error.code, message: error.publicMessage };
      }
      if (isRetryableTransactionError(error) && attempt < transactionAttempts) {
        continue;
      }
      console.error('Failed To Add New Order', error.message);
      return { code: 500, message: 'Internal server error' };
    } finally {
      await session.endSession();
    }
  }

  return { code: 503, message: 'Checkout could not be completed. Please retry.' };
};

const newOrder = createNewOrderService();

const loadOrders = async (req) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId).select(ORDER_USER_FIELDS.join(' '));
    if (!user) return { code: 400, message: 'User Not Found' };

    const users = await User.find({ checked: true, _id: { $ne: userId } })
      .select(ORDER_USER_FIELDS.join(' '));

    return {
      code: 200,
      user: toSafeUser(user, { fields: ORDER_USER_FIELDS }),
      users: users.map((entry) => toSafeUser(entry, { fields: ORDER_USER_FIELDS })),
    };
  } catch (err) {
    console.error('Failed To Load Users Orders', err.message);
    return { code: 500, message: 'Internal server error' };
  }
};

module.exports = {
  CheckoutError,
  createNewOrderService,
  getIdempotencyKey,
  hashIdempotencyKey,
  loadOrders,
  newOrder,
};
