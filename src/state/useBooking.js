import { useCallback, useEffect, useMemo, useReducer } from "react";
import * as bookingApi from "../api/booking.js";

// The whole guest draft plus the loaded catalog lives here, so both demos share
// one state machine and only differ in how they present it.

const empty = {
  locations: null,
  location: null,
  teamMembers: null,
  anyTeamMember: false,
  teamMember: null,
  categories: null,
  selected: [], // { serviceId, parentServiceId, categoryId, name, price, duration }
  month: null, // { year, month }
  days: null,
  day: null,
  slot: null,
  guest: { firstName: "", lastName: "", phoneNumber: "", email: "" },
  note: "",
  loading: { locations: false, teamMembers: false, services: false, availability: false },
  errors: { locations: null, teamMembers: null, services: null, availability: null, booking: null },
  submitting: false,
  booking: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };
    case "error":
      return { ...state, errors: { ...state.errors, [action.key]: action.value } };

    case "locations":
      return {
        ...state,
        locations: action.list,
        // A single bookable location is prefilled and its step disappears.
        location: action.list.length === 1 ? action.list[0] : state.location,
      };

    case "pickLocation":
      if (state.location?.id === action.location.id) return state;
      return {
        ...state,
        location: action.location,
        teamMembers: null,
        teamMember: null,
        anyTeamMember: false,
        categories: null,
        selected: [],
        days: null,
        day: null,
        slot: null,
      };

    case "teamMembers":
      return {
        ...state,
        teamMembers: action.list,
        // One barber means no choice to make.
        teamMember: action.list.length === 1 ? action.list[0] : state.teamMember,
      };

    case "pickTeamMember":
      return { ...state, teamMember: action.member, anyTeamMember: false, slot: null, days: null };
    case "pickAnyTeamMember":
      return { ...state, teamMember: null, anyTeamMember: true, slot: null, days: null };

    case "services":
      return { ...state, categories: action.categories };

    case "toggleService": {
      const { service, parentServiceId, categoryId } = action;
      const has = state.selected.some((s) => s.serviceId === service.id);
      const selected = has
        ? state.selected.filter(
            (s) => s.serviceId !== service.id && s.parentServiceId !== service.id
          )
        : [
            ...state.selected,
            {
              serviceId: service.id,
              parentServiceId: parentServiceId || null,
              categoryId: categoryId || null,
              name: service.name,
              price: service.price ?? 0,
              duration: service.duration ?? 0,
            },
          ];
      // Availability depends on total duration, so any change invalidates the slot.
      return { ...state, selected, slot: null, days: null };
    }

    case "month":
      return { ...state, month: action.month, days: null, day: null, slot: null };
    case "days":
      return { ...state, days: action.days };
    case "pickDay":
      return { ...state, day: action.day, slot: null };
    case "pickSlot":
      return { ...state, slot: action.slot };

    case "guest":
      return { ...state, guest: { ...state.guest, ...action.patch } };
    case "note":
      return { ...state, note: action.note };

    case "submitting":
      return { ...state, submitting: action.value };
    case "booked":
      return { ...state, booking: action.booking, submitting: false };

    case "reset":
      return {
        ...empty,
        locations: state.locations,
        location: state.locations?.length === 1 ? state.locations[0] : null,
      };

    default:
      return state;
  }
}

export function useBooking() {
  const [state, dispatch] = useReducer(reducer, empty);

  const load = useCallback(async (key, run, onDone) => {
    dispatch({ type: "loading", key, value: true });
    dispatch({ type: "error", key, value: null });
    try {
      onDone(await run());
    } catch (err) {
      dispatch({ type: "error", key, value: err });
    } finally {
      dispatch({ type: "loading", key, value: false });
    }
  }, []);

  const loadLocations = useCallback(
    () => load("locations", bookingApi.getLocations, (list) => dispatch({ type: "locations", list })),
    [load]
  );

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const query = useMemo(
    () => ({
      selected: state.selected,
      teamMemberId: state.teamMember?.id,
      serviceIds: state.selected.map((s) => s.serviceId),
    }),
    [state.selected, state.teamMember]
  );

  const loadTeamMembers = useCallback(() => {
    if (!state.location) return;
    load(
      "teamMembers",
      () => bookingApi.listTeamMembers(state.location.id, { selected: state.selected }),
      (list) => dispatch({ type: "teamMembers", list })
    );
  }, [load, state.location, state.selected]);

  const loadServices = useCallback(() => {
    if (!state.location) return;
    load(
      "services",
      () => bookingApi.listServices(state.location.id, { teamMemberId: state.teamMember?.id }),
      (categories) => dispatch({ type: "services", categories })
    );
  }, [load, state.location, state.teamMember]);

  const loadAvailability = useCallback(
    (year, month) => {
      if (!state.location) return;
      dispatch({ type: "month", month: { year, month } });
      load(
        "availability",
        () => bookingApi.getAvailability(state.location.id, year, month, query),
        (days) => dispatch({ type: "days", days })
      );
    },
    [load, state.location, query]
  );

  const submit = useCallback(async () => {
    if (!state.location || !state.day || !state.slot || !state.selected.length) return null;
    dispatch({ type: "submitting", value: true });
    dispatch({ type: "error", key: "booking", value: null });
    try {
      const booking = await bookingApi.createBooking({
        locationId: state.location.id,
        teamMemberId: state.teamMember?.id,
        serviceIds: state.selected.map((s) => s.serviceId),
        timeSlot: {
          date: state.slot.date || state.day.date,
          startMinutesOfDay: state.slot.startMinutesOfDay,
          durationMinutes: state.slot.durationMinutes ?? totals(state.selected).minutes,
        },
        customer: state.guest,
        note: state.note,
      });
      dispatch({ type: "booked", booking });
      return booking;
    } catch (err) {
      dispatch({ type: "error", key: "booking", value: err });
      dispatch({ type: "submitting", value: false });
      return null;
    }
  }, [state]);

  const cancel = useCallback(async () => {
    if (!state.booking) return;
    await bookingApi.cancelBooking(state.booking.id);
    dispatch({ type: "reset" });
  }, [state.booking]);

  const derived = useMemo(() => {
    const t = totals(state.selected);
    const guestReady = !!(state.guest.firstName.trim() && state.guest.phoneNumber.trim());
    return {
      ...t,
      guestReady,
      barberChosen: !!state.teamMember || state.anyTeamMember,
      ready:
        !!state.location &&
        (!!state.teamMember || state.anyTeamMember) &&
        t.count > 0 &&
        !!state.slot &&
        guestReady,
      isSelected: (id) => state.selected.some((s) => s.serviceId === id),
    };
  }, [state]);

  return {
    state,
    derived,
    dispatch,
    loadLocations,
    loadTeamMembers,
    loadServices,
    loadAvailability,
    submit,
    cancel,
  };
}

function totals(selected) {
  return {
    count: selected.length,
    price: selected.reduce((a, s) => a + (s.price || 0), 0),
    minutes: selected.reduce((a, s) => a + (s.duration || 0), 0),
  };
}
