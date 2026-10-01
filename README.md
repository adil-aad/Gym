# Gym Manager

A membership management system for a local gym — members, plans, payments and revenue reporting — replacing a paper register. Built as a real client project for a gym trading as **Hammer**.

**Live demo:** https://gym-hammer.vercel.app

## Tech stack

**Client** — React 18, TypeScript, Vite 8, React Router 7, TanStack Query 5, Tailwind CSS 4, axios, oxlint
**Server** — Node, Express 5, TypeScript, Mongoose 9 / MongoDB, jsonwebtoken, bcryptjs, tsx
**Deployment** — Vercel: the client as a static SPA, the server as a serverless function (`server/api/index.ts`)

## Features

- **JWT authentication** — passwords hashed with bcrypt in a Mongoose pre-save hook; the token is held in `localStorage` and attached by an axios request interceptor, which also clears the session and redirects on a 401.
- **Two roles, enforced server-side** — `owner` and `admin` (front-desk). A `restrictTo` middleware gates routes; the client mirrors it with route guards and a filtered sidebar. Admins can register members and record payments but cannot read payment history or revenue.
- **Membership validity derived automatically** — a `pre('validate')` hook on the Member model computes `expiryDate` from the selected plan's `durationInMonths`, and flips status to `expired` once the date has passed.
- **Early renewal keeps remaining days** — renewing restarts the clock from the current expiry date when it is still in the future, otherwise from today.
- **Members** — create, update, search by name or phone, filter by status, paginated listing, owner-only hard delete (admins suspend instead).
- **Plans** — create and edit; deleting only deactivates a plan, so members and payments that reference it stay intact.
- **Payments** — recorded against a member and plan, with the amount defaulting to the plan price; filterable and paginated history for the owner.
- **Revenue reporting in the database** — a MongoDB aggregation (`$facet` / `$group` / `$sum`) totals all-time revenue plus monthly and payment-method breakdowns for a given year, rather than loading payment documents into the app. Backed by a compound `{ paymentDate, amount }` index.
- **Dashboard** — membership status tiles, new sign-ups this month vs last, and memberships expiring in the next 1 and 3 days for renewal follow-up.
- **Staff management** — the owner can create admin accounts, deactivate them (which blocks login) or delete them.

## Repo layout

```
client/                  React + Vite SPA
  src/api/               axios instance, token store, per-resource API calls
  src/components/        guards/ (ProtectedRoute, OwnerRoute), layout/, ui/
  src/context/           AuthContext — session + isOwner
  src/hooks/             TanStack Query hooks per resource
  src/pages/             dashboard, login, members, plans, payments, settings
  vercel.json            SPA rewrite to index.html
server/
  api/index.ts           Vercel serverless entry (connect, then delegate to app)
  src/app.ts             Express app: CORS, routes, 404, error handler
  src/index.ts           local dev server
  src/db.ts              connection cached across serverless invocations
  src/models/            User, Member, Plan, Payment
  src/routes/            auth, members, plans, payments
  src/controllers/       request handlers
  src/middleware/auth.ts protect (JWT) + restrictTo (roles)
  src/utils/jwt.ts       sign / verify
  src/seed.ts            seed initial users and plans
  vercel.json            routes all traffic to the function
```

## Prerequisites

- Node.js 20+ (no `engines` field is declared; Vite 8 expects a current LTS)
- A MongoDB database — local or Atlas

## Setup

### Server

```bash
cd server
npm install
```

Create `server/.env`:

| Variable         | Required | Default                 | Notes                              |
| ---------------- | -------- | ----------------------- | ---------------------------------- |
| `MONGO_URI`      | yes      | —                       | MongoDB connection string          |
| `JWT_SECRET`     | yes      | —                       | signing secret; startup throws without it |
| `JWT_EXPIRES_IN` | no       | `7d`                    | token lifetime                     |
| `PORT`           | no       | `5000`                  | local dev port                     |
| `CLIENT_URL`     | no       | `http://localhost:5173` | CORS origin                        |
| `SEED_OWNER_PASSWORD` | seeding only | —              | password for the seeded owner account |
| `SEED_ADMIN_PASSWORD` | seeding only | —              | password for the seeded admin account |

`server/.env.example` lists all of these.

Then:

```bash
npm run seed    # creates an owner, an admin and four plans (see src/seed.ts)
npm run dev     # tsx watch on http://localhost:5000
```

`npm run seed` reads the two seeded account passwords from `SEED_OWNER_PASSWORD` and `SEED_ADMIN_PASSWORD` and refuses to run if either is unset, so the seeded owner and admin never ship with a default password.

Production: `npm run build` (tsc) then `npm start`.

### Client

```bash
cd client
npm install
npm run dev     # http://localhost:5173
```

No client env file is needed in development: Vite proxies `/api` to `http://localhost:5000`. For a deployed build, set `VITE_API_URL` to the server's API base URL (it falls back to `/api`).

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## API

All routes are prefixed `/api`. Every route except `POST /auth/login` and `GET /health` requires an `Authorization: Bearer <token>` header. "Owner" means the route additionally requires the `owner` role.

| Method | Route                      | Access       | Purpose                                            |
| ------ | -------------------------- | ------------ | -------------------------------------------------- |
| GET    | `/health`                  | public       | liveness check                                     |
| POST   | `/auth/login`              | public       | authenticate, returns a JWT                        |
| GET    | `/auth/me`                 | any          | current user                                       |
| PATCH  | `/auth/update-password`    | any          | change own password, returns a fresh token         |
| POST   | `/auth/register`           | owner        | create a staff account                             |
| GET    | `/auth/users`              | owner        | list admin accounts                                |
| PATCH  | `/auth/users/:id`          | owner        | activate / deactivate an admin                     |
| DELETE | `/auth/users/:id`          | owner        | delete an admin account                            |
| GET    | `/plans`                   | any          | list plans (`?includeInactive=true`)               |
| GET    | `/plans/:id`               | any          | single plan                                        |
| POST   | `/plans`                   | any          | create a plan                                      |
| PATCH  | `/plans/:id`               | any          | update a plan                                      |
| DELETE | `/plans/:id`               | owner        | deactivate a plan (soft delete)                    |
| GET    | `/members`                 | any          | list (`?status` `?search` `?page` `?limit`)        |
| GET    | `/members/expiring`        | any          | expiring within N days (`?days`, default 7)        |
| GET    | `/members/stats`           | any          | status counts + new this / last month              |
| GET    | `/members/:id`             | any          | single member                                      |
| POST   | `/members`                 | any          | register a member (expiry auto-derived)            |
| PATCH  | `/members/:id`             | any          | update profile fields or status                    |
| POST   | `/members/:id/renew`       | any          | renew, restarting from the current expiry if ahead |
| DELETE | `/members/:id`             | owner        | hard delete                                        |
| POST   | `/payments`                | any          | record a payment                                   |
| GET    | `/payments`                | owner        | history (`?member` `?from` `?to` `?page` `?limit`) |
| GET    | `/payments/:id`            | owner        | single payment                                     |
| GET    | `/payments/analytics/revenue` | owner     | revenue summary + breakdowns (`?year`)             |
