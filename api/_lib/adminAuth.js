/* Admin check for routes that spend money or change orders.
   The caller sends the ADMIN_SECRET in the x-admin-secret header.

   Fails CLOSED: with ADMIN_SECRET unset nobody is an admin. An unset variable
   must never turn into "the secret is empty, so an empty header matches".
   Compared in constant time so response timing cannot be used to guess it. */
import { timingSafeEqual } from "node:crypto";

export function isAdmin(req) {
  const secret = process.env.ADMIN_SECRET;
  const given = req.headers?.["x-admin-secret"];
  if (!secret || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
