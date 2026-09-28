// Every date and hour in the app is Canberra wall-clock time, whatever
// timezone the server (UTC on Fly) or the visitor is in.
export const TIME_ZONE = "Australia/Sydney";

const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

// Today's date (YYYY-MM-DD) and the current hour (0..23) in Canberra.
export function canberraNow(now: Date = new Date()): { date: string; hour: number } {
  const p = Object.fromEntries(parts.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Calendar arithmetic on YYYY-MM-DD strings; done in UTC so DST never shifts it.
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isRealDate(date: string): boolean {
  return DATE_PATTERN.test(date) && addDays(date, 0) === date;
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-AU", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
