# Barberly Booking API — React examples

Two working examples of a guest booking flow built on the **Barberly Booking API** — the
programmable way to take bookings for a shop that runs on [Barberly](https://barberly.com).
Same endpoints, same state machine, two different ways of presenting the flow.

| Live demo | | |
|---|---|---|
| **[Appointment hub →](https://booking-api-demo.barberly.com/hub/)** | `hub/`, `src/demos/hub/` | One card with four editable fields; the guest fills them in any order. |
| **[Guided wizard →](https://booking-api-demo.barberly.com/wizard/)** | `wizard/`, `src/demos/wizard/` | Five gated steps with a progress bar and a single forward action. |

Both cover: location → barber → services (with add-ons) → date & time → guest details →
confirmation, with **no login**, plus loading, empty and error states.

## What the Booking API is

A barbershop runs its business in Barberly: locations, team, services and add-ons, working
hours, pricing, and the rules that decide how clients are allowed to book. On top of that
configuration Barberly gives the shop its client-facing tools — a mobile app, a website,
booking widgets, a queue kiosk, Google Reserve.

**The Booking API is one more of those tools.** It is not a back-office API and it does not
open up the business side of the account. It books the way a client books, and it obeys exactly
what the shop set up for its own booking page:

- A slot that is closed to clients is closed here too. Availability returns the client's view of
  the calendar, never the staff one.
- If the shop approves appointments by hand, bookings come back `Unconfirmed` here as well.
- If the shop requires a registered customer, this API requires a `customerId` too.
- Working hours, lead times, service durations, which barber does what — all read from the same
  settings, live.

The API invents no rules of its own and can bypass none. That is the point: whatever the shop
already configured for its own booking page applies unchanged to whatever you build on top —
your own booking UI in your own brand, a booking bot in WhatsApp or a chat widget, a kiosk, a
booking step inside a site you already run.

## Before you build

You need a Barberly account. The catalog these calls return is the one you create there:
locations, team members, services, working hours, booking rules. The API reads that
configuration — it does not create any of it. So the first step is setting the shop up in
Barberly, exactly as you would to launch its website or its app.

Then issue a key in **Apps → Booking API → Create key**. Each key carries the scopes you grant it:

| Scope | Grants |
|---|---|
| `catalog:read` | locations, team members, services, availability |
| `bookings:read` | read a booking |
| `bookings:write` | create, update and cancel bookings |
| `accounts:write` | register, authenticate and recover customer accounts |

Send it as an `X-Api-Key` header on every request. Keys can be revoked or deleted from the same
screen — revoked keys stay listed with their dates, so an incident can be reviewed afterwards.

## Reference

- **[API reference](https://booking-api.barberly.com/docs)** — every endpoint and field
- **[OpenAPI document](https://booking-api.barberly.com/swagger/v1/swagger.json)** — generate a client from it
- **[Barberly](https://barberly.com)** — where the account, the configuration and the keys live

<!-- TODO: add the walkthrough video here once it is published. -->

## Run it

```bash
npm install
npm run dev
```

No signup needed to look around: the examples ship with a key for a public demo shop, already
configured with locations, barbers and services, so they show live data straight away. Open the
printed URL for the index, or go straight to `/hub/` or `/wizard/`.

## The API key

The key committed in `src/config.js` is deliberately public. It belongs to a throwaway demo shop
and carries only the scopes this flow needs — `catalog:read`, `bookings:read`, `bookings:write`.
It cannot register customers, cannot send mail, and cannot see anything outside that shop. Book
as often as you like; the data is disposable.

**Your own key is not like that.** Everything in a browser bundle is readable by anyone who
loads the page, so a key with real scopes does not belong in the client. Keep it on a server
and proxy the API:

```
browser  →  your backend (adds X-Api-Key)  →  booking-api.barberly.com
```

A serverless function, an nginx `location`, or a route in the app you already run — it only has
to forward the request and attach the header. Point `VITE_API_BASE_URL` at that proxy and leave
`VITE_API_KEY` empty.

To try the examples against your own tenant while developing, copy `.env.example` to `.env` and
set `VITE_API_KEY`. Don't deploy that build.

The API sends CORS headers for any origin, so a static build like this one can call it directly
from the browser with no proxy in between.

## Structure

```
index.html                 plain-HTML landing page linking to the demos
hub/index.html             page for example 1
wizard/index.html          page for example 2
src/
  config.js                API base URL + key (the one place to change them)
  api/client.js            fetch wrapper: base URL, key, ProblemDetails → ApiError
  api/booking.js           one function per endpoint, with the request shapes
  state/useBooking.js      the whole draft + catalog in one reducer
  lib/format.js            money, duration, slot/day labels, slot grouping
  ui/States.jsx            Skeleton / EmptyState / ErrorState, themed per demo
  demos/hub/               Example 1 — HubDemo.jsx + theme.js + main.jsx
  demos/wizard/            Example 2 — WizardDemo.jsx + theme.js + main.jsx
```

Each example is its own page and its own bundle, so you can read, copy or delete one without
touching the other. Everything they share sits in `src/api`, `src/state`, `src/lib` and `src/ui`.
Adding a third example means adding one folder under `src/demos`, one `*/index.html`, and one
line in `vite.config.js`.

Styling is inline, on purpose: no CSS framework, no build step beyond Vite, so a customer can lift
a single file into their own project. Each demo's palette and type live in its `theme.js`.

## Endpoints used

| Step | Call |
|---|---|
| Locations | `GET /v1/locations` |
| Barbers | `POST /v1/locations/{locationId}/team-members` |
| Services + add-ons | `POST /v1/locations/{locationId}/services` |
| Days and slots | `POST /v1/locations/{locationId}/availability/{year}/{month}` |
| Create | `POST /v1/bookings` |
| Cancel | `POST /v1/bookings/{id}/cancel` |

The three catalog calls are POSTs because they take an `AvailabilityQuery` — everything the guest
has already picked. Sending it narrows the response to what is still bookable.

One endpoint the examples do not use: **`PUT /v1/bookings/{id}`**, which reschedules or otherwise
changes a booking. It is a full replacement — send every field again, not a partial patch — and
it takes the same body as `POST /v1/bookings`. Two things to know before building on it:

- **Pass `bookingId` in the availability queries** while the guest is picking a new slot. All
  three catalog calls accept it, and it stops the booking's own slot from looking taken by
  itself. `api/booking.js` already threads it through; the demos just never set it.
- **The salon can refuse.** If the minimum notice for changes has passed, the call returns `400`
  with the reason in `ProblemDetails`, the same shape as every other error here.

## Behaviour worth knowing

- **Single options prefill.** One location, or one team member, means the step is skipped and the
  value is preselected (`useBooking.js`, `locations` / `teamMembers` actions).
- **Add-ons keep their parent.** `service.extras[]` renders only once the parent service is
  selected. Deselecting the parent removes its extras. For queries, add-ons are sent as
  `selectedServices[{ serviceId, parentServiceId }]` instead of the flat `serviceIds`, so the
  parent relationship survives the round trip.
- **Availability depends on the selection.** Changing the barber or any service clears the chosen
  slot and the loaded days, because the API's slot list is computed from the total duration and
  the barber's calendar.
- **`durationMinutes` on the slot.** `POST /v1/bookings` needs a `timeSlot` with `date`,
  `startMinutesOfDay` and `durationMinutes`; the demos take the slot's own duration and fall back
  to the summed service duration.
- **Dates are salon-local and date-only.** `TimeSlotRequest.date` is `yyyy-MM-dd` — never a
  timestamp, never with an offset. Slots also carry `timeFrom`/`timeTo` already formatted for the
  salon's 12h/24h setting; `lib/format.js` prefers those and uses `startMinutesOfDay` for maths.
- **A booking may come back unconfirmed.** Salons that approve manually return
  `status: "Unconfirmed"` and `isConfirmed: false`. Both confirmation screens read the status
  rather than assuming success wording.
- **Availability includes neighbouring days.** The month response pads the calendar weeks; each
  day carries `isAvailable`, and the hub demo offsets the grid by the first day's weekday.
- **Errors are `ProblemDetails`.** `client.js` turns them into `ApiError` with `status`, `title`
  as the message and `detail`; every list has a retry.
- **Accounts are optional.** The `/v1/accounts/*` endpoints exist for salons that require a
  registered customer — pass the resulting `customerId` as `customer.customerId`. These examples
  book as a guest and don't use them.

## What is not included

No design system, no router, no data-fetching library, no tests. The point is to be small enough
to read in one sitting and copy from.
