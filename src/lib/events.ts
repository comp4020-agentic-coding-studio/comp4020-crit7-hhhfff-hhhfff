import { EventEmitter } from "node:events";

// One process, one bus: every open SSE connection subscribes here, and every
// booking or cancellation is broadcast to all of them. This only works
// because the app runs on exactly one machine (see fly.toml) — a second
// machine would have its own bus and clients would miss events.
export const bus = new EventEmitter();
bus.setMaxListeners(0);

// What an open grid needs to flip one cell.
export type SlotEvent = {
  type: "booked" | "cancelled";
  library: string;
  space: string;
  date: string;
  hour: number;
};

export function publishSlot(event: SlotEvent): void {
  bus.emit("slot", event);
}
