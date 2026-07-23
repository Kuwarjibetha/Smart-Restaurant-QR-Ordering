# Smart Restaurant QR Ordering — Frontend

This frontend provides the customer and admin user experience for the QR
ordering app. It is built with plain HTML, CSS, and vanilla JavaScript, and
connects to the backend API for data, authentication, and live updates.

This is the canonical frontend directory. The local duplicate `frontend 5/`
is ignored by Git and is not used for development or deployment.

## What this frontend includes

- Customer menu and cart pages
- Order status tracking for customers
- Admin login, dashboard, menu management, and analytics
- AI recommendation and dietary question support
- Local table-specific cart storage in `localStorage`
- Socket.io live updates for order status and kitchen notifications

## How to run

From the `frontend/` folder:

```bash
python3 -m http.server 3000
```

Then open one of the pages:

- Customer menu: `http://localhost:3000/customer/menu.html?table=1`
- Admin login: `http://localhost:3000/admin/login.html`

> The frontend must be served over HTTP (or HTTPS), not opened with `file://`.
> This ensures fetch requests and Socket.io work properly.

## Required backend configuration

The frontend assumes the backend API is available at `http://localhost:5000`.
If your backend runs elsewhere, update:

- `frontend/js/api.js` → `API_BASE`
- `frontend/js/socketClient.js` → `SOCKET_URL`

Also make sure the backend `.env` has:

- `FRONTEND_URL=http://localhost:3000`

or the origin where you serve the frontend.

## Pages and flows

### Customer flow

- `customer/menu.html?table=<N>` — QR-generated customer menu view.
  - Browse menu items
  - Ask “what should I eat?” recommendations
  - Add items to cart by table
- `customer/cart.html?table=<N>` — review cart, update item counts, place order.
- `customer/order-status.html?table=<N>&order=<id>` — live order tracking.
  - Shows order progress from placed to preparing to served.
  - Supports dish feedback once the order is complete.

### Admin flow

- `admin/login.html` — admin authentication page.
- `admin/dashboard.html` — kitchen dashboard with live orders.
- `admin/menu-manage.html` — manage menu items and availability.
- `admin/analytics.html` — sales and rating analytics for owner accounts.

## Seeded admin accounts

Use the seeded backend accounts for testing:

- Owner: `owner@restaurant.com` / `password123`
- Kitchen: `kitchen@restaurant.com` / `password123`

## Frontend architecture

### `frontend/js/api.js`

- Central API wrapper for all backend calls
- Handles JSON request bodies and auth headers
- Exposes endpoints for menu, orders, recommendations, feedback, tables, auth, and analytics

### `frontend/js/cart.js`

- Manages cart state in `localStorage`
- Cart keys are scoped by table number so two table sessions do not mix
- Provides add, update, clear, and total calculation functions

### `frontend/js/recommend.js`

- Handles the “what should I eat?” input
- Sends free-text preferences to `/api/recommend`
- Renders suggested menu item buttons

### `frontend/js/askMenu.js`

- Handles dietary/allergy question form
- Sends questions to `/api/menu/ask`
- Displays answer plus allergy disclaimer text

### `frontend/js/socketClient.js`

- Connects to backend Socket.io
- Supports customer table room joins and kitchen dashboard room joins
- Provides live updates for `orderStatusUpdate` and `newOrder`

## Important details

- Cart data is stored in localStorage per table.
- Customers do not log in; they use table number and QR context.
- Admin pages use JWT tokens returned from `/api/auth/login`.
- The AI recommendation feature depends on backend Gemini support, but the
  rest of the site works without it.

## Notes and troubleshooting

- If fetch or Socket.io fails, verify the backend URL settings in
  `API_BASE` and `SOCKET_URL`.
- If `recommend` or dietary questions are broken, ensure the backend has a
  valid `GEMINI_API_KEY` and can call Gemini.
- If the frontend page is blank or static assets fail, confirm the local
  server is running and you are not using `file://`.

## Folder structure

```
frontend/
├── admin/          admin UI pages
├── customer/       customer ordering pages
├── css/            styles
└── js/             application logic
```

## Deployment notes

- Serve the `frontend/` folder from a static web server.
- Keep backend and frontend origins aligned.
- Update `FRONTEND_URL` in the backend `.env` if the frontend is hosted
  somewhere else.
