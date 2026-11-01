const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongooseConnection = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { securityHeaders } = require('./middleware/security');

dotenv.config();

const { userRouter } = require('./routes/user');
const { productsRouter } = require('./routes/products');
const { cartRouter } = require('./routes/cart');
const { ordersRouter } = require('./routes/orders');
const { adminRouter } = require('./routes/admin');

const PORT = 3000;
const app = express();
const allowedOrigins = String(process.env.ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error('Origin not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  optionsSuccessStatus: 204,
};

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use((req, res, next) => {
  try {
    assertEnvironment();
  } catch (error) {
    return next(error);
  }
  return mongooseConnection().then(() => next()).catch(next);
});

app.use('/user', userRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/cart', cartRouter);
app.use('/admin', adminRouter);
app.use(errorHandler);

const assertEnvironment = () => {
  const requiredNames = ['ORIGIN', 'MONGOOSE_URI', 'SECRET_KEY'];
  const missing = requiredNames.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
};

const start = async () => {
  assertEnvironment();
  await mongooseConnection();
  return app.listen(PORT, () => console.info(`Server is running on port ${PORT}`));
};

if (require.main === module) {
  start().catch(() => {
    console.error('Server startup failed');
    process.exitCode = 1;
  });
}

// Vercel imports the Express application as one Node.js Function.
module.exports = app;
module.exports.app = app;
module.exports.start = start;
module.exports.assertEnvironment = assertEnvironment;
