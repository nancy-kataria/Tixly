// Venues don't store a timezone yet, and every venue so far is in
// California, so times are shown in Los Angeles time. A fixed timezone also
// keeps server and browser output identical.
const TIME_ZONE = "America/Los_Angeles";

// Prices are stored as integer cents: 4200 -> "$42", 4250 -> "$42.50".
export function formatPrice(cents) {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

// Label for an event's cheapest ticket.
export function priceLabel(fromPriceCents) {
  if (fromPriceCents === null || fromPriceCents === undefined) return "Sold out";
  if (fromPriceCents === 0) return "Free entry";
  return `From ${formatPrice(fromPriceCents)}`;
}

// "Sat, Oct 3", plus the year when it isn't this year.
export function formatDay(isoString) {
  const date = new Date(isoString);
  const isThisYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(isThisYear ? {} : { year: "numeric" }),
    timeZone: TIME_ZONE,
  });
}

// "Sat, Oct 3 · 7:30 PM PDT"
export function formatEventDate(isoString) {
  const time = new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
    timeZoneName: "short",
  });
  return `${formatDay(isoString)} · ${time}`;
}
