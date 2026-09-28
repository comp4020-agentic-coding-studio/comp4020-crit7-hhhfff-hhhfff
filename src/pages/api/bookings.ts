import type { APIRoute } from "astro";
import { createBooking } from "../../lib/db";
import { publishSlot } from "../../lib/events";
import { rememberBooker, withQuery } from "../../lib/flash";
import { normaliseUid, UID_PATTERN, validateRequest } from "../../lib/rules";

// Book a slot. A plain form POSTs here; the answer is always a 303, to
// My bookings on success or back to the booking form with the reason on
// failure — so the whole flow works with no JavaScript.
export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const form = Object.fromEntries(
    [...(await request.formData())].map(([k, v]) => [k, String(v)]),
  );
  const back = (reason: string) =>
    redirect(
      withQuery("/book/", {
        space: form.space ?? "",
        date: form.date ?? "",
        hour: form.hour ?? "",
        error: reason,
      }),
      303,
    );

  const uid = normaliseUid(form.uid ?? "");
  if (UID_PATTERN.test(uid)) rememberBooker(cookies, uid, (form.name ?? "").trim().slice(0, 80));

  const checked = validateRequest(form);
  if (!checked.ok) return back(checked.reason);

  const booked = createBooking(checked.value);
  if (!booked.ok) return back(booked.reason);

  const b = booked.value;
  publishSlot({ type: "booked", library: b.space.library, space: b.space.slug, date: b.date, hour: b.hour });
  return redirect(withQuery("/my/", { booked: b.id }), 303);
};
