# Smart Restaurant QR Ordering — Backend

Node.js + Express + MongoDB (Mongoose) + Socket.io backend for the QR ordering
system described in the project research doc. This covers everything except
the frontend (customer & admin UI), which comes next.

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGO_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — your Gemini API key
- `FRONTEND_URL` — where your frontend will run (used for CORS + QR code links)

## 2. Seed sample data (recommended for first run)

```bash
npm run seed
```

This creates:
- Owner login: `owner@restaurant.com` / `password123`
- Kitchen login: `kitchen@restaurant.com` / `password123`
- Tables 1–5 with QR codes
- A starter menu (8 items across Starters/Main Course/Desserts/Drinks)

## 3. Run the server

```bash
npm run dev     # with nodemon, auto-restart on changes
# or
npm start
```

Server runs on `http://localhost:5000` by default. Check `GET /api/health`.

## 4. Authentication

Admin/kitchen routes require a `Bearer` token from `/api/auth/login`:

```
Authorization: Bearer <token>
```

Customers never log in — the QR code itself identifies the table.

## 5. API Reference

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | Public* | Create an admin account |
| `/api/auth/login` | POST | Public | Admin/kitchen login → returns JWT |
| `/api/auth/me` | GET | Admin | Get current logged-in admin |
| `/api/menu` | GET | Public | Get full menu (supports `?category=` `?available=true`) |
| `/api/menu/:id` | GET | Public | Get single menu item |
| `/api/menu` | POST | Admin | Add new item |
| `/api/menu/:id` | PATCH | Admin | Edit item / mark out-of-stock |
| `/api/menu/:id` | DELETE | Admin | Remove item |
| `/api/orders` | POST | Public | Place a new order |
| `/api/orders` | GET | Admin | List all orders (dashboard feed) |
| `/api/orders/table/:tableNumber` | GET | Public | Get live order status for a table |
| `/api/orders/:id` | PATCH | Admin | Update order status |
| `/api/recommend` | POST | Public (rate-limited) | AI-based dish recommendation |
| `/api/tables` | POST | Admin | Generate new table + QR code |
| `/api/tables` | GET | Admin | List all tables |
| `/api/tables/:id` | PATCH | Admin | Activate/deactivate a table |
| `/api/feedback` | POST | Public | Submit dish rating/feedback |
| `/api/analytics/sales` | GET | Owner only | View sales report |

\* Consider protecting/disabling `/api/auth/register` in production after
creating your initial admin accounts, so random users can't self-register as kitchen/owner.

### Example: Place an order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": 3,
    "items": [
      { "menuItemId": "<menu_item_id>", "quantity": 2 }
    ]
  }'
```

Note: only `menuItemId` and `quantity` are read from the request — price and
name are always recalculated server-side from the database, so a tampered
request can't change what the customer is charged.

### Example: AI recommendation

```bash
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{ "preferenceText": "something spicy and vegetarian, under 200 rupees" }'
```

Response only ever contains dish names that exist in your live menu — Gemini's
suggestions are cross-checked against the database before being returned, so
hallucinated dishes are filtered out.

## 6. Real-time events (Socket.io)

Client connects to the same origin as the server.

**Customer side:**
```js
const socket = io("http://localhost:5000");
socket.emit("joinTable", 12);
socket.on("orderStatusUpdate", (order) => { /* update UI */ });
```

**Kitchen dashboard side:**
```js
const socket = io("http://localhost:5000");
socket.emit("joinKitchen", jwtToken); // must be a valid admin token
socket.on("newOrder", (order) => { /* add to dashboard */ });
socket.on("orderStatusUpdate", (order) => { /* update dashboard */ });
```

Rooms are scoped so a customer can only ever receive updates for their own
table — never other tables' orders.

## 7. Security notes already built in

- Passwords hashed with bcrypt, never returned in API responses.
- JWT auth + role-based access (`owner` vs `kitchen`) via middleware.
- All prices/totals recalculated server-side — client-sent prices are ignored.
- `/api/recommend` is rate-limited (8 req/min/IP) to control Gemini API costs.
- Socket.io rooms prevent customers from subscribing to other tables' updates;
  kitchen room requires a valid JWT to join.
- Feedback can only be submitted for dishes that were actually part of the
  referenced order.

## 8. Folder structure

```
backend/
├── models/          Table, MenuItem, Order, Admin (Mongoose schemas)
├── routes/          Express route definitions per resource
├── controllers/      Route handler logic
├── middleware/       JWT auth, role checks, rate limiting
├── utils/             Gemini client, QR generator, wait-time calc, seed script
├── socket/            Socket.io connection + room-scoped event emitters
└── server.js          App entry point
```

## 9. What's next (frontend)

The frontend (customer menu/cart/order-status pages + admin dashboard) will
connect to this API using the routes and Socket.io events documented above.
Let me know when you're ready and we'll build that next.
