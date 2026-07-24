# AGENTS.md — Spice Trail QR Ordering System

This file describes the technology stack, architecture, working principles, and key conventions for any agent or developer working on this codebase.

---

## Project identity

**Name**: Spice Trail — Smart Restaurant QR Ordering System  
**Type**: Full-stack web application  
**Purpose**: Customers scan a table QR code to browse a live menu, place orders, call waiters, and track food in real-time. Restaurant staff manage orders, menu, and analytics from an admin panel.

---

## Tech stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express |
| Database | MongoDB via Mongoose |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| AI | Google Gemini API (via axios) |
| QR codes | `qrcode` npm package |
| Rate limiting | `express-rate-limit` |
| Config | `dotenv` |
| Dev server | `nodemon` |

### Frontend

| Layer | Technology |
|---|---|
| Structure | Plain HTML5 |
| Styling | Vanilla CSS + Tailwind CSS (CDN) |
| Logic | Plain JavaScript (no framework) |
| Real-time | Socket.io client |
| State | `localStorage` for cart and session data |
| Fonts | Google Fonts (Fraunces, Work Sans) |

---

## Architecture overview

```
Browser (customer or admin)
        │
        ▼
  frontend/ (static files, served via python3 -m http.server 3000)
        │  REST calls via fetch()       Socket.io events
        ▼                               ▼
  backend/server.js  ──────────────  Socket.io server
        │
        ├── Express REST API (/api/*)
        ├── MongoDB (Mongoose models)
        └── Gemini AI (HTTP via axios)
```

The frontend is **fully static** — no build step, no bundler. All pages are plain `.html` files served over HTTP.

---

## Data flow — customer order

1. Customer scans QR → opens `menu.html?table=<tableCode>`
2. `getTableIdentifierFromUrl()` in `cart.js` reads the `table=` param — **no fallback default**; returns `null` if missing
3. `initializeTable()` resolves the table via `GET /api/tables/resolve/:identifier`
4. Customer adds items → stored in `localStorage` under key `cart:table:<tableCode>`
5. Customer submits cart → `POST /api/orders` with item IDs and table code
6. Backend re-validates prices from DB, computes wait time, saves order
7. Backend emits `newOrder` to Socket.io `kitchen` room
8. Kitchen sees new card on dashboard → updates status
9. Backend emits `orderUpdate` to `table-<number>` Socket.io room
10. Customer sees live status change on `order-status.html`

---

## QR gate — critical rule

Customers **must** have a valid `?table=` URL param to:
- Add items to cart
- Call a waiter
- Start or join a group order
- Place an order

Without a table param, menu browsing and all AI features remain fully available.

**Never add `?table=1` or any hardcoded fallback** to links on the landing page.

---

## Socket.io room model

| Room | Who joins | Events received |
|---|---|---|
| `table-<tableNumber>` | Customer browser | `orderUpdate`, `waiterCallHandled` |
| `kitchen` | Admin dashboard (JWT validated) | `newOrder`, `newWaiterCall` |
| `group-<sessionCode>` | Group order participants | `sessionUpdate`, `sessionConfirmed` |

---

## Authentication

- Admin login: `POST /api/auth/login` → returns JWT stored as `adminToken` in localStorage
- Role stored as `adminRole` (`owner` or `kitchen`)
- `owner`: full access including analytics
- `kitchen`: dashboard and order status only
- Customer pages use **no login** — table code identifies the session

---

## AI integration (Gemini)

| Endpoint | Purpose |
|---|---|
| `POST /api/recommend` | Dish recommendations from free-text |
| `POST /api/menu/ask` | Dietary / allergy Q&A against live menu |
| `POST /api/plan-meal` | Budget + group size meal planning |

All three are rate-limited. Gemini responses are validated against real menu data before returning to the client.

---

## Key conventions

- **No frontend prices trusted** — backend always re-fetches prices from MongoDB
- **No `|| 1` fallbacks** on table identifiers — always check for null
- **CSS tokens** in `frontend/css/style.css` — use `var(--cream)`, `var(--saffron)`, `var(--charcoal)` etc.
- **Cart key**: `cart:table:<tableCode>` in localStorage
- **Admin token key**: `adminToken` in localStorage
- **Admin role key**: `adminRole` in localStorage
- **Group host token**: `groupHost:<sessionCode>` in localStorage

---

## Environment variables

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | Frontend origin for CORS and QR code links |
| `PORT` | Server port (default: 5000) |
| `DEFAULT_PREP_TIME_MINUTES` | Fallback prep time for wait-time estimation |

---

## Running locally

```bash
# Backend
cd backend && npm install && cp .env.example .env
npm run seed   # seed demo data
npm run dev    # start with nodemon

# Frontend (separate terminal)
cd frontend && python3 -m http.server 3000
```
