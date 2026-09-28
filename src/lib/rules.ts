import { addDays, canberraNow, formatHour, isRealDate } from "./time";

// The booking rules, in one place. ANU Library's own rules are 2 hours a day
// per student and bookings up to two weeks ahead; opening hours are
// illustrative.
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 22;
export const MAX_HOURS_PER_DAY = 2;
export const MAX_DAYS_AHEAD = 14;
export const UID_PATTERN = /^u\d{7}$/;

export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

export type BookingRequest = {
  space: string;
  date: string;
  hour: number;
  uid: string;
  name: string;
};

export type Result<T> = { ok: true; value: T } | { ok: false; reason: string };

export function normaliseUid(raw: string): string {
  return raw.trim().toLowerCase();
}

// The dates a booking may fall on: today through MAX_DAYS_AHEAD days ahead.
export function bookableDates(now: Date = new Date()): string[] {
  const { date } = canberraNow(now);
  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => addDays(date, i));
}

// Can this slot still be booked? The hour in progress counts as bookable;
// an hour that has already ended does not.
export function slotOpen(date: string, hour: number, now: Date = new Date()): boolean {
  const today = canberraNow(now);
  if (date < today.date || date > addDays(today.date, MAX_DAYS_AHEAD)) return false;
  return date > today.date || hour >= today.hour;
}

// Everything that can be checked without the database. Capacity (is the slot
// free, is the daily limit reached) is checked in the same transaction as the
// insert, in db.ts.
export function validateRequest(
  input: Record<string, string>,
  now: Date = new Date(),
): Result<BookingRequest> {
  const uid = normaliseUid(input.uid ?? "");
  const name = (input.name ?? "").trim();
  const date = (input.date ?? "").trim();
  const hour = Number(input.hour);
  const space = (input.space ?? "").trim();

  if (!UID_PATTERN.test(uid))
    return { ok: false, reason: "Your uID should be a u followed by 7 digits, like u1234567." };
  if (!name) return { ok: false, reason: "Please enter your name." };
  if (name.length > 80) return { ok: false, reason: "Please keep your name under 80 characters." };
  if (!space) return { ok: false, reason: "Choose a space to book." };
  if (!isRealDate(date)) return { ok: false, reason: "That date isn't valid." };
  if (!Number.isInteger(hour) || hour < OPEN_HOUR || hour >= CLOSE_HOUR)
    return {
      ok: false,
      reason: `Bookings run on the hour from ${formatHour(OPEN_HOUR)} to ${formatHour(CLOSE_HOUR)}.`,
    };
  const today = canberraNow(now).date;
  if (date > addDays(today, MAX_DAYS_AHEAD))
    return { ok: false, reason: `You can book up to ${MAX_DAYS_AHEAD} days ahead.` };
  if (!slotOpen(date, hour, now)) return { ok: false, reason: "That time has already passed." };

  return { ok: true, value: { space, date, hour, uid, name } };
}
