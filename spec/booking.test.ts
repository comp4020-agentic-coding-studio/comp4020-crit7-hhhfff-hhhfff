import { describe, expect, inject, it } from "vitest";

// The booking app's contracts, driven over HTTP against the built server with
// a throwaway database (see global-setup.ts).
const baseUrl = inject("baseUrl");

describe("spaces", () => {
  it("lists every library's bookable spaces on the home page", async () => {
    const html = await (await fetch(baseUrl)).text();
    for (const library of ["Chifley", "Hancock", "Menzies"]) expect(html).toContain(library);
    expect(html).toContain("Group Room 1");
    expect(html).toContain("Study Booth");
  });
});
