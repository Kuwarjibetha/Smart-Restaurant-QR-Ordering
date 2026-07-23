# Smart Restaurant QR Ordering System

A complete full-stack QR ordering system with customer menu pages, admin dashboards, live Socket.io updates, AI-powered recommendations, and customer feedback.

## Project overview

This repository contains two main parts:

- `backend/` — Node.js + Express + MongoDB + Socket.io API server
- `frontend/` — static customer/admin UI built with HTML, CSS, and JavaScript

The system works like this:

- Customers scan a table QR code and open the menu page for their table.
- They browse the menu, add items to cart, and place an order.
- The backend validates the order, recalculates totals, and saves it.
- Kitchen staff see new orders instantly and update statuses.
- Customers receive live order status updates via Socket.io.
- Admin users manage menu items, tables, and view analytics.
- AI features power dish recommendation and dietary/allergy questions.

## Features

### Customer features

- Menu browsing with category and availability filtering
- Add items to cart scoped per table
- Place orders with server-side pricing and validation
- Live order tracking via Socket.io
- Dietary / allergy Q&A backed by Gemini AI
- Dish recommendation powered by Gemini AI
- Feedback submission after order completion

### Admin features

- Admin login with JWT authentication
- Kitchen dashboard with live new order feed
- Order status management (placed/preparing/served)
- Menu item creation, editing, and deletion
- Table creation with QR code generation
- Activate/deactivate tables
- Owner-only sales analytics and dish ratings
- Role-based access for `owner` and `kitchen`

### Backend features

- REST API for menu, orders, tables, auth, feedback, analytics
- Socket.io live updates for customer and kitchen clients
- QR code generation per table
- Gemini AI integration for recommendations and dietary answers
- Rate limiting for Gemini-powered endpoints
- Password hashing with bcrypt
- JWT auth and role-based route protection
- MongoDB data storage with Mongoose models

### Infrastructure features

- Simple local development with `npm run dev`
- Seed script for demo data
- Environment-based configuration via `.env`
- Static frontend serving with Python or any HTTP server

## Tech stack

### Backend

- Node.js (>=18)
- Express
- MongoDB with Mongoose
- Socket.io
- JSON Web Tokens (JWT)
- bcrypt
- dotenv
- express-rate-limit
- qrcode
- axios

### Frontend

- Plain HTML/CSS/JS
- Tailwind CSS via CDN (optional styling)
- localStorage cart management
- Socket.io client

## Prerequisites

- Node.js v18 or newer
- MongoDB instance (Atlas, local, or Docker)
- Gemini API key for recommendations and dietary answers
- Python 3 or another static file server for frontend

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secure random string
- `GEMINI_API_KEY` — Gemini API key (optional for AI features)
- `FRONTEND_URL` — frontend origin, e.g. `http://localhost:3000`
- `PORT` — optional, default is `5000`
- `DEFAULT_PREP_TIME_MINUTES` — optional wait time fallback

### Seed sample data

```bash
npm run seed
```

This creates:

- Owner admin: `owner@restaurant.com` / `password123`
- Kitchen admin: `kitchen@restaurant.com` / `password123`
- Tables 1–5 with generated QR codes
- Starter menu items

### Run backend

```bash
npm run dev
```

Or:

```bash
npm start
```

The backend listens at `http://localhost:5000` by default.

## Frontend setup

From the `frontend/` folder:

```bash
python3 -m http.server 3000
```

Then open:

- Customer menu: `http://localhost:3000/customer/menu.html?table=1`
- Admin login: `http://localhost:3000/admin/login.html`

> The frontend must be served over HTTP, not opened as a `file://` URL.

If the backend is hosted elsewhere, update:

- `frontend/js/api.js` → `API_BASE`
- `frontend/js/socketClient.js` → `SOCKET_URL`

And update backend `.env` `FRONTEND_URL` to the frontend origin.

## Authentication

Admin login works via `/api/auth/login` and returns a JWT.

Protected backend routes include:

- menu management
- table management
- order status updates
- analytics

Customer pages do not use login. Table number and socket rooms identify customer sessions.

## API reference

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | Public* | Register admin user |
| `/api/auth/login` | POST | Public | Login admin/kitchen |
| `/api/auth/me` | GET | Authenticated admin | Get current user |
| `/api/menu` | GET | Public | List menu items |
| `/api/menu/:id` | GET | Public | Fetch single menu item |
| `/api/menu` | POST | Admin | Create a menu item |
| `/api/menu/:id` | PATCH | Admin | Update menu item |
| `/api/menu/:id` | DELETE | Admin | Delete menu item |
| `/api/menu/ask` | POST | Public, rate-limited | Dietary/allergy Q&A |
| `/api/orders` | POST | Public | Place order |
| `/api/orders` | GET | Admin | List all orders |
| `/api/orders/table/:tableNumber` | GET | Public | Live customer order status |
| `/api/orders/:id` | PATCH | Admin | Update order status |
| `/api/recommend` | POST | Public, rate-limited | Menu recommendations |
| `/api/tables` | POST | Admin | Create table and QR code |
| `/api/tables` | GET | Admin | List tables |
| `/api/tables/:id` | PATCH | Admin | Activate/deactivate table |
| `/api/feedback` | POST | Public | Submit dish rating/feedback |
| `/api/analytics/sales` | GET | Owner | Sales and rating analytics |

\* In production, protect or disable `/api/auth/register` after initial setup.

## Frontend pages

### Customer pages

- `customer/menu.html?table=<N>` — browse menu, ask recommendations, add to cart, and checkout.
- `customer/cart.html?table=<N>` — review cart, change quantities, place order.
- `customer/order-status.html?table=<N>&order=<id>` — live order tracking and feedback submission.

### Admin pages

- `admin/login.html` — admin login.
- `admin/dashboard.html` — live kitchen dashboard with new order feed.
- `admin/menu-manage.html` — manage menu items and availability.
- `admin/analytics.html` — owner-only revenue and rating analytics.

## Detailed feature list

### Menu and ordering

- Category and availability filtering
- Add to cart per table
- Server-side price validation and total calculation
- Order creation with estimated wait time
- Order status transitions (`placed`, `preparing`, `served`)

### Feedback and ratings

- Submit ratings and comments for ordered dishes
- Feedback is only accepted for items actually in the referenced order
- Ratings stored on menu items for analytics

### Table management

- Generate table records with QR codes
- Store `tableUrl` for direct QR access
- Activate or deactivate tables

### Analytics

- Owner-only sales report
- Total revenue and order count
- Top dishes by quantity sold
- Dish rating averages across menu items

### AI and Gemini

- `recommend`: dish recommendations based on free-text preferences
- `askMenu`: dietary/allergy answers using verified menu data
- Gemini responses are cleaned and validated
- Rate limiting applied to control API cost

### Live updates

- Socket.io room-based updates for customers and kitchen
- Kitchen receives `newOrder` and status changes
- Customers receive order progress for their table only

### Security and validation

- JWT auth and role checks
- Password hashing with bcrypt
- Admin-only routes for management actions
- No trust on frontend-provided prices
- Rate limit public AI endpoints
- Socket room join validation prevents cross-table access

## Data models

### Admin

- `name`, `email`, `password`, `role`
- `owner` or `kitchen`

### MenuItem

- `name`, `category`, `price`, `isVeg`, `imageUrl`, `available`
- `avgPrepTimeMinutes`, `allergens`, `dietaryTags`, `ratings`

### Order

- `tableNumber`, `items`, `status`, `totalAmount`, `estimatedWaitTime`

### Table

- `tableNumber`, `qrCodeUrl`, `tableUrl`, `isActive`

## Folder structure

### Backend

```
backend/
├── controllers/    request handling logic
├── middleware/     auth, role checks, rate limiting
├── models/         Mongoose schemas
├── routes/         Express route definitions
├── socket/         Socket.io setup and emit helpers
├── utils/          Gemini, QR generation, wait time, seeding
└── server.js       entry point
```

### Frontend

```
frontend/
├── admin/          admin UI pages
├── customer/       customer ordering pages
├── css/            styles
└── js/             application scripts
```

## Environment variables

### Backend `.env`

- `MONGO_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `FRONTEND_URL`
- `PORT`
- `DEFAULT_PREP_TIME_MINUTES`

## Quick commands

```bash
# Backend
cd backend
npm install
npm run seed
npm run dev

# Frontend
cd frontend
python3 -m http.server 3000
```

## Useful links

- Backend API root: `http://localhost:5000/api`
- Customer example: `http://localhost:3000/customer/menu.html?table=1`
- Admin login: `http://localhost:3000/admin/login.html`

---

If you want, I can also remove the separate `backend/README.md` and `frontend/README.md` files and keep this single root README.
cd frontend
python3 -m http.server 3000
```

## Useful links

- Backend API: `http://localhost:5000/api`
- Customer example: `http://localhost:3000/customer/menu.html?table=1`
- Admin login: `http://localhost:3000/admin/login.html`

---

If you want, I can also merge the existing backend/frontend README content into this root README and remove the duplicate files.