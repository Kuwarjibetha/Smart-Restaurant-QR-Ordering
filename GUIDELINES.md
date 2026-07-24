# GUIDELINES.md — Spice Trail Development Guidelines

This file defines folder structure, coding standards, naming conventions, and contribution rules for the project.

---

## Folder structure

```
qr book/                          ← project root
├── AGENTS.md                     ← tech stack, architecture, working principles
├── GUIDELINES.md                 ← this file: folder names, conventions, rules
├── README.md                     ← project overview and quick-start guide
├── package.json                  ← root scripts (start, seed)
├── render.yaml                   ← deployment config
│
├── backend/                      ← Node.js API server
│   ├── controllers/              ← request handlers (one file per resource)
│   │   ├── authController.js
│   │   ├── menuController.js
│   │   ├── orderController.js
│   │   ├── tableController.js
│   │   ├── waiterCallController.js
│   │   ├── groupSessionController.js
│   │   ├── feedbackController.js
│   │   ├── analyticsController.js
│   │   ├── recommendController.js
│   │   └── mealPlannerController.js
│   ├── middleware/               ← auth guards, rate limiters
│   ├── models/                   ← Mongoose schemas
│   │   ├── Admin.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Table.js
│   │   ├── WaiterCall.js
│   │   └── GroupSession.js
│   ├── routes/                   ← Express route definitions (one file per resource)
│   ├── socket/
│   │   └── socketHandler.js      ← Socket.io room setup and event handlers
│   ├── utils/                    ← helpers: Gemini client, QR generator, seeder
│   ├── .env                      ← local secrets (never commit)
│   ├── .env.example              ← template for .env
│   ├── package.json
│   └── server.js                 ← app entry point
│
└── frontend/                     ← static HTML/CSS/JS (no build step)
    ├── index.html                ← public landing page (restaurant showcase)
    ├── admin/                    ← admin panel pages
    │   ├── login.html
    │   ├── signup.html
    │   ├── dashboard.html        ← live kitchen kanban
    │   ├── menu-manage.html      ← menu CRUD
    │   ├── tables.html           ← table and QR management
    │   └── analytics.html        ← owner-only sales reports
    ├── customer/                 ← customer-facing pages
    │   ├── menu.html             ← browse, filter, AI advisor, add to cart
    │   ├── cart.html             ← review cart, place order
    │   └── order-status.html     ← live order tracking + feedback
    ├── css/
    │   └── style.css             ← design tokens and shared component styles
    └── js/                       ← shared JavaScript modules
        ├── api.js                ← all fetch() calls to backend (single source of truth)
        ├── cart.js               ← cart read/write helpers + getTableIdentifierFromUrl()
        ├── socketClient.js       ← Socket.io connection helpers
        ├── groupOrder.js         ← group session UI and state
        ├── mealPlanner.js        ← AI meal planner UI
        ├── recommend.js          ← AI recommendation UI
        ├── askMenu.js            ← dietary Q&A UI
        └── socket.io.min.js      ← Socket.io client library (vendored)
```

---

## Naming conventions

### Files

| Type | Convention | Example |
|---|---|---|
| Backend controllers | camelCase + `Controller.js` | `orderController.js` |
| Backend routes | camelCase + `Routes.js` | `orderRoutes.js` |
| Mongoose models | PascalCase | `MenuItem.js` |
| Frontend JS modules | camelCase | `groupOrder.js` |
| Frontend HTML pages | kebab-case | `menu-manage.html` |
| CSS classes | kebab-case | `dish-card`, `floating-cart-bar` |

### CSS design tokens (in `style.css`)

Always use CSS variables — never hardcode colours or fonts:

| Token | Value / purpose |
|---|---|
| `--cream` | Page background warm white |
| `--cream-deep` | Slightly darker cream for cards |
| `--charcoal` | Primary text colour |
| `--charcoal-soft` | Secondary/muted text |
| `--saffron` | Primary accent (amber/gold) |
| `--saffron-deep` | Darker amber for headings and prices |
| `--chili` | Error/danger colour |
| `--cardamom` | Success/green colour |
| `--clay-line` | Border and divider colour |
| `--font-display` | Fraunces (display headings) |

### JavaScript localStorage keys

| Key | Purpose |
|---|---|
| `cart:table:<tableCode>` | Cart items for a specific table |
| `adminToken` | JWT for admin sessions |
| `adminRole` | `owner` or `kitchen` |
| `deviceId` | Unique device ID for group orders |
| `displayName` | Name shown in group order sessions |
| `groupHost:<sessionCode>` | Host token for group order ownership |
| `customerName` | Remembered name for order form |
| `customerMobile` | Remembered mobile for order form |

---

## API naming conventions

All API routes follow REST conventions:

```
GET    /api/<resource>           → list
POST   /api/<resource>           → create
GET    /api/<resource>/:id       → get one
PATCH  /api/<resource>/:id       → update
DELETE /api/<resource>/:id       → delete
```

Special action routes use descriptive paths:
- `POST /api/menu/ask` — dietary Q&A
- `GET /api/tables/resolve/:identifier` — resolve table by code or number
- `GET /api/orders/table/:tableNumber` — customer order status

---

## Admin navigation rules

Admin pages share a unified nav layout:

- **Left side**: logo + current page title
- **Right side**: nav links + action buttons
- **Dashboard page**: no "Dashboard" button (you are already there)
- **Other admin pages**: "Dashboard →" button always last on the right
- No "Home" button in the admin nav

---

## QR gate rules

The QR gate is a security boundary — follow these strictly:

1. `getTableIdentifierFromUrl()` must **never** have a `|| 1` or `|| "1"` fallback
2. Links from `index.html` to customer pages must **not** include `?table=<anything>` hardcoded
3. The hero demo simulator on `index.html` is the only exception — it builds its URL dynamically from the table selector
4. If `hasTable` is `false`, show a scan-prompt — never silently default

---

## Git and branching

- `main` — production-ready code
- Feature branches: `feature/<short-description>`
- Fix branches: `fix/<short-description>`
- Commit messages: imperative, short, e.g. `add QR gate to cart page`

---

## Environment files

- `.env` — **never commit** (listed in `.gitignore`)
- `.env.example` — commit this; contains all variable names with placeholder values
- Never hardcode secrets or API keys in source code

---

## Deployment

The project includes a `render.yaml` for Render.com deployment.

- Backend: Node.js web service running `npm start`
- Frontend: static site served from `frontend/` directory
- Update `FRONTEND_URL` in `.env` and `API_BASE` in `frontend/js/api.js` when deploying
