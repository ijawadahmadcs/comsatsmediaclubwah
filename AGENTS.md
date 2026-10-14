# AGENTS.md

Instructions for AI coding agents (and new contributors) working on the COMSATS Media Club Wah website.
Read this before changing code. [README.md](README.md) covers setup and deployment.

## Stack

- Next.js 16 App Router with Turbopack, React 19, TypeScript (strict), Tailwind CSS v4.
- MongoDB through Mongoose 9. Cloudinary for photos and videos.
- Hosted on Vercel. API request bodies are limited to 4.5 MB there.
- Tests: Vitest (`tests/`). CI: `.github/workflows/ci.yml`.

Next.js 16 differs from older versions you may know:
- Middleware lives in `proxy.ts` (exported function `proxy`), not `middleware.ts`.
- `next build` no longer runs ESLint, so run `npm run lint` yourself.
- Route and page `params` are Promises: `{ params }: { params: Promise<{ id: string }> }`.
- `next/image` uses `preload`; `priority` is deprecated.
- `LayoutProps`, `PageProps` and `RouteContext` are global types created by `next typegen` (run by `npm run typecheck`).
- Docs for the installed version are in `node_modules/next/dist/docs/`. Check them before using an API you are unsure about.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run lint` | ESLint. Must pass with no errors or warnings |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` |
| `npm test` | Vitest (no database or Cloudinary account needed) |
| `npm run build` | Production build |
| `npm run seed:admin` | Creates the superadmin, or resets its password, from `INITIAL_ADMIN_*` |

## Environment variables

Listed and explained in [.env.example](.env.example); copy it to `.env.local`. `lib/env.ts` logs missing or invalid values at startup (`instrumentation.ts`). If you add a variable, add it to `.env.example`, `lib/env.ts` and the README.

## Layout

- `app/(site)/` — public pages. `app/(site)/layout.tsx` adds the public navbar and footer.
- `app/admin/` — admin portal (staff). `app/team-lead/` — Team Lead portal. Neither shows the public navbar.
- `app/api/` — route handlers. Route files may export only HTTP handlers and route config such as `runtime`; put helpers in `lib/`.
- `lib/` — shared helpers (auth, validation, Cloudinary, rate limits, audit log). `models/` — typed Mongoose models.
- `proxy.ts` — redirects portal pages by role, and blocks cross-site or non-JSON/multipart API writes.
- Pages are client components that load data from `/api/*`.

## Access control (always)

Roles: `superadmin`, `admin` (together: "staff"), and `teamlead` (limited to one team).

1. Every API handler starts with a guard and returns its response when the check fails:
   ```ts
   const auth = await requireApiStaff();
   if (!auth.ok) return auth.response;
   ```
   - Admin portal APIs: `requireApiStaff()` (`lib/auth.ts`).
   - Account management, Team Lead management, activity log: `requireApiSuperAdmin()`.
   - Team Lead APIs: `requireTeamLead()` (`lib/requireTeamLead.ts`), and filter every query by the lead's team with `getTeamScope(auth.account.team)`.
   - `requireApiSession()` (any role) only for endpoints every role needs, such as `/api/auth/me`.
2. Guards return 401 (no, expired or revoked session), 403 (wrong role) and 503 (database unreachable). Clients must not treat 503 as "signed out".
3. `proxy.ts` is not access control. Never rely on it to protect data.
4. **`tests/access-control.test.ts` lists who may call every API handler.** When you add, remove or change a route or method, update its `ACCESS` table. The test fails for any handler that is not listed.
5. Sessions are signed cookies carrying the account's `sessionVersion`. Call `revokeSessions(id)` (or increment `sessionVersion`) when a password changes, an account is deactivated, or the user signs out.
6. Validate passwords with `getPasswordError()` (`lib/password.ts`) everywhere: API, UI and the seed script.
7. Superadmin accounts cannot be edited or deleted through the API. Keep it that way.

## Personal data

- Public endpoints (`GET /api/team`, `GET /api/work`) return an explicit allow-list of fields, never whole documents.
- Team members are published only through `toPublicMembers()` (`lib/teamMembers.ts`): no registration numbers, departments or application links, and phone numbers only for core office-bearers.
- `TeamMember` is the single source of truth for who is on the team. Use the helpers in `lib/teamMembers.ts`. A member created from an application is visible only while that application is Accepted.
- Only store or render image URLs that pass `isOwnCloudinaryImageUrl()`. Never build CSS `url()` values from data.
- Exports: pass every cell through `safeSpreadsheetCell()` (`lib/spreadsheet.ts`) to stop spreadsheet formula injection.
- Never log secrets or personal data. Use `logServerError()` / `serverError()` (`lib/api.ts`), which redact connection strings and keys.

## Input and errors

- Read bodies with `readJsonObject()`. Check every field's type and length; checking that strings are strings is what stops MongoDB operator injection.
- Check ids with `mongoose.isValidObjectId()`. Return 400/404 with `jsonError()`, never an unhandled 500.
- Error JSON is `{ success: false, message, error }` (admin pages read `message`, Team Lead pages read `error`).
- Search input goes through `escapeRegex()`. The applications list and export share `buildApplicationFilter()`, so they always match.
- Event dates are ISO strings with a time zone (`parseEventDate()`). Send `date.toISOString()` from the browser.
- Browser writes must send `Content-Type: application/json` (or multipart). `proxy.ts` rejects other body types and cross-site requests.

## Uploads

- Admin media goes straight from the browser to Cloudinary. The browser gets a signature from `POST /api/uploads/signature` (purposes and limits in `lib/mediaRules.ts`) and calls `uploadDirectToCloudinary()` (`lib/directUpload.ts`). It then sends only the `publicId` to the API, which calls `verifyDirectUpload()`. Do not post files to API routes, because of the 4.5 MB body limit.
- The one exception is the join form photo. The browser resizes it first, it is under 4 MB, and the server checks its file signature (`detectImageType()`) before uploading it.
- When a photo is replaced or removed, delete it with `destroyUnreferencedImages()` or `destroyCloudinaryUrls()`.
- A new external origin for images, media, scripts or API calls must also be added to the CSP in `next.config.ts`.

## Abuse protection and auditing

- Sign-in and the public application form are rate limited (`lib/rateLimit.ts`, stored in MongoDB). Sign-in counts only failed attempts.
- The join form uses Cloudflare Turnstile when its keys are set (`lib/turnstile.ts`).
- After every state-changing staff or Team Lead action, call `recordAudit(auth.account, { action, targetType, targetId, details })` (`lib/audit.ts`). Superadmins read the log at `/admin/activity`. Never put passwords or tokens in `details`.

## Conventions

- Mongoose 9:
  - `await doc.populate()` (`execPopulate()` is gone).
  - `returnDocument: "after"` instead of `new: true`.
  - Typed models: `(mongoose.models.X as Model<IX> | undefined) ?? mongoose.model<IX>("X", schema)`.
  - Clear fields with `$unset` (Mongoose drops `undefined` values from updates).
- Tailwind v4 colours are `gray-*`, never `grey-*`.
- Images use `next/image`. Add `unoptimized` for Cloudinary URLs (no remote patterns are configured), and `preload` only on the hero image.
- Match the surrounding code's style. Keep comments short and explain why, not what.

## Git workflow (always)

Never commit or push to `main` directly. Every change reaches `main` through a pull request.

1. **Start from an up-to-date `main` on a new branch** for each piece of work:
   ```sh
   git switch main
   git pull --ff-only origin main
   git switch -c fix/event-time-zone-shift
   ```
2. **Name the branch after what it is for:** `<type>/<short-description-in-kebab-case>`.
   - `feat/` new feature, `fix/` bug or security fix, `refactor/` code change with no behaviour change, `docs/` documentation only, `test/` tests only, `chore/` dependencies, tooling or CI.
   - Good: `fix/security-audit-findings`, `feat/attendance-export`, `docs/deployment-guide`, `chore/upgrade-next-16-4`.
   - Bad: `update`, `changes`, `new-branch`, `ali-work`, `test2`. A reader must know the purpose from the name alone.
   - One topic per branch. Put unrelated changes on their own branch and pull request.
3. **Commit in small, logical steps.**
   - Subject line: imperative, at most 72 characters, says what changes (`Fix event dates shifting by the time-zone offset`, not `bugs fixed`).
   - Body: why the change was needed and anything a reviewer should know.
   - Stage explicit paths (`git add app/api/team lib/teamMembers.ts`), not `git add .`, so local files are never committed by accident.
   - Never commit `.env*` files (except `.env.example`), secrets, or local reports and notes.
4. **Run the checks** in "Before you finish" below. Push only when they pass.
5. **Push the branch and open a pull request** against `main`:
   ```sh
   git push -u origin fix/event-time-zone-shift
   gh pr create --base main --title "Fix event dates shifting by the time-zone offset" --body-file pr.md
   ```
   The title says what the pull request does. The description covers:
   - what changed and why;
   - how it was tested;
   - anything a reviewer or deployer must do (new environment variables, data changes, visible UI changes).
6. **Update the branch, not `main`.** Push follow-up commits to the same branch; the pull request updates itself. If `main` moves on, run `git merge origin/main` on your branch and re-run the checks. Do not force-push a branch someone else is reviewing.
7. **Merge only when CI passes** and the pull request has been reviewed. Then delete the branch.

## Before you finish

```sh
npm run lint && npm run typecheck && npm test && npm run build
```
