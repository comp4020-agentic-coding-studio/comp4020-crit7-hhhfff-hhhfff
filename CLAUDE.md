# Harness rules — ANU Library study-space booking (crit 7)

The app: book ANU Library study rooms and seats by the hour. Server-rendered
Astro + Drizzle + SQLite, one Fly machine, one volume. `README.md` says what
good looks like and why; these are the rules that follow from it.

## Before every commit

- `pnpm check` must be green (typecheck + build + every `spec/*.test.ts`).
  Never commit red, never skip or delete a test to get green.
- One stage per commit, message says what the stage delivers. Push to `main`.
- Never commit secrets: `mise.local.toml` holds the Fly token and stays untracked.

## Data

- The schema lives only in `src/lib/schema.ts`. To change it: edit there, run
  `pnpm db:generate`, commit the generated migration in `drizzle/`. Never edit
  a migration that has been deployed; never touch the database by hand.
- Seed data (the spaces) ships as a migration so production gets the same rows
  at boot. Anything not taken from a public ANU Library page is marked
  illustrative in `README.md`.
- Double-booking is prevented by the database (unique space + date + hour),
  not only by a check in code.

## Booking rules (enforced on the server, never only in the browser)

- One-hour slots, 08:00–22:00, Canberra time (`Australia/Sydney`).
- Bookable from today up to 7 days ahead; no past slots.
- At most 2 hours per uID per day. uID format: `u` + 7 digits.
- Every rejection returns the user to the form with a plain-English reason and
  changes nothing in the database.

## Pages

- Every page works without JavaScript: forms POST, the server answers 303.
  JavaScript (the SSE live grid) is an enhancement only.
- Every new page goes into `spec/routes.ts` so the invariants cover it.
- Status is never shown by colour alone (text or icon too); every control is
  reachable by keyboard; layouts work at 360px wide.

## Don't touch

- `fly.toml` machine / volume / auto-stop settings, the `Dockerfile` shape, the
  CI workflow, and Astro's CSRF / `allowedDomains` config.
- `spec/invariants.test.ts`, `spec/readme.test.ts`, `spec/global-setup.ts`.

## Spec

- Contracts the brief makes checkable live in `spec/booking.test.ts` and test
  behaviour over HTTP (what the page must do), not implementation.
- When a stage changes behaviour, update the tests and `README.md` in the same
  commit.
- Deploy: `flyctl deploy --remote-only --ha=false -a comp4020-crit7-hhhfff-hhhfff`,
  then curl the live site to verify load → book → reload persists.
