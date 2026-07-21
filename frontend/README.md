# Smart Restaurant QR Ordering — Frontend

Plain HTML + Tailwind (CDN) + Vanilla JS, talking to the backend you already
have running on `http://localhost:5000`.

## 1. Run it

The frontend needs to be served (not opened directly as a `file://` URL) so
that `fetch` and Socket.io work correctly with the backend's CORS settings.

From this `frontend/` folder:

```bash
python3 -m http.server 3000
```

Then open:
- **Customer menu**: http://localhost:3000/customer/menu.html?table=1
- **Admin login**: http://localhost:3000/admin/login.html

This matches the `FRONTEND_URL=http://localhost:3000` in your backend's `.env`
— if you serve it on a different port, update that value and restart the
backend.

## 2. Customer flow

1. `customer/menu.html?table=<N>` — the page a QR code would open. Shows the
   live menu, lets you add items to a cart (stored in `localStorage`,
   scoped per table), and has the "what should I eat?" box wired to
   `/api/recommend` (this needs a working Gemini key — see note below).
2. `customer/cart.html?table=<N>` — review/adjust quantities, place the order.
3. `customer/order-status.html?table=<N>&order=<id>` — live status via
   Socket.io (Placed → Preparing → Served), plus a dish-rating form once
   the order is served.

## 3. Admin flow

1. `admin/login.html` — sign in with a seeded account:
   - Owner: `owner@restaurant.com` / `password123`
   - Kitchen: `kitchen@restaurant.com` / `password123`
2. `admin/dashboard.html` — live kanban of orders (Placed / Preparing /
   Served) via Socket.io, with one-click status advancement.
3. `admin/menu-manage.html` — add dishes, mark items out of stock, remove
   items.
4. `admin/analytics.html` — **owner only**. Revenue, top dishes, dish
   ratings. Kitchen-role accounts won't see this link on the dashboard, and
   the page itself blocks kitchen accounts even if they visit the URL
   directly (the backend also enforces this server-side).

## 4. About the AI recommendation box

The "what should I eat?" box on the menu page calls `/api/recommend`, which
depends on your `GEMINI_API_KEY` working on the backend. If that's not sorted
out yet, the box will just show a friendly "taking a break" message instead
of crashing — everything else in the app works independently of it.

## 5. Notes

- `API_BASE` (in `js/api.js`) and `SOCKET_URL` (in `js/socketClient.js`) are
  both hardcoded to `http://localhost:5000` — change these if you deploy the
  backend elsewhere.
- The cart lives in `localStorage`, keyed per table number, so it survives a
  page refresh but is specific to the device/browser used to scan the QR
  code — matching how a real customer would only use their own phone.
- No build step, no framework — just open the files (through the local
  server above) and edit directly.
