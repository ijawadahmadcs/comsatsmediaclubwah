# COMSATS Media Club Wah

The website of the COMSATS University Islamabad (Wah Campus) Media Club. It has three parts:

- **Public site.** Home, About, Team, Work gallery, and a Join form for membership applications.
- **Admin portal** (`/admin`). Staff review applications and payments, manage team members and the work gallery, and export applications. Superadmins also manage admin and Team Lead accounts and can read the activity log.
- **Team Lead portal** (`/team-lead`). Team Leads plan events for their own team, assign members, take attendance and rate members.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, MongoDB (Mongoose) and Cloudinary. It is deployed on Vercel.

## Getting started

You need:
- Node.js 24 LTS (22.12 or newer also works).
- A MongoDB database (MongoDB Atlas works).
- A Cloudinary account.

```sh
npm install
cp .env.example .env.local   # then fill in the values
npm run seed:admin           # creates the first superadmin account
npm run dev                  # http://localhost:3000
```

Sign in at `/admin/login` with `INITIAL_ADMIN_REGISTRATION_NUMBER` and `INITIAL_ADMIN_PASSWORD`. Run `npm run seed:admin` again whenever you need to reset that password; it also signs the account out everywhere.

## Environment variables

Every variable is documented in [.env.example](.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `ADMIN_SESSION_SECRET` | yes | Signs session cookies. At least 32 random characters. Changing it signs everyone out |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | yes | Media storage |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | no | Cloudflare Turnstile CAPTCHA on the join form. Set both or neither |
| `INITIAL_ADMIN_REGISTRATION_NUMBER`, `INITIAL_ADMIN_PASSWORD` | seed only | Read by `npm run seed:admin` |

If anything is missing or invalid, the server lists it in its log at startup.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates Next.js route types, then runs the TypeScript compiler |
| `npm test` | Unit and access-control tests (Vitest). No database needed |
| `npm run seed:admin` | Create the superadmin or reset its password |

GitHub Actions runs lint, typecheck, tests, the build and `npm audit` on every pull request.

## Deploying to Vercel

1. Import the repository in Vercel. The defaults for Next.js are correct.
2. Add the environment variables above for Production (and Preview, if you use preview deployments). Use a different `ADMIN_SESSION_SECRET` for each environment.
3. In MongoDB Atlas, allow connections from Vercel.
4. After the first deployment, run `npm run seed:admin` locally against the production database to create the superadmin.

`GET /api/health` returns 200 when the app is connected to the database and 503 when it is not.

## Accounts and roles

| Role | Can |
| --- | --- |
| Superadmin | Everything admins can, plus manage admin and Team Lead accounts and read the activity log at `/admin/activity` |
| Admin | Review applications and payments, export them, and manage team members and the work gallery |
| Team Lead | Use the Team Lead portal, for their own team only |

Every API route checks the caller's role on the server. The full table is in [tests/access-control.test.ts](tests/access-control.test.ts).

Sessions last 8 hours. They end straight away when an account is deactivated, its password changes, or the user signs out; signing out signs that account out on every device.

## Security notes

- Passwords: 12 to 72 characters, hashed with bcrypt. Repeated failed sign-ins are rate limited per IP address and per account.
- The join form is rate limited, validated on the server, and can require a Turnstile CAPTCHA. Applicant photos are resized in the browser and checked by file signature on the server.
- Staff uploads go straight from the browser to Cloudinary using short-lived signed requests, so large videos work despite Vercel's 4.5 MB request limit.
- Staff and Team Lead changes are written to an audit log.
- Security headers are set in `next.config.ts`. A strict Content-Security-Policy runs in report-only mode. Once the browser console shows no CSP reports in production, switch it to enforced.

## Project structure

```
app/(site)/     public pages (shared navbar and footer)
app/admin/      admin portal
app/team-lead/  Team Lead portal
app/api/        API route handlers
components/     shared React components
lib/            auth, validation, Cloudinary, rate limits, audit log, …
models/         Mongoose models
proxy.ts        portal redirects and cross-site request checks (Next.js middleware)
tests/          Vitest tests
```

Contributors and AI coding agents: read [AGENTS.md](AGENTS.md) for the rules every change must follow.
