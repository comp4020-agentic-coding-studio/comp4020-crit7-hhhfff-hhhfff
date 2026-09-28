import type { AstroCookies } from "astro";

// Who you are, remembered between visits so you don't retype it. There is no
// login: the uID is self-declared (see README).
const YEAR = 60 * 60 * 24 * 365;

export function rememberBooker(cookies: AstroCookies, uid: string, name: string): void {
  const options = { path: "/", httpOnly: true, sameSite: "lax" as const, maxAge: YEAR };
  cookies.set("uid", uid, options);
  cookies.set("name", name, options);
}

export function readBooker(cookies: AstroCookies): { uid: string; name: string } {
  return { uid: cookies.get("uid")?.value ?? "", name: cookies.get("name")?.value ?? "" };
}

// Build a same-site redirect target with query parameters.
export function withQuery(path: string, params: Record<string, string | number>): string {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return `${path}?${q}`;
}
