// Display helpers. The API sends money as a number and durations as minutes;
// slots also carry pre-formatted timeFrom/timeTo strings that already follow the
// salon's 12h/24h setting — prefer those for display and keep
// startMinutesOfDay for arithmetic.

export const money = (n) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
      }).format(n);

export const duration = (m) => {
  if (!m) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
};

export const slotLabel = (slot) => {
  if (!slot) return "";
  if (slot.timeFrom) return slot.timeFrom;
  const h = Math.floor(slot.startMinutesOfDay / 60);
  const m = slot.startMinutesOfDay % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const dayLabel = (day) =>
  day
    ? new Date(Date.UTC(day.year, day.month - 1, day.day)).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

export const shortDayLabel = (day) =>
  day
    ? new Date(Date.UTC(day.year, day.month - 1, day.day)).toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      })
    : "";

export const monthLabel = (year, month) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const fullName = (person) =>
  person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "";

export const initials = (text) =>
  (text || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export const address = (loc) =>
  loc ? [loc.streetAddress, [loc.city, loc.zipCode].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "";

// Slots are grouped for display only; the API returns a flat list per day.
export const groupSlots = (slots = []) => {
  const buckets = [
    { name: "Morning", slots: [] },
    { name: "Afternoon", slots: [] },
    { name: "Evening", slots: [] },
  ];
  slots.forEach((s) => {
    const i = s.startMinutesOfDay < 720 ? 0 : s.startMinutesOfDay < 1020 ? 1 : 2;
    buckets[i].slots.push(s);
  });
  return buckets.filter((b) => b.slots.length);
};
