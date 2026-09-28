import { JSDOM } from "jsdom";
import { describe, expect, inject, it } from "vitest";
import { ROUTES } from "./routes";

// Every image a page references must actually load as an image. The README
// screenshot goes through Astro's /_image optimiser, which answered 500 on
// the first public deploy because sharp wasn't a production dependency.
const baseUrl = inject("baseUrl");

describe("assets", () => {
  it("serves every image the pages reference", async () => {
    const seen = new Set<string>();
    for (const route of ROUTES) {
      const page = new URL(route, baseUrl);
      const doc = new JSDOM(await (await fetch(page)).text()).window.document;
      for (const img of doc.querySelectorAll("img[src]")) seen.add(new URL(img.getAttribute("src") ?? "", page).href);
    }
    expect(seen.size, "the README screenshot should be referenced").toBeGreaterThan(0);
    for (const src of seen) {
      const res = await fetch(src);
      expect(res.status, src).toBe(200);
      expect(res.headers.get("content-type"), src).toMatch(/^image\/(png|webp|jpeg|avif|svg\+xml)/);
    }
  });
});
