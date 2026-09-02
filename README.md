# Barberly Booking API — React examples

**[Live demo →](https://booking-api-demo.barberly.com)**

Two working examples of a guest booking flow built on the **Barberly Booking API**.
Same endpoints, same state machine, two different ways of presenting the flow:

- **Appointment hub** — one card with four editable fields; the guest fills them in any order.
- **Guided wizard** — five gated steps with a progress bar and a single forward action.

Both cover: location → barber → services (with add-ons) → date & time → guest details →
confirmation, with **no login**, plus loading, empty and error states.

## Run it

```bash
npm install
npm run dev
```

That's the whole setup — no signup, no configuration. The examples call the live API against a
public demo tenant. Open the printed URL; the floating toggle switches between the two examples
(`?demo=hub`, `?demo=wizard`).

## The API key

The API authenticates with a single `X-Api-Key` header, and the key committed in
`src/config.js` is deliberately public. It belongs to a throwaway demo tenant and carries only
the scopes this flow needs: read the catalog, read and create bookings. It cannot register
customers, cannot send mail, and cannot see anything outside that tenant. Book as often as you
like — the data is disposable.

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
src/
  config.js                API base URL + key (the one place to change them)
  api/client.js            fetch wrapper: base URL, key, ProblemDetails → ApiError
  api/booking.js           one function per endpoint, with the request shapes
  state/useBooking.js      the whole draft + catalog in one reducer
  lib/format.js            money, duration, slot/day labels, slot grouping
  ui/States.jsx            Skeleton / EmptyState / ErrorState, themed per demo
  demos/hub/               Example 1 — HubDemo.jsx + theme.js
  demos/wizard/            Example 2 — WizardDemo.jsx + theme.js
  App.jsx                  demo switcher (delete it and keep the one you want)
```

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
