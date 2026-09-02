import { api } from "./client.js";

// One function per endpoint the booking flow needs. Shapes follow
// https://booking-api.barberly.com/swagger/v1/swagger.json

// GET /v1/locations -> LocationModel[]
export const getLocations = () => api.get("/v1/locations");

// GET /v1/locations/{id} -> LocationModel
export const getLocation = (id) => api.get(`/v1/locations/${id}`);

// POST /v1/locations/{locationId}/team-members -> TeamMemberModel[]
// The body is an AvailabilityQuery: pass whatever the guest already picked and
// the list narrows to who can still take the booking.
export const listTeamMembers = (locationId, query = {}) =>
  api.post(`/v1/locations/${locationId}/team-members`, availabilityQuery(query));

// POST /v1/locations/{locationId}/services -> ServiceCategoryModel[]
// Categories with id === null hold the services that belong to no category.
export const listServices = (locationId, query = {}) =>
  api.post(`/v1/locations/${locationId}/services`, availabilityQuery(query));

// POST /v1/locations/{locationId}/availability/{year}/{month} -> AvailableDayModel[]
// Days outside the month are included to complete calendar weeks.
export const getAvailability = (locationId, year, month, query = {}) =>
  api.post(`/v1/locations/${locationId}/availability/${year}/${month}`, {
    serviceIds: query.serviceIds?.length ? query.serviceIds : undefined,
    teamMemberId: query.teamMemberId || undefined,
    bookingId: query.bookingId || undefined,
  });

// POST /v1/bookings -> BookingModel (201)
// Omit teamMemberId to let the salon assign someone.
export const createBooking = (booking) => api.post("/v1/bookings", bookingBody(booking));

// Create and update take the same body, so it is built once.
function bookingBody({ locationId, teamMemberId, serviceIds, timeSlot, customer, note }) {
  return {
    locationId,
    teamMemberId: teamMemberId || undefined,
    serviceIds,
    timeSlot: {
      date: timeSlot.date,
      startMinutesOfDay: timeSlot.startMinutesOfDay,
      durationMinutes: timeSlot.durationMinutes,
    },
    customer: {
      customerId: customer.customerId || undefined,
      firstName: customer.firstName,
      lastName: customer.lastName || undefined,
      email: customer.email || undefined,
      phoneNumber: customer.phoneNumber,
    },
    note: note || undefined,
  };
}

// PUT /v1/bookings/{id} -> BookingModel
// A full replacement, not a patch: send every field again, exactly as for create.
// While the guest picks a new slot, pass this booking's id as `bookingId` in the
// availability queries, or its current slot comes back looking taken by itself.
export const updateBooking = (id, booking) =>
  api.put(`/v1/bookings/${id}`, bookingBody(booking));

// GET /v1/bookings/{id} -> BookingModel
export const getBooking = (id) => api.get(`/v1/bookings/${id}`);

// POST /v1/bookings/{id}/cancel -> 204
export const cancelBooking = (id, reason) =>
  api.post(`/v1/bookings/${id}/cancel`, reason ? { reason } : {});

// Add-ons must keep their parent relationship, so selectedServices is preferred
// over the flat serviceIds list whenever the guest picked an extra.
function availabilityQuery({ selected = [], teamMemberId, timeSlot, bookingId }) {
  const usesAddons = selected.some((s) => s.parentServiceId);
  return {
    serviceIds: usesAddons || !selected.length ? undefined : selected.map((s) => s.serviceId),
    selectedServices: usesAddons
      ? selected.map((s) => ({
          serviceId: s.serviceId,
          parentServiceId: s.parentServiceId || undefined,
          categoryId: s.categoryId || undefined,
        }))
      : undefined,
    teamMemberId: teamMemberId || undefined,
    timeSlot: timeSlot
      ? {
          date: timeSlot.date,
          startMinutesOfDay: timeSlot.startMinutesOfDay,
          durationMinutes: timeSlot.durationMinutes,
        }
      : undefined,
    bookingId: bookingId || undefined,
  };
}
