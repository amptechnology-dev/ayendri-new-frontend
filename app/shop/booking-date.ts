const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Today in IST as a local 00:00 Date. Fallback only: the real earliest date comes from the backend (earliestBookingDate), which also applies the 4 PM cutoff. */
export const getMinBookingDate = () => {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "YYYY-MM-DD"
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
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