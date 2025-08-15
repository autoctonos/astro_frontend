# Astro Frontend

A minimal storefront built with [Astro](https://astro.build) and React. It exposes a product catalog with a client-side cart and PayU checkout integration.

## Project Structure

```
/
├── public/                # Static assets
└── src/
    ├── api/               # TypeScript API clients for products and categories
    ├── components/        # React components (cart, product lists, checkout, etc.)
    ├── config/            # Site configuration
    ├── hooks/             # Reusable React hooks
    ├── layouts/           # Shared page layouts
    ├── lib/               # Utility helpers (HTTP, assets, slug helpers)
    ├── pages/             # Astro pages & API routes
    ├── stores/            # Global state (e.g., shopping cart)
    └── styles/            # Global CSS and Tailwind setup
```

## Tooling

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start a dev server at `http://localhost:4321` |
| `npm run build` | Build the production site to `dist/` |
| `npm run preview` | Preview the built site locally |
| `npm run start` | Run the built server (`node ./dist/server/entry.mjs`) |
| `npm run astro ...` | Run Astro CLI commands like `npm run astro -- --help` |

## Features

### Shopping cart

Items can be added from product pages and are stored in a [Zustand](https://github.com/pmndrs/zustand) store that persists to `localStorage`. The cart drawer allows updating quantities or removing items.

### PayU checkout

The shipping form posts to `/api/payu/prepare`, which returns the fields required by PayU. A temporary form is generated and submitted, redirecting the user to PayU for payment, after which PayU returns to `/checkout/response` with the transaction status.

