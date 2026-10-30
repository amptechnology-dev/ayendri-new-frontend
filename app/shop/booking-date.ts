const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Earliest bookable date = tomorrow, 00:00 local time (no same-day booking). */
export const getMinBookingDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
};

export const isValidBookingDate = (d?: Date | null) =>
  !!d && !Number.isNaN(d.getTime()) && d.getTime() >= getMinBookingDate().getTime();

export const formatBookingDate = (d?: Date | null) =>
  d && !Number.isNaN(d.getTime())
    ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    : "";

/** Date -> "YYYY-MM-DD" in LOCAL time (what the backend expects). */
export const toApiDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "YYYY-MM-DD" (or ISO string) -> local Date at 00:00. */
export const parseApiDate = (v?: string | null): Date | null => {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};