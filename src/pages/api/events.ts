import type { APIRoute } from "astro";
import { bus, type SlotEvent } from "../../lib/events";

// The minimal server-sent-events (SSE) pattern: a long-lived streaming
// response the browser consumes with `new EventSource("/api/events")`.
// Every booking and cancellation is pushed here so open grids stay truthful
// without a reload.
export const GET: APIRoute = () => {
  let onSlot: (event: SlotEvent) => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<string>({
    start(controller) {
      // an opening comment so the client (and the post-deploy CI probe) sees
      // bytes immediately, and a periodic one so proxies don't drop the
      // connection as idle
      controller.enqueue(": connected\n\n");
      heartbeat = setInterval(() => controller.enqueue(": ping\n\n"), 30_000);
      onSlot = (event) => {
        controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
      };
      bus.on("slot", onSlot);
    },
    cancel() {
      clearInterval(heartbeat);
      bus.off("slot", onSlot);
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
};
