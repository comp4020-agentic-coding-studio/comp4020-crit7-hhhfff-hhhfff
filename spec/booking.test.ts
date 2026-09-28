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

describe("the grid", () => {
  it("says every cell's status in words, not colour alone, and labels every free link", async () => {
    await book("chifley-desk-1", inDays(1), 8, "u4000001");
    const html = await get(`/?library=Chifley&date=${inDays(1)}`);
    const cells = [...html.matchAll(/<td class="(\w+)"[^>]*>([\s\S]*?)<\/td>/g)];
    expect(cells.length).toBe(8 * 14);
    const word = { free: "Free", booked: "Booked", past: "Past" } as Record<string, string>;
    for (const [, state, inner] of cells) expect(inner).toContain(word[state]);
    // a screen reader hears which room and hour each Free link books
    expect(html).toMatch(/Free<span class="sr-only"[^>]*>: book Group Room 1 at 08:00<\/span>/);
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

describe("racing", () => {
  it("gives a contested slot to exactly one of many simultaneous requests", async () => {
    const date = inDays(8);
    const uids = ["u2000001", "u2000002", "u2000003", "u2000004", "u2000005", "u2000006"];
    const results = await Promise.all(uids.map((uid) => book("menzies-gr-3", date, 13, uid)));
    const winners = results.filter((r) => reasonOf(r) === null);
    expect(winners).toHaveLength(1);
    for (const r of results.filter((r) => reasonOf(r) !== null)) expect(reasonOf(r)).toMatch(/just been booked/);
  });
});

describe("live updates", () => {
  // Subscribe to the stream, act, then read until the matching event arrives.
  const expectEvent = async (act: () => Promise<unknown>, match: Record<string, unknown>) => {
    const stream = await fetch(new URL("/api/events", baseUrl));
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");
    await act();

    const decoder = new TextDecoder();
    let buffer = "";
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) throw new Error("stream ended before the event arrived");
        buffer += decoder.decode(value, { stream: true });
        for (const line of buffer.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));
          if (Object.entries(match).every(([k, v]) => event[k] === v)) return event;
        }
      }
    } finally {
      await reader.cancel();
    }
  };

  it("broadcasts a booking to every open grid", async () => {
    const date = inDays(9);
    const event = await expectEvent(() => book("hancock-gr-2", date, 9, "u3000001"), {
      type: "booked",
      space: "hancock-gr-2",
      date,
      hour: 9,
    });
    expect(event.library).toBe("Hancock");
  }, 10_000);

  it("broadcasts a cancellation so the slot shows free again", async () => {
    const date = inDays(10);
    await book("hancock-gr-2", date, 10, "u3000002");
    const id = (await get("/my/?uid=u3000002")).match(/name="id" value="(\d+)"/)?.[1] ?? "";
    await expectEvent(() => post("/api/cancel", { id, uid: "u3000002" }), {
      type: "cancelled",
      space: "hancock-gr-2",
      date,
      hour: 10,
    });
  }, 10_000);

  it("never broadcasts who booked", async () => {
    const date = inDays(11);
    const event = await expectEvent(() => book("hancock-gr-3", date, 11, "u3000003", "Private Person"), {
      space: "hancock-gr-3",
      date,
    });
    expect(JSON.stringify(event)).not.toMatch(/u3000003|Private Person/);
  }, 10_000);
});
