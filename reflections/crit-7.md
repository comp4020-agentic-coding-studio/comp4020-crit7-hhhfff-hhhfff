# Crit 7 reflection

## What was the breakthrough that moved the work forward?

Deciding the plan before the build, and writing it down where the agent
could find it again. The first session produced no code at all: just a slice,
a data model, the booking rules, and seven stages that each had to end green
and committed. When I came back with a Fly token, one sentence was enough to
resume, and the build ran stage by stage without me re-explaining anything.
The plan was what made delegating safe, because every stage had a finish line
I could check.

The second breakthrough was smaller but sharper. With 112 tests passing, a
look at the grid in a real browser at phone width showed it was nearly three
times too wide. Green told me the contracts held; it told me nothing about
whether a student on a phone could use the page.

## What did this work change about who I want to be as a software developer?

I want to be the developer who decides what "right" means before the code
exists. Here that meant grounding the rules in ANU Library's real policy,
which moved the booking window from the 7 days I assumed to 14, and putting
the rule against double booking in the database rather than trusting code to
remember it.

I also want to stay suspicious of my own green checkmarks. The agent once
committed after a partial test run, and the result happened to be fine. That
it was fine is not the point. A rule only protects me if it is followed when
nobody is watching, so I would rather build habits, and harnesses, that make
the shortcut harder than the right step.
