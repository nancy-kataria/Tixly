// Prices are stored as integer cents.
export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Venues don't store a timezone yet, and every venue so far is in
// California, so times are shown in Los Angeles time. A fixed timezone also
// keeps server and browser output identical.
export function formatEventDate(isoString) {
  return new Date(isoString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}
