// Where the examples get their credentials.
//
// The key below is committed on purpose. It belongs to a throwaway demo tenant and
// carries only the scopes this flow needs: read the catalog, read and create bookings.
// It cannot register customers, cannot send confirmation mail, and cannot see anything
// outside the demo tenant — so it is safe to publish and safe for you to run against
// while you are reading the code.
//
// To point the examples at your own tenant, copy .env.example to .env and set
// VITE_API_KEY (and VITE_API_BASE_URL if you are on a dedicated host). Do not commit
// a real key: anything in a browser bundle is readable by anyone who loads the page.
// For production, keep the key on a server and proxy the API — see the README.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://booking-api.barberly.com";

export const API_KEY =
  import.meta.env.VITE_API_KEY ||
  "bk_live_ktwooxkc_jwhq50rbpadkufcxja6g3ahndixkays3jqwsaj4axe4";
