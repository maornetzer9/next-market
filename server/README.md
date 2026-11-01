# NEXT / MARKET Server

Express and MongoDB API for NEXT / MARKET authentication, users, products, carts, orders, and Admin data.

## Stack

Node.js, Express, Mongoose, MongoDB, JSON Web Tokens, and bcrypt.

## Setup

Requirements: a current LTS release of Node.js, npm, and an accessible MongoDB database.

```bash
npm install
```

Copy `.env.example` to `.env`, then configure:

- `ORIGIN` — required browser origin allowlist for CORS; comma-separated origins are supported.
- `MONGOOSE_URI` — required MongoDB connection string.
- `SECRET_KEY` — required JWT signing and verification secret.

Keep `.env` private and never commit it.

## Commands

```bash
npm start
npm run dev
npm test
```

- `npm start` runs the API with Node on port `3000`.
- `npm run dev` runs the API with Nodemon.
- `npm test` runs the retained server unit and maintenance-script tests.

## Operational scripts

- `node scripts/reconcile-products.js` performs a read-only product reconciliation dry run. Use `--apply` only for an explicitly reviewed maintenance operation; apply mode writes ignored backup/audit output under `implementation-results`.
- `node scripts/backfill-reviews-count.js` backfills product review counts and requires `MONGOOSE_URI`. Run it only as an intentional database maintenance operation.
- `node --test scripts/reconcile-products.test.js` runs the reconciliation-script tests directly.
