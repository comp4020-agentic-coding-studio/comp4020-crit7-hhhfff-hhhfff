import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, asc, count, eq, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { type BookingRequest, MAX_HOURS_PER_DAY, type Result } from "./rules";
import { type Booking, bookings, type Space, spaces } from "./schema";
import { formatHour } from "./time";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");
client.pragma("foreign_keys = ON");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

export type { Booking, Space };
export type BookingWithSpace = Booking & { space: Space };

export function listLibraries(): string[] {
  return db
    .selectDistinct({ library: spaces.library })
    .from(spaces)
    .orderBy(asc(spaces.library))
    .all()
    .map((r) => r.library);
}

export function listSpaces(library: string): Space[] {
  return db
    .select()
    .from(spaces)
    .where(eq(spaces.library, library))
    .orderBy(asc(spaces.kind), asc(spaces.id))
    .all();
}

export function getSpace(slug: string): Space | undefined {
  return db.select().from(spaces).where(eq(spaces.slug, slug)).get();
}

// Every booking in one library on one day, keyed by "slug@hour" for the grid.
export function takenSlots(library: string, date: string): Set<string> {
  const rows = db
    .select({ slug: spaces.slug, hour: bookings.hour })
    .from(bookings)
    .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
    .where(and(eq(spaces.library, library), eq(bookings.date, date)))
    .all();
  return new Set(rows.map((r) => `${r.slug}@${r.hour}`));
}

export function bookingsForUid(uid: string, fromDate: string): BookingWithSpace[] {
  return db
    .select()
    .from(bookings)
    .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
    .where(and(eq(bookings.uid, uid), gte(bookings.date, fromDate)))
    .orderBy(asc(bookings.date), asc(bookings.hour))
    .all()
    .map((r) => ({ ...r.bookings, space: r.spaces }));
}

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === "SQLITE_CONSTRAINT_UNIQUE";
}

// Book a validated request. The daily-limit check and the insert run in one
// transaction; the unique index on (space, date, hour) is the final word on
// whether the slot is free, so two racing requests can't both win.
export function createBooking(req: BookingRequest): Result<BookingWithSpace> {
  const space = getSpace(req.space);
  if (!space) return { ok: false, reason: "That space doesn't exist." };

  try {
    return db.transaction((tx): Result<BookingWithSpace> => {
      const used =
        tx
          .select({ n: count() })
          .from(bookings)
          .where(and(eq(bookings.uid, req.uid), eq(bookings.date, req.date)))
          .get()?.n ?? 0;
      if (used >= MAX_HOURS_PER_DAY)
        return {
          ok: false,
          reason: `You already have ${MAX_HOURS_PER_DAY} hours booked that day — the daily limit.`,
        };
      const booking = tx
        .insert(bookings)
        .values({ spaceId: space.id, date: req.date, hour: req.hour, uid: req.uid, name: req.name })
        .returning()
        .get();
      return { ok: true, value: { ...booking, space } };
    });
  } catch (err) {
    if (isUniqueViolation(err))
      return {
        ok: false,
        reason: `${space.name} at ${formatHour(req.hour)} has just been booked by someone else.`,
      };
    throw err;
  }
}

// Cancel a booking, but only for the uID that made it.
export function cancelBooking(id: number, uid: string): BookingWithSpace | undefined {
  const booking = db
    .delete(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.uid, uid)))
    .returning()
    .get();
  if (!booking) return undefined;
  const space = db.select().from(spaces).where(eq(spaces.id, booking.spaceId)).get();
  return space && { ...booking, space };
}
