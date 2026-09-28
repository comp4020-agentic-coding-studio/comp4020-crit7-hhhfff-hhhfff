import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

// A bookable place in a library: a group study room or a single seat. The
// rows are seeded by a migration (drizzle/0002_*), so every environment has
// the same spaces.
export const spaces = sqliteTable("spaces", {
  id: int().primaryKey({ autoIncrement: true }),
  slug: text().notNull().unique(),
  name: text().notNull(),
  library: text().notNull(),
  kind: text({ enum: ["group", "seat"] }).notNull(),
  capacity: int().notNull(),
  features: text().notNull().default(""),
});

// One booking is one space for one hour on one day. The unique constraint is
// what makes a double booking impossible, even if two requests race.
export const bookings = sqliteTable(
  "bookings",
  {
    id: int().primaryKey({ autoIncrement: true }),
    spaceId: int("space_id")
      .notNull()
      .references(() => spaces.id),
    date: text().notNull(), // YYYY-MM-DD, Canberra time
    hour: int().notNull(), // start hour, 8..21
    uid: text().notNull(),
    name: text().notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    unique("bookings_slot_unique").on(t.spaceId, t.date, t.hour),
    index("bookings_uid_date_idx").on(t.uid, t.date),
  ],
);

export type Space = typeof spaces.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
