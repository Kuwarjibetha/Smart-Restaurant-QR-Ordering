# Spice Trail — Smart Restaurant QR Ordering System

A complete full-stack restaurant ordering system. Customers scan a table QR code, browse a live menu, place orders, call waiters, and track food in real-time. Restaurant staff manage orders, menu items, tables, and view analytics from an admin panel.

---

## What's in this repo

```
qr book/
├── AGENTS.md          ← tech stack, architecture, working principles
├── GUIDELINES.md      ← folder names, conventions, contribution rules
├── backend/           ← Node.js + Express + MongoDB + Socket.io API server
└── frontend/          ← static HTML/CSS/JS customer and admin UI
```

---

## How the system works

1. Restaurant admin creates tables → each table gets a unique QR code
2. Customer scans QR → `menu.html?table=<code>` opens on their phone
3. Customer browses, uses AI features, adds to cart, places order
4. Backend validates order, saves it, emits `newOrder` to kitchen via Socket.io
5. Kitchen dashboard shows new order card → staff updates status
6. Customer sees live status update (`placed → preparing → served`)
7. After serving, customer rates dishes — feedback updates menu analytics

---

## Features

### Customer
- Browse menu with category filters, search, and veg-only toggle
- Add items to a per-table cart
- Place order — price validated server-side (client prices ignored)
- Live order status tracking via Socket.io
- Group order — shared cart where everyone adds from their own phone
- Call waiter (water / check / help) with instant kitchen notification
- AI Meal Planner — budget + group size dish suggestions via Gemini
- AI Dietary Q&A — allergy / dietary questions answered by Gemini
- Dish recommendation from free-text preference
- Star rating feedback after order is served

### Admin
- JWT-authenticated admin login (owner / kitchen roles)
- Live kitchen kanban — new orders, status management
- Menu management — create, edit, delete, toggle availability
- Table management — generate QR codes, activate/deactivate
- Owner-only analytics — revenue, top dishes, rating averages

---

## Tech stack

**Backend**: Node.js · Express · MongoDB (Mongoose) · Socket.io · JWT · bcrypt · Gemini AI · qrcode

**Frontend**: HTML · Vanilla CSS · Tailwind CSS (CDN) · Plain JavaScript · Socket.io client

---

## Prerequisites

- Node.js ≥ 18
- MongoDB (Atlas, local, or Docker)
- Google Gemini API key (for AI features)
- Python 3 (to serve frontend locally)

---

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY, FRONTEND_URL
npm run seed    # creates demo admin accounts, 5 tables, sample menu items
npm run dev     # starts backend on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
python3 -m http.server 3000
```

Open in browser:
- Landing page: `http://localhost:3000`
- Customer menu (demo): `http://localhost:3000/customer/menu.html?table=1`
- Admin login: `http://localhost:3000/admin/login.html`

---

## Demo credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Owner | `owner@restaurant.com` | `password123` |
| Kitchen | `kitchen@restaurant.com` | `password123` |

---

## Environment variables

Create `backend/.env` from `backend/.env.example`:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | Frontend origin (for CORS + QR links) |
| `PORT` | Backend port (default: `5000`) |
| `DEFAULT_PREP_TIME_MINUTES` | Fallback prep time estimation |

---

## API reference

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | Public* | Register admin |
| `/api/auth/login` | POST | Public | Login, get JWT |
| `/api/auth/me` | GET | Admin | Current user info |
| `/api/menu` | GET | Public | List menu items |
| `/api/menu` | POST | Admin | Create menu item |
| `/api/menu/:id` | PATCH | Admin | Update menu item |
| `/api/menu/:id` | DELETE | Admin | Delete menu item |
| `/api/menu/ask` | POST | Public (rate-limited) | Dietary/allergy Q&A |
| `/api/orders` | POST | Public | Place order |
| `/api/orders` | GET | Admin | List all orders |
| `/api/orders/table/:code` | GET | Public | Customer order status |
| `/api/orders/:id` | PATCH | Admin | Update order status |
| `/api/recommend` | POST | Public (rate-limited) | Dish recommendations |
| `/api/plan-meal` | POST | Public (rate-limited) | AI meal planning |
| `/api/tables` | POST | Admin | Create table + QR |
| `/api/tables` | GET | Admin | List tables |
| `/api/tables/:id` | PATCH | Admin | Activate/deactivate |
| `/api/tables/resolve/:id` | GET | Public | Resolve table by code |
| `/api/waiter-call` | POST | Public | Call a waiter |
| `/api/sessions` | POST | Public | Create group session |
| `/api/sessions/:code` | GET | Public | Get group session |
| `/api/feedback` | POST | Public | Submit dish ratings |
| `/api/analytics/sales` | GET | Owner only | Revenue + ratings |

*Protect or disable `/api/auth/register` in production after initial setup.

---

## Frontend pages

### Customer

| Page | URL | Purpose |
|---|---|---|
| Menu | `customer/menu.html?table=<code>` | Browse, filter, AI features, add to cart |
| Cart | `customer/cart.html?table=<code>` | Review cart, place order |
| Order status | `customer/order-status.html?table=<code>` | Live tracking, feedback |

> Without a valid `?table=` param (i.e. not from a real QR scan), customers can browse and use AI features but cannot order, call a waiter, or start a group order.

### Admin

| Page | URL | Purpose |
|---|---|---|
| Login | `admin/login.html` | Admin authentication |
| Dashboard | `admin/dashboard.html` | Live kitchen order kanban |
| Menu manage | `admin/menu-manage.html` | Menu item CRUD |
| Tables | `admin/tables.html` | Table + QR management |
| Analytics | `admin/analytics.html` | Owner-only revenue/ratings |

---

## Deployment

A `render.yaml` is included for Render.com deployment.

After deploying:
1. Update `API_BASE` in `frontend/js/api.js` to the backend URL
2. Update `SOCKET_URL` in `frontend/js/socketClient.js`
3. Set `FRONTEND_URL` in backend `.env` to the frontend URL

---

## Further reading

- [AGENTS.md](./AGENTS.md) — tech stack, architecture, data flow, security rules
- [GUIDELINES.md](./GUIDELINES.md) — folder structure, naming conventions, contribution rules
- [backend/README.md](./backend/README.md) — backend-specific setup and API details
