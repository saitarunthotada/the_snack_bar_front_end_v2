# The Snack Bar — Frontend

React + Vite frontend for The Snack Bar ordering system.

## Quick Start

```bash
npm install
npm run dev
```

The dev server proxies `/api` requests to `http://localhost:8080` automatically.

## Environment

Copy `.env.example` to `.env` and set `VITE_API_URL` if your backend runs on a different host/port.

```
VITE_API_URL=http://localhost:8080/api
```

For **production builds**, set `VITE_API_URL` to your deployed backend URL.

## Structure

```
src/
  services/api.js          # All API calls, fully typed with comments
  context/
    CartContext.jsx         # Global cart state
    AuthContext.jsx         # Admin JWT auth
  components/              # Shared UI components
  pages/
    customer/              # Store, Cart, Checkout, OrderSuccess
    admin/                 # Login, Dashboard, Products, Orders
```

## API Mapping

### Customer Flow
| Action | Endpoint |
|--------|----------|
| Get products | `GET /api/products?page=0&size=20` |
| Create cart | `POST /api/carts` → returns UUID |
| Add to cart | `POST /api/carts/{cartId}/items` |
| View cart | `GET /api/carts/{cartId}` |
| Place order | `POST /api/orders/{cartId}` |

### Admin Flow (requires JWT Bearer token)
| Action | Endpoint |
|--------|----------|
| Login | `POST /api/auth/login` |
| List products | `GET /api/admin/sudheer/365/products` |
| Create product | `POST /api/admin/sudheer/365/products` (multipart) |
| Update product | `PATCH /api/admin/sudheer/365/products/{id}` (multipart) |
| Delete product | `DELETE /api/admin/sudheer/365/products/{id}` |
| Update inventory | `PATCH /api/admin/sudheer/365/products/{id}/inventory` |
| List orders | `GET /api/admin/sudheer/365/orders` |
| Update order status | `PATCH /api/admin/sudheer/365/orders/{id}` |

## Notes

- Product images are **admin-only** (create/update via admin panel). Customer store only displays images.
- Cart is persisted to `localStorage` by `cartId`. After order is placed, cart resets.
- Admin JWT is stored in `localStorage` as `admin_token`.
- The admin base path `/api/admin/sudheer/365` matches the backend `@RequestMapping`.
