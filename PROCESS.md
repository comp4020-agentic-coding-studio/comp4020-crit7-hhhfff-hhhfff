# Process overview

## What I built

A booking app for ANU Library study rooms and seats: one grid per library per
day, a free hour booked in one step, and every open grid updated live.
`README.md` argues what good means here.

## How I got here

I chose library booking because its rules are real and checkable against ANU
Library's own pages. Before any code, the agent and I agreed a plan of seven
stages, each ending in a green `pnpm check` and a commit, and saved it to
memory so a second session could resume it:

> read last session's crit 7 memory and start executing, commit after each
> stage, and update the spec as you go

The first commit is the harness, not code:
[`767ad3a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/767ad3a)
sets the rules in `CLAUDE.md`: server-enforced booking rules, no-JavaScript
forms, every page in `spec/routes.ts`, tests updated with behaviour.

In the data layer,
[`5871b43`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/5871b43),
checking ANU's live booking page changed the window from 7 to 14 days, and a
unique index makes double booking impossible in the database. The core flow
[`85a6db8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/85a6db8)
arrived with HTTP contracts in `spec/booking.test.ts`; the first deploy
[`c00debd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/c00debd)
was checked by booking, restarting the machine, and finding the booking
intact.

The suite was green, but blind to layout. A real-browser pass at 360px,
[`618f7a8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/618f7a8),
found the grid page 966px wide on a phone, which no test had caught.

One slip: the agent once committed after running one test against a stale
build. The full suite passed straight after, but that is the shortcut the
green-before-commit rule exists to stop.

Whole build:
[`767ad3a...618f7a8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/compare/767ad3a...618f7a8).
