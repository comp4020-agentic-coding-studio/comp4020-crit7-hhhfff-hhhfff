import { describe, expect, inject, it } from "vitest";
import { addDays, canberraNow } from "../src/lib/time";

// The booking app's contracts, driven over HTTP against the built server with
// a throwaway database (see global-setup.ts). Each test books its own space
// and day so the tests don't depend on each other's state.
const baseUrl = inject("baseUrl");
const today = canberraNow().date;
const inDays = (n: number) => addDays(today, n);

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
const post = (path: string, fields: Record<string, string | number>) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body: new URLSearchParams(Object.entries(fields).map(([k, v]) => [k, String(v)])),
    redirect: "manual",
  });

const get = async (path: string) => (await fetch(new URL(path, baseUrl))).text();

const book = (space: string, date: string, hour: number, uid = "u1234567", name = "Test Student") =>
  post("/api/bookings", { space, date, hour, uid, name });

// The state of one grid cell, read from the server-rendered page.
const cell = async (library: string, date: string, space: string, hour: number) => {
  const html = await get(`/?library=${library}&date=${date}`);
  const match = html.match(new RegExp(`<td class="(\\w+)" data-space="${space}" data-hour="${hour}"`));
  return match?.[1];
};

const reasonOf = (res: Response) =>
  new URL(res.headers.get("location") ?? "", baseUrl).searchParams.get("error");

describe("spaces", () => {
  it("lists every library's bookable spaces", async () => {
    for (const library of ["Chifley", "Hancock", "Menzies"]) {
      const html = await get(`/?library=${library}`);
      expect(html).toContain(`${library} Library`);
      expect(html).toContain("Group Room 1");
    }
    expect(await get("/?library=Chifley")).toContain("Study Booth");
  });
});

describe("booking", () => {
  it("books a free slot, sends you to My bookings, and survives a reload", async () => {
    const date = inDays(1);
    expect(await cell("Chifley", date, "chifley-gr-1", 10)).toBe("free");

    const res = await book("chifley-gr-1", date, 10, "u1000001", "Ada");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toMatch(/^\/my\/\?booked=\d+$/);

    // a fresh load of the grid, as anyone, shows it taken
    expect(await cell("Chifley", date, "chifley-gr-1", 10)).toBe("booked");
    // and it's listed under the booker's uID
    const mine = await get("/my/?uid=u1000001");
    expect(mine).toContain("Group Room 1, Chifley Library");
    expect(mine).toContain("10:00");
  });

  it("refuses a double booking and leaves the first one in place", async () => {
    const date = inDays(2);
    expect((await book("hancock-gr-1", date, 14, "u1000002")).status).toBe(303);

    const second = await book("hancock-gr-1", date, 14, "u1000003");
    expect(second.headers.get("location")).toMatch(/^\/book\//);
    expect(reasonOf(second)).toMatch(/just been booked/);

    expect(await get("/my/?uid=u1000002")).toContain("14:00");
    expect(await get("/my/?uid=u1000003")).toContain("No upcoming bookings");
  });

  it("refuses a third hour on the same day for one uID", async () => {
    const date = inDays(3);
    for (const hour of [9, 10]) expect(reasonOf(await book("menzies-gr-1", date, hour, "u1000004"))).toBeNull();

    const third = await book("menzies-gr-2", date, 11, "u1000004");
    expect(reasonOf(third)).toMatch(/daily limit/);
    expect(await cell("Menzies", date, "menzies-gr-2", 11)).toBe("free");

    // the next day is a fresh allowance
    expect(reasonOf(await book("menzies-gr-2", inDays(4), 11, "u1000004"))).toBeNull();
  });

  it.each([
    ["a malformed uID", { uid: "12345" }, /uID/],
    ["a missing name", { name: "" }, /name/],
    ["a past day", { date: inDays(-1) }, /passed/],
    ["a day beyond the window", { date: inDays(15) }, /14 days/],
    ["an hour outside opening", { hour: 22 }, /22:00/],
    ["a space that doesn't exist", { space: "nowhere" }, /doesn't exist/],
  ])("refuses %s with a reason and books nothing", async (_, patch, reason) => {
    const fields = { space: "chifley-gr-2", date: inDays(5), hour: 12, uid: "u1000005", name: "Bo", ...patch };
    const res = await post("/api/bookings", fields);
    expect(res.status).toBe(303);
    expect(reasonOf(res)).toMatch(reason);
    // the reason is shown on the page the user is sent back to
    const back = await get(res.headers.get("location") ?? "/");
    expect(back).toContain("Not booked.");
  });

  it("booked nothing for any refused request", async () => {
    expect(await get("/my/?uid=u1000005")).toContain("No upcoming bookings");
  });
});

describe("cancelling", () => {
  it("frees the slot for everyone", async () => {
    const date = inDays(6);
    await book("chifley-gr-3", date, 15, "u1000006");
    const mine = await get("/my/?uid=u1000006");
    const id = mine.match(/name="id" value="(\d+)"/)?.[1];
    expect(id).toBeDefined();

    const res = await post("/api/cancel", { id: id ?? "", uid: "u1000006" });
    expect(res.headers.get("location")).toMatch(/cancelled=/);
    expect(await cell("Chifley", date, "chifley-gr-3", 15)).toBe("free");
  });

  it("only lets the booker cancel", async () => {
    const date = inDays(7);
    await book("chifley-gr-4", date, 16, "u1000007");
    const id = (await get("/my/?uid=u1000007")).match(/name="id" value="(\d+)"/)?.[1] ?? "";

    const res = await post("/api/cancel", { id, uid: "u1000008" });
    expect(reasonOf(res)).toMatch(/wasn't found/);
    expect(await cell("Chifley", date, "chifley-gr-4", 16)).toBe("booked");
  });
});
