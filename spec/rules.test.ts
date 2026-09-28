import { describe, expect, it } from "vitest";
import { bookableDates, slotOpen, validateRequest } from "../src/lib/rules";
import { canberraNow } from "../src/lib/time";

// The booking rules as pure functions, pinned to a fixed clock: 10:30 on
// Wed 1 Oct 2025 in Canberra (AEST, UTC+10) is 00:30 UTC.
const now = new Date("2025-10-01T00:30:00Z");
const good = { space: "chifley-gr-1", date: "2025-10-02", hour: "10", uid: "u1234567", name: "Ada" };

describe("booking rules", () => {
  it("reads the clock in Canberra time, not the server's", () => {
    expect(canberraNow(now)).toEqual({ date: "2025-10-01", hour: 10 });
    // 14:00 UTC is already tomorrow in Canberra
    expect(canberraNow(new Date("2025-10-01T14:00:00Z")).date).toBe("2025-10-02");
  });

  it("accepts a well-formed request and normalises the uID", () => {
    const r = validateRequest({ ...good, uid: " U1234567 " }, now);
    expect(r).toEqual({ ok: true, value: { ...good, hour: 10, uid: "u1234567" } });
  });

  it.each([
    ["a malformed uID", { uid: "1234567" }, /uID/],
    ["a missing name", { name: "  " }, /name/],
    ["a slot before opening", { hour: "7" }, /08:00/],
    ["a slot at closing", { hour: "22" }, /22:00/],
    ["a half hour", { hour: "10.5" }, /on the hour/],
    ["an impossible date", { date: "2025-02-30" }, /date/],
    ["yesterday", { date: "2025-09-30" }, /passed/],
    ["an hour already over today", { date: "2025-10-01", hour: "9" }, /passed/],
    ["more than 14 days ahead", { date: "2025-10-16" }, /14 days/],
  ])("rejects %s with a reason", (_, patch, reason) => {
    const r = validateRequest({ ...good, ...patch }, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(reason);
  });

  it("lets you book the hour in progress and exactly 14 days ahead", () => {
    expect(slotOpen("2025-10-01", 10, now)).toBe(true);
    expect(slotOpen("2025-10-15", 21, now)).toBe(true);
  });

  it("offers today plus the next 14 days", () => {
    const dates = bookableDates(now);
    expect(dates[0]).toBe("2025-10-01");
    expect(dates).toHaveLength(15);
    expect(dates.at(-1)).toBe("2025-10-15");
  });
});
