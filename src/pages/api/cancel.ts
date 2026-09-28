import type { APIRoute } from "astro";
import { cancelBooking } from "../../lib/db";
import { publishSlot } from "../../lib/events";
import { readBooker, withQuery } from "../../lib/flash";
import { normaliseUid } from "../../lib/rules";

// Cancel one of your bookings. Only the uID that made a booking can cancel
// it; the freed slot is broadcast so open grids show it free again.
export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const form = await request.formData();
  const id = Number(form.get("id"));
  const uid = normaliseUid(String(form.get("uid") ?? readBooker(cookies).uid));

  const cancelled = Number.isInteger(id) ? cancelBooking(id, uid) : undefined;
  if (!cancelled)
    return redirect(withQuery("/my/", { error: "That booking wasn't found under your uID." }), 303);

  publishSlot({
    type: "cancelled",
    library: cancelled.space.library,
    space: cancelled.space.slug,
    date: cancelled.date,
    hour: cancelled.hour,
  });
  return redirect(withQuery("/my/", { cancelled: cancelled.id }), 303);
};
