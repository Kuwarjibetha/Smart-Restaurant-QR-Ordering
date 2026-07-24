# Backend — Spice Trail QR Ordering System

Node.js + Express + MongoDB + Socket.io API server for the Spice Trail restaurant ordering system.

---

## What this backend does

- Hosts REST API routes for menu, orders, tables, auth, feedback, analytics, group sessions, waiter calls, and AI features
- Generates QR codes per table and stores the table URL
- Uses Socket.io for live order status updates to customers and the kitchen
- Calls Google Gemini AI for dish recommendations, dietary Q&A, and meal planning
- Enforces JWT auth and role-based access (`owner` vs `kitchen`)
- Recalculates prices server-side — client-provided prices are never trusted

---

## Tech stack

| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `mongoose` | MongoDB ODM |
| `socket.io` | Real-time events |
| `jsonwebtoken` | JWT auth |
| `bcrypt` | Password hashing |
| `dotenv` | Environment config |
| `express-rate-limit` | Rate limiting for AI endpoints |
| `axios` | HTTP calls to Gemini API |
| `qrcode` | QR code image generation |
| `nodemon` | Dev auto-restart |

---

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | Frontend origin for CORS and QR links |
| `PORT` | Server port (default: `5000`) |
| `DEFAULT_PREP_TIME_MINUTES` | Fallback prep time estimation |

---

## Seed demo data

```bash
npm run seed
```

Creates:
- **Owner admin**: `owner@restaurant.com` / `password123`
- **Kitchen admin**: `kitchen@restaurant.com` / `password123`
- **Tables 1–5** with QR codes
- Sample menu items across Starters, Main Course, Desserts, Drinks

---

## Run the server

```bash
npm run dev    # development with nodemon (auto-restart)
npm start      # production
```

Server listens on `http://localhost:5000` by default.

---

## Folder structure

```
backend/
├── controllers/        one file per resource — handles request/response logic
│   ├── authController.js
│   ├── menuController.js
│   ├── orderController.js
│   ├── tableController.js
│   ├── waiterCallController.js
│   ├── groupSessionController.js
│   ├── feedbackController.js
│   ├── analyticsController.js
│   ├── recommendController.js
│   └── mealPlannerController.js
├── middleware/         auth guard, role check, rate limiters
├── models/             Mongoose schemas
│   ├── Admin.js        name, email, password (hashed), role
│   ├── MenuItem.js     name, category, price, isVeg, available, ratings
│   ├── Order.js        tableNumber, items, status, totalAmount, estimatedWaitTime
│   ├── Table.js        tableNumber, qrCodeUrl, tableUrl, tableCode, isActive
│   ├── WaiterCall.js   tableNumber, requestType, status
│   └── GroupSession.js sessionCode, tableCode, items, status, hostToken
├── routes/             Express route definitions (one file per resource)
├── socket/
│   └── socketHandler.js   Socket.io room setup and event emitters
├── utils/              Gemini client, QR generator, wait-time calc, seed script
├── .env                local secrets — never commit
├── .env.example        template with all variable names
├── package.json
└── server.js           entry point — connects DB, registers routes, starts server
```

---

## API routes

### Auth
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public* | Register admin |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/auth/me` | Admin | Current user info |

### Menu
| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/api/menu` | Public | List all menu items |
| GET | `/api/menu/:id` | Public | Single item detail |
| POST | `/api/menu` | Admin | Create item |
| PATCH | `/api/menu/:id` | Admin | Update / toggle availability |
| DELETE | `/api/menu/:id` | Admin | Delete item |
| POST | `/api/menu/ask` | Public (rate-limited) | Dietary/allergy Q&A |

### Orders
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Public | Place customer order |
| GET | `/api/orders` | Admin | List all orders |
| GET | `/api/orders/table/:code` | Public | Orders for a table |
| PATCH | `/api/orders/:id` | Admin | Update order status |

### Tables
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/tables` | Admin | Create table + QR |
| GET | `/api/tables` | Admin | List tables |
| PATCH | `/api/tables/:id` | Admin | Activate/deactivate |
| GET | `/api/tables/resolve/:id` | Public | Resolve table by code or number |

### Other
| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/recommend` | Public (rate-limited) | AI dish recommendations |
| POST | `/api/plan-meal` | Public (rate-limited) | AI meal planner |
| POST | `/api/feedback` | Public | Submit dish ratings |
| GET | `/api/analytics/sales` | Owner only | Revenue + rating analytics |
| POST | `/api/waiter-call` | Public | Call a waiter |
| PATCH | `/api/waiter-call/:id` | Admin | Mark call as handled |
| POST | `/api/sessions` | Public | Create group order session |
| GET | `/api/sessions/:code` | Public | Get session state |
| POST | `/api/sessions/:code/items` | Public | Add item to session |
| POST | `/api/sessions/:code/confirm` | Host | Confirm and place group order |

*Protect or disable `/api/auth/register` after initial setup in production.

---

## Order flow

1. Customer POSTs order with `tableCode` and item IDs
2. Backend validates table is active
3. Fetches menu items from DB — **client prices are ignored**
4. Recalculates total using DB prices
5. Estimates wait time from current pending orders
6. Saves order record
7. Emits `newOrder` to `kitchen` Socket.io room

## Socket.io rooms

| Room | Members | Events |
|---|---|---|
| `table-<tableNumber>` | Customer browsers | `orderUpdate`, `waiterCallHandled` |
| `kitchen` | Admin dashboards (JWT validated) | `newOrder`, `newWaiterCall` |
| `group-<sessionCode>` | Group session participants | `sessionUpdate`, `sessionConfirmed` |

## Security notes

- Passwords hashed with bcrypt
- JWTs required on all admin routes
- Role checks enforce `owner` vs `kitchen` access
- Rate limiting on all three Gemini-backed endpoints
- Feedback only accepted for dishes that appear in the referenced order
- Socket.io join events verified — customers cannot join other table rooms

---

## Notes

- Update `API_BASE` in `frontend/js/api.js` if the backend is hosted remotely
- Update `FRONTEND_URL` in `.env` to match the deployed frontend origin
- Use HTTPS and strong secrets in production
