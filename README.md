# NEXT / MARKET

NEXT / MARKET is a full-stack commerce platform with a responsive customer storefront and a dedicated administration workspace. It combines catalog browsing, account management, cart and order workflows with inventory, customer, category, and sales-management tools.

## Highlights

- Responsive storefront with product discovery, filtering, favorites, cart, checkout, order history, and account management
- Role-separated Admin workspace for dashboard metrics, categories, customers, products, and statistics
- Light and dark themes across desktop and mobile layouts
- JWT authentication with server-side authorization and session restoration
- Ownership-protected customer data and sanitized API responses
- Atomic, idempotent checkout with transactional inventory updates and oversell protection
- Production-oriented CORS, security headers, validation, rate limiting, and error handling

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | React 18, Vite, React Router, Redux Toolkit, Material UI, Framer Motion, Chart.js |
| Backend | Node.js, Express, Mongoose, JSON Web Tokens, bcrypt |
| Database | MongoDB Atlas |
| Hosting target | Vercel frontend and Node.js API projects |

## Repository structure

```text
client/   React storefront and Admin interface
server/   Express API, MongoDB models, services, and tests
```

The frontend and API are designed to deploy as separate Vercel projects. This keeps browser configuration, server secrets, scaling, and CORS boundaries explicit.

## Local development

### Requirements

- Node.js 26 LTS
- npm
- A MongoDB deployment that supports transactions

Install each workspace independently:

```bash
cd server
npm install
npm start
```

```bash
cd client
npm install
npm run dev
```

Create local `.env` files from the included `.env.example` templates. Required variable names are:

- Client: `VITE_ORIGIN`
- Server: `ORIGIN`, `MONGOOSE_URI`, `SECRET_KEY`

Never commit populated environment files or credentials.

## Verification

```bash
cd server
npm test
```

```bash
cd client
node --test
npm run build
```

The server suite covers authentication, authorization, data ownership, checkout rollback, concurrent stock protection, and idempotency. The client suite covers routing, storefront behavior, Admin data presentation, responsive composition, and accessibility-oriented UI contracts.

## Deployment

The intended production layout is:

- Frontend project: `next-market`
- API project: `next-market-api`
- Database: MongoDB Atlas replica set
- Runtime: Node.js 26 LTS

Deployment credentials and environment values belong in the hosting provider's encrypted environment settings, never in source control.

## Additional documentation

- [Frontend setup](client/README.md)
- [API setup and maintenance](server/README.md)

## License

No public license has been selected yet. All rights are reserved unless a license is added by the repository owner.
