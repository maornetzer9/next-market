# NEXT / MARKET Client

React frontend for the NEXT / MARKET customer storefront and Admin interface. It consumes the companion Express API in `../server`.

## Stack

React 18, Vite 5, React Router, Redux Toolkit, Material UI, Framer Motion, and Chart.js.

## Setup

Requirements: a current LTS release of Node.js, npm, and a running backend.

```bash
npm install
```

Copy `.env.example` to `.env`, then configure:

- `VITE_ORIGIN` — required backend base URL, such as `http://localhost:3000`.

Do not commit `.env`.

## Commands

```bash
npm run dev
npm run build
npm run serve
```

- `npm run dev` starts the Vite development server.
- `npm run build` creates the production bundle in `dist`.
- `npm run serve` previews the production bundle locally.

The default development URL is `http://localhost:5173`; it must be allowed by the server's `ORIGIN` setting.
