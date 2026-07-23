# Smart Restaurant QR Ordering — Backend

This backend is the API server for a smart restaurant QR ordering system.
It uses Node.js, Express, MongoDB (Mongoose), Socket.io, JWT auth, and Gemini
AI for menu recommendations and dietary questions.

## What the backend does

- Hosts REST API routes for menu, orders, tables, feedback, auth, and analytics.
- Generates QR codes for tables and stores them with table records.
- Uses Socket.io for live order status updates to customers and the kitchen.
- Calls Gemini AI for menu recommendations and dietary/allergy answers.
- Enforces admin and owner permissions for sensitive routes.
- Recalculates prices server-side and verifies data to prevent client tampering.

## Tech stack

- Node.js (>=18)
- Express
- MongoDB with Mongoose
- Socket.io
- JSON Web Tokens (JWT)
- bcrypt for password hashing
- dotenv for environment configuration
- express-rate-limit for rate limiting
- axios for Gemini HTTP requests
- qrcode for QR generation
- nodemon in development

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Then edit `.env` and set:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secure random string for JWT signing
- `GEMINI_API_KEY` — Google Gemini API key
- `FRONTEND_URL` — frontend host used for CORS and QR links
- `PORT` — optional backend port (default: `5000`)

## Seed demo data

```bash
npm run seed
```

This creates:

- Owner admin: `owner@restaurant.com` / `password123`
- Kitchen admin: `kitchen@restaurant.com` / `password123`
- Tables 1–5 with generated QR codes
- Starter menu items across Starters, Main Course, Desserts, Drinks

## Run the server

```bash
npm run dev
```

Or start without watch mode:

```bash
npm start
```

The server listens on `http://localhost:5000` by default.

## Environment variables

- `MONGO_URI` — MongoDB URI
- `JWT_SECRET` — JWT secret
- `GEMINI_API_KEY` — Gemini API key
- `FRONTEND_URL` — frontend origin for CORS and QR page URLs
- `PORT` — optional server port
- `DEFAULT_PREP_TIME_MINUTES` — fallback prep time for wait-time estimation

## API overview

### Authentication

- `POST /api/auth/register` — create a new admin account
- `POST /api/auth/login` — login and receive JWT
- `GET /api/auth/me` — current admin data (requires auth)

> Note: protect or disable `/api/auth/register` after initial setup.

### Menu management

- `GET /api/menu` — list menu items
- `GET /api/menu/:id` — item detail
- `POST /api/menu` — add menu item (admin only)
- `PATCH /api/menu/:id` — edit item or update availability (admin only)
- `DELETE /api/menu/:id` — delete item (admin only)
- `POST /api/menu/ask` — ask dietary/allergen questions (public, rate-limited)

### Orders

- `POST /api/orders` — place a customer order
- `GET /api/orders/table/:tableNumber` — get a table's recent orders
- `GET /api/orders` — list orders for admin dashboard
- `PATCH /api/orders/:id` — update order status (admin only)

### Tables

- `POST /api/tables` — create table + QR code (admin only)
- `GET /api/tables` — list tables (admin only)
- `PATCH /api/tables/:id` — activate/deactivate table (admin only)

### Recommendations and feedback

- `POST /api/recommend` — Gemini-based menu recommendations
- `POST /api/feedback` — submit order feedback and dish ratings

### Analytics

- `GET /api/analytics/sales` — sales report for owner only

## Example requests

### Order placement

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": 2,
    "items": [
      { "menuItemId": "<id>", "quantity": 1 }
    ]
  }'
```

### AI recommendation

```bash
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{ "preferenceText": "spicy veg, quick, under 200 rupees" }'
```

## How it works

### Order flow

1. Customer posts order data with `tableNumber` and item IDs.
2. Backend validates table and menu item availability.
3. Price is recalculated using DB values; client prices are ignored.
4. Estimated wait time is computed using current pending orders.
5. Order record is created and broadcast to kitchen via Socket.io.

### Socket.io flow

- Customers join `table-<number>` rooms.
- Kitchen dashboards join `kitchen` room after token validation.
- New orders and status updates are emitted to the appropriate room(s).

### Gemini AI usage

- `recommend` route asks Gemini for matching dishes.
- `askMenu` route asks Gemini dietary/allergy questions.
- Gemini responses are filtered and verified so the app does not return
  hallucinated dishes or unsupported answers.

## Security and validation

- bcrypt hashes passwords.
- JWTs protect admin endpoints.
- Role-based access for `owner` and `kitchen` users.
- Rate limiting protects Gemini routes from abuse.
- Socket.io join events are checked so customers cannot join other tables.
- Feedback is only accepted for dishes included in the referenced order.

## Folder structure

```
backend/
├── controllers/        request handlers
├── middleware/         auth and rate-limit middleware
├── models/             Mongoose schemas
├── routes/             Express route definitions
├── socket/             Socket.io setup and emit helpers
├── utils/              QR generation, Gemini client, wait-time logic, seeding
└── server.js           app startup and route registration
```

## Notes

- Update `API_BASE` in the frontend if the backend is hosted somewhere else.
- The app currently uses `http://localhost:5000` and `http://localhost:3000`
  for local development.
- `express-validator` is available in dependencies for future request validation,
  though the current code uses manual validation.
- If you deploy production, use HTTPS and strong `JWT_SECRET` / `GEMINI_API_KEY`.
