# Process overview

## What I built

A booking app for ANU Library study rooms and seats: one grid per library per
day, book a free hour in one step, cancel from My bookings, and every open
grid updates live. `README.md` says what good means here and why.

## How I got here

I started from the brief ("the ANU system you wish existed") and picked
library room booking because it is a real, daily annoyance with clear rules I
could check against ANU Library's own pages. In the first session I had the
agent read the brief, spec and starter, then agree a plan with me before any
code: the slice, the data model, the booking rules, and seven stages, each
ending in a green `pnpm check` and a commit. The plan was saved to the agent's
memory so the build could resume in a new session once my Fly token was in
place. The second session opened with:

> fly token已经完成配置，请从持久记忆查看上一次对话的crit7的记忆并开始执行，每完成一个阶段就自动commit一下，同时更新specification
>
> (The Fly token is configured; read last session's crit 7 memory and start
> executing, commit automatically after each stage, and update the spec as
> you go.)

The first commit is the harness, not code:
[`767ad3a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/767ad3a)
writes the rules into `CLAUDE.md` — schema changes only through
`schema.ts` and a generated migration, every page in `spec/routes.ts`, every
form usable without JavaScript, booking rules enforced on the server, tests
and README updated in the same commit as the behaviour they describe.

Then the data layer,
[`5871b43`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/5871b43).
Two things changed here from the plan. Checking ANU's live booking page
showed the window is two weeks, not the 7 days I had planned, so the rule
became 14 days. And drizzle-kit would not generate the migration
non-interactively because it wanted to ask whether `messages` had been
renamed, so the agent split it into a drop migration and a create migration
rather than hand-editing SQL. Double booking is refused by a unique index,
not just a check in code.

The core flow,
[`85a6db8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/85a6db8),
landed with its contracts in `spec/booking.test.ts`, driven over HTTP against
the built server. The first deploy,
[`c00debd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/c00debd),
was verified by hand with curl: book, reload, restart the machine, and the
booking was still there. The live grid and the race and broadcast contracts
came next in
[`2dec3c5`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/2dec3c5).

The tests were green throughout, but they could not see layout. A pass in a
real browser with 360px emulation,
[`618f7a8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/commit/618f7a8),
found the grid page was 966px wide on a phone: the screen-reader labels in
each cell were absolutely positioned and escaped the scroll container. Same
pass confirmed a booking made through the form in one tab flipped the cell in
another. That is the gap the README names between what `spec/` enforces and
what I judged by hand.

One slip worth recording: once the agent committed after running a single
test file against a stale build instead of the full `pnpm check`. It re-ran
the full suite straight after and the commit was green, but it is exactly
the kind of shortcut the "green before commit" rule exists to stop.

The whole build:
[`767ad3a...618f7a8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-hhhfff-hhhfff/compare/767ad3a...618f7a8).
