# COMSATS Media Club Wah

The official website and internal management system for the COMSATS University Islamabad, Wah Campus Media Club.

## What the application does

- **Public website** (`/`): club information, faculty and president messages, team directory, work gallery, and the membership application form at `/join`.
- **Admin portal** (`/admin`): application and payment review, team-member management, work-gallery management, application exports, account management, and activity logs.
- **Team Lead portal** (`/team-lead`): team-scoped event planning, member assignment, attendance, and member ratings.
- **API** (`/api`): authenticated portal APIs, public team and work data, application submission, uploads, authentication, and health checks.

The project uses Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, MongoDB with Mongoose, Cloudinary, and Vercel.

## Requirements

- Node.js 22.12 or newer. Node.js 24 LTS is recommended.
- npm.
- MongoDB, either local or MongoDB Atlas.
- Cloudinary for staff media and applicant photos.
- Cloudflare Turnstile, optional for the public join form.

## Local setup

1. Install dependencies:

	```sh
	npm install
	```

2. Create `.env.local` from `.env.example` and fill in the required values.

	macOS/Linux:

	```sh
	cp .env.example .env.local
	```

	Windows PowerShell:

	```powershell
	Copy-Item .env.example .env.local
	```

3. Create the first superadmin account:

	```sh
	npm run seed:admin
	```

4. Start the development server:

	```sh
	npm run dev
	```

Open [http://localhost:3000](http://localhost:3000). Staff sign in at `/admin/login` with the registration number and password configured by the seed variables. Running the seed command again resets that account's password and revokes its existing sessions.

## Configuration

All variables are documented in [.env.example](.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string beginning with `mongodb://` or `mongodb+srv://`. |
| `ADMIN_SESSION_SECRET` | Yes | Signs admin and Team Lead session cookies. Use at least 32 random characters. Changing it signs everyone out. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary server-side API key. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary server-side API secret. Never expose it to the browser. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Public Turnstile site key for the join form. Set it together with the secret key. |
| `TURNSTILE_SECRET_KEY` | No | Server-side Turnstile secret. Set it together with the site key. |
| `INITIAL_ADMIN_REGISTRATION_NUMBER` | Seed only | Registration number used by `npm run seed:admin`. |
| `INITIAL_ADMIN_PASSWORD` | Seed only | Initial or replacement password. It must be 12-72 characters with no leading or trailing spaces. |

Missing or invalid runtime configuration is reported in the server log by `lib/env.ts`. Do not commit `.env.local` or any secret values.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm start` | Start the production server after `npm run build`. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Generate Next.js route types and run TypeScript without emitting files. |
| `npm test` | Run the Vitest suite. Tests do not require MongoDB or Cloudinary. |
| `npm run seed:admin` | Create the initial superadmin or reset its password. |

Before opening a pull request, run:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The CI workflow also runs `npm audit` on pull requests.

## Portals and permissions

| Role | Permissions |
| --- | --- |
| Superadmin | All staff capabilities, plus admin and Team Lead account management and activity-log access. |
| Admin | Review applications and payments, manage team members and work assets, and export applications. |
| Team Lead | Manage events and members for the assigned team only. |

Every API handler enforces authorization on the server. `proxy.ts` only handles navigation and request filtering; it is not a replacement for API access control. The complete route permission table is maintained in [tests/access-control.test.ts](tests/access-control.test.ts).

Sessions last eight hours. Sessions are revoked when a user signs out, changes password, or is deactivated. Signing out revokes all sessions for that account.

## API areas

- `/api/auth/*`: login, logout, and current-session checks.
- `/api/team` and `/api/work`: public allow-listed team and gallery data.
- `/api/applications`: public membership applications and staff review, detail, and export operations.
- `/api/admin/*`: staff statistics, team management, Team Lead management, and activity logs.
- `/api/team-lead/*`: Team Lead dashboard, team-scoped events, and member operations.
- `/api/uploads/signature`: short-lived Cloudinary upload signatures for authorized staff.
- `/api/health`: returns `200` when MongoDB is available and `503` when it is unavailable.

Request validation, role checks, personal-data filtering, and audit logging are part of the API contract. When adding or changing a route, update the access-control table and its tests.

## Media and uploads

Staff photos and videos upload directly from the browser to Cloudinary using a short-lived server signature. The application API receives a verified Cloudinary public ID instead of a file, which avoids Vercel's 4.5 MB request-body limit.

The join form is the only file-upload exception: the browser resizes the applicant photo, the server checks its file signature, and the resulting image is uploaded securely. Cloudinary URLs are validated before they are stored or rendered. When replacing or removing media, delete unreferenced Cloudinary assets through the existing cleanup helpers.

## Security and privacy

- Passwords are validated and hashed with bcrypt; failed sign-ins and public applications are rate limited.
- Turnstile can protect the join form when both Turnstile variables are configured.
- Public APIs return explicit field allow-lists and do not expose registration numbers, departments, or application links.
- Staff and Team Lead state changes create audit-log entries without passwords or tokens.
- Security headers are configured in [next.config.ts](next.config.ts), including clickjacking, MIME-sniffing, referrer, permissions, and transport protections.
- The full Content Security Policy currently runs in report-only mode alongside the enforced baseline policy. Review production browser reports before enforcing the full policy.

## Deployment on Vercel

1. Import the repository into Vercel using the default Next.js settings.
2. Add all required runtime variables to the Production environment. Add optional Turnstile variables as a pair. Use a different session secret for each environment.
3. Configure MongoDB Atlas to accept connections from the deployment environment.
4. Configure the Cloudinary account used by that environment.
5. Deploy and verify `/api/health`.
6. Run `npm run seed:admin` locally with the production values loaded to create the first superadmin.
7. Sign in at `/admin/login`, change or rotate credentials as appropriate, and verify public application and media workflows.

Do not put database credentials, Cloudinary secrets, or session secrets in client-side variables or source control.

## Project structure

```text
app/(site)/     Public pages with the shared navbar and footer
app/admin/      Admin portal pages
app/team-lead/  Team Lead portal pages
app/api/        Next.js route handlers
components/     Shared React components
lib/            Authentication, validation, uploads, rate limits, audit, and helpers
models/         Typed Mongoose models
public/         Static team and work assets
proxy.ts        Portal redirects and cross-site/API request checks
tests/          Vitest, validation, privacy, session, proxy, and access-control tests
```

## Contributing

Read [AGENTS.md](AGENTS.md) before making changes. Work from an up-to-date `main` branch on a purpose-named branch such as `feat/attendance-export` or `fix/event-time-zone-shift`. Keep changes focused, update tests and documentation when behavior changes, and open a pull request rather than pushing directly to `main`.
