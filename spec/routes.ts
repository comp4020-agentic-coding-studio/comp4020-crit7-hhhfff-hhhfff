import { addDays, canberraNow } from "../src/lib/time";

// The routes the invariants run against. When you add a page, add its route
// here, or the invariants stop covering it. The booking form only renders for
// a slot that can still be booked, so that route is dated tomorrow.
const tomorrow = addDays(canberraNow().date, 1);

export const ROUTES = [
  "/",
  "/?library=Hancock",
  `/?library=Menzies&date=${tomorrow}`,
  "/book/",
  `/book/?space=chifley-gr-1&date=${tomorrow}&hour=9`,
  `/book/?space=chifley-gr-1&date=${tomorrow}&hour=9&error=Example+reason`,
  "/my/",
  "/my/?uid=u0000000",
  "/readme/",
];
