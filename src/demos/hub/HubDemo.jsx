import React, { useEffect, useMemo, useState } from "react";
import { clickable } from "../../ui/clickable.js";
import { useBooking } from "../../state/useBooking.js";
import { Skeleton, EmptyState, ErrorState } from "../../ui/States.jsx";
import {
  address,
  dayLabel,
  duration,
  fullName,
  groupSlots,
  initials,
  money,
  monthLabel,
  slotLabel,
} from "../../lib/format.js";
import { theme, microLabel, monogram, row, checkbox, primaryButton, input } from "./theme.js";

// Example 1 — appointment hub.
// One card holds the four choices; each row opens its own panel and the guest can
// revisit them in any order. Availability is re-fetched whenever the barber or the
// service selection changes, because both affect what the API returns.

const PANELS = {
  location: "Locations",
  barber: "Barbers & stylists",
  service: "Services",
  time: "Appointment time",
  details: "Your details",
};

export default function HubDemo() {
  const b = useBooking();
  const { state, derived, dispatch } = b;
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState("");

  const open = (name) => {
    setPanel(name);
    window.scrollTo(0, 0);
  };
  const back = () => {
    setPanel(null);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (panel === "barber" && !state.teamMembers) b.loadTeamMembers();
    if (panel === "service" && !state.categories) b.loadServices();
    if (panel === "time" && !state.days) {
      const now = new Date();
      b.loadAvailability(now.getFullYear(), now.getMonth() + 1);
    }
  }, [panel, state.teamMembers, state.categories, state.days]);

  if (state.booking) return <Confirmation b={b} />;

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", fontFamily: theme.ui }}>
      <Header />
      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "28px 20px 64px" }}>
        {panel ? (
          <Panel title={PANELS[panel]} onBack={back}>
            {panel === "location" && <LocationPanel b={b} onPicked={back} />}
            {panel === "barber" && (
              <BarberPanel b={b} query={query} setQuery={setQuery} onPicked={back} />
            )}
            {panel === "service" && <ServicePanel b={b} onDone={back} />}
            {panel === "time" && <TimePanel b={b} onDone={back} />}
            {panel === "details" && <DetailsPanel b={b} onFixTime={() => open("time")} />}
          </Panel>
        ) : (
          <Hub b={b} onOpen={open} />
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 22px",
        borderBottom: `1px solid ${theme.hairline}`,
        position: "sticky",
        top: 0,
        background: theme.bg,
        zIndex: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Barberly
        </span>
        <span style={{ fontSize: 12, color: theme.muted }}>Booking API · React example</span>
      </div>
      <span style={{ fontSize: 12, color: theme.faint, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Example 1 · Appointment hub
      </span>
    </div>
  );
}

function Panel({ title, onBack, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <button type="button"
          onClick={onBack}
          style={{ ...clickable,
            width: 38,
            height: 38,
            border: `1px solid ${theme.hairlineStrong}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ‹
        </button>
        <div style={{ fontFamily: theme.display, fontSize: 30 }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function Hub({ b, onOpen }) {
  const { state, derived } = b;
  const loc = state.location;
  const barberLine = state.teamMember
    ? fullName(state.teamMember)
    : state.anyTeamMember
    ? "Any available barber"
    : "Choose a barber";

  return (
    <div>
      <div style={{ fontFamily: theme.display, fontSize: 40, lineHeight: 1.05, marginBottom: 4 }}>
        Book an appointment
      </div>
      <div style={{ fontSize: 14, color: theme.muted, marginBottom: 26 }}>
        Four choices. No account needed.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <div
          style={{
            flex: "1 1 440px",
            minWidth: 300,
            border: `1px solid rgba(232,226,214,0.12)`,
            background: theme.surface,
          }}
        >
          <HubRow
            mono={loc ? initials(loc.name) : "—"}
            label={loc ? loc.name : "Location"}
            value={loc ? address(loc) : "Choose a location"}
            sub={loc?.rating ? `${loc.rating} ★  (${loc.reviewsCount ?? 0} reviews)` : "Pick where you'd like to go"}
            dim={!loc}
            onClick={() => onOpen("location")}
          />
          <HubRow
            mono={state.teamMember ? initials(fullName(state.teamMember)) : "∗"}
            label="Barber"
            value={barberLine}
            sub={state.teamMember?.title || "We'll assign the best fit for your slot"}
            dim={!derived.barberChosen}
            onClick={() => onOpen("barber")}
          />
          <HubRow
            mono="Sv"
            label="Services"
            dim={!derived.count}
            value={
              derived.count ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {state.selected.map((s) => (
                    <div key={s.serviceId} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span>{s.name}</span>
                      <span style={{ color: theme.muted, fontWeight: 400, whiteSpace: "nowrap" }}>
                        {money(s.price)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                "Choose a service"
              )
            }
            sub={derived.count ? duration(derived.minutes) : "Add-ons appear once a service is picked"}
            onClick={() => onOpen("service")}
          />
          <HubRow
            mono={state.day ? String(state.day.day) : "—"}
            label="Date and time"
            value={state.slot ? `${slotLabel(state.slot)}, ${dayLabel(state.day)}` : "Choose a date"}
            sub={state.slot ? duration(state.slot.durationMinutes || derived.minutes) : "Slots update with your selection"}
            dim={!state.slot}
            last
            onClick={() => onOpen("time")}
          />
        </div>

        <div style={{ flex: "1 1 280px", minWidth: 260, position: "sticky", top: 86 }}>
          <Summary b={b}>
            <button type="button"
              onClick={() => derived.count && state.slot && onOpen("details")}
              style={{ ...clickable, ...primaryButton(derived.count > 0 && !!state.slot), marginTop: 16 }}
            >
              {derived.count > 0 && state.slot ? "Book appointment" : "Complete your booking"}
            </button>
            <div style={{ fontSize: 11, color: theme.faint, marginTop: 10, lineHeight: 1.5 }}>
              {derived.count > 0 && state.slot
                ? "You'll add your name and phone on the next step."
                : "Pick at least one service and a time slot."}
            </div>
          </Summary>
        </div>
      </div>
    </div>
  );
}

function HubRow({ mono, label, value, sub, onClick, dim, last }) {
  return (
    <button type="button"
      onClick={onClick}
      style={{ ...clickable,
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        padding: 18,
        cursor: "pointer",
        borderBottom: last ? "none" : `1px solid ${theme.hairline}`,
      }}
    >
      <div style={monogram}>{mono}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...microLabel, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 500, color: dim ? theme.faint : theme.text }}>{value}</div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 5 }}>{sub}</div>
      </div>
      <div style={{ color: theme.faint, fontSize: 18 }}>›</div>
    </button>
  );
}

function Summary({ b, children }) {
  const { state, derived } = b;
  const lines = [
    ["Location", state.location?.name || "Not chosen"],
    ["Barber", state.teamMember ? fullName(state.teamMember) : state.anyTeamMember ? "Any available" : "Not chosen"],
    ...state.selected.map((s) => [s.name, money(s.price)]),
    ...(derived.minutes ? [["Duration", duration(derived.minutes)]] : []),
    ...(state.slot ? [["When", `${slotLabel(state.slot)}, ${dayLabel(state.day)}`]] : []),
  ];

  return (
    <div style={{ border: `1px solid rgba(232,226,214,0.12)`, background: theme.surface, padding: 18 }}>
      <div style={{ ...microLabel, marginBottom: 14 }}>Summary</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {lines.map(([label, value], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
            <span style={{ color: theme.muted }}>{label}</span>
            <span style={{ textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderTop: `1px solid rgba(232,226,214,0.12)`,
          paddingTop: 14,
        }}
      >
        <span style={{ fontSize: 13, color: theme.muted }}>Total</span>
        <span style={{ fontFamily: theme.display, fontSize: 28 }}>{money(derived.price)}</span>
      </div>
      {children}
    </div>
  );
}

function LocationPanel({ b, onPicked }) {
  const { state, dispatch } = b;
  if (state.loading.locations) return <Skeleton theme={theme} />;
  if (state.errors.locations)
    return <ErrorState error={state.errors.locations} onRetry={b.loadLocations} theme={theme} />;
  if (!state.locations?.length)
    return (
      <EmptyState title="No bookable locations" theme={theme}>
        The API key returned an empty list.
      </EmptyState>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {state.locations.map((l) => (
        <button type="button"
          key={l.id}
          onClick={() => {
            dispatch({ type: "pickLocation", location: l });
            onPicked();
          }}
          style={{ ...clickable, ...row(state.location?.id === l.id) }}
        >
          <div style={monogram}>{initials(l.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...microLabel, marginBottom: 4 }}>{l.name}</div>
            <div style={{ fontSize: 17, fontWeight: 500 }}>{address(l)}</div>
            {l.rating ? (
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 5 }}>
                {l.rating} ★  ({l.reviewsCount ?? 0} reviews)
              </div>
            ) : null}
          </div>
          <div style={{ color: theme.faint, fontSize: 18 }}>›</div>
        </button>
      ))}
    </div>
  );
}

function BarberPanel({ b, query, setQuery, onPicked }) {
  const { state, dispatch } = b;
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (state.teamMembers || []).filter(
      (t) => !q || `${fullName(t)} ${t.title || ""}`.toLowerCase().includes(q)
    );
  }, [state.teamMembers, query]);

  if (state.loading.teamMembers) return <Skeleton theme={theme} />;
  if (state.errors.teamMembers)
    return <ErrorState error={state.errors.teamMembers} onRetry={b.loadTeamMembers} theme={theme} />;

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or specialty"
        style={{ ...input, marginBottom: 14 }}
      />
      <button type="button"
        onClick={() => {
          dispatch({ type: "pickAnyTeamMember" });
          onPicked();
        }}
        style={{ ...clickable, ...row(false), borderLeft: `2px solid ${theme.accent}`, marginBottom: 10 }}
      >
        <div style={monogram}>∗</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 500 }}>Any available barber</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 5 }}>
            The salon assigns someone for your slot
          </div>
        </div>
        <div style={{ color: theme.faint, fontSize: 18 }}>›</div>
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((t) => (
          <button type="button"
            key={t.id}
            onClick={() => {
              dispatch({ type: "pickTeamMember", member: t });
              onPicked();
            }}
            style={{ ...clickable, ...row(state.teamMember?.id === t.id) }}
          >
            {t.thumbnailUrl || t.photoUrl ? (
              <div
                style={{
                  ...monogram,
                  backgroundImage: `url(${t.thumbnailUrl || t.photoUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center 20%",
                }}
              />
            ) : (
              <div style={monogram}>{initials(fullName(t))}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {t.title ? <div style={{ ...microLabel, marginBottom: 4 }}>{t.title}</div> : null}
              <div style={{ fontSize: 17, fontWeight: 500 }}>{fullName(t)}</div>
              {t.description ? (
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 5 }}>{t.description}</div>
              ) : null}
            </div>
            <div style={{ color: theme.faint, fontSize: 18 }}>›</div>
          </button>
        ))}
      </div>

      {!list.length ? (
        <EmptyState title={`No one matches “${query}”`} theme={theme}>
          Try a shorter search, or book any available barber.
        </EmptyState>
      ) : null}
    </div>
  );
}

function ServicePanel({ b, onDone }) {
  const { state, derived, dispatch } = b;
  if (state.loading.services) return <Skeleton theme={theme} />;
  if (state.errors.services)
    return <ErrorState error={state.errors.services} onRetry={b.loadServices} theme={theme} />;
  if (!state.categories?.length)
    return (
      <EmptyState title="Nothing bookable" theme={theme}>
        This location returned no services for the current selection.
      </EmptyState>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {state.categories.map((c, ci) => (
        <div key={c.id || `uncategorised-${ci}`}>
          {c.name ? (
            <div style={{ padding: "12px 0", borderBottom: `1px solid rgba(232,226,214,0.14)`, marginBottom: 10 }}>
              <div style={{ fontFamily: theme.display, fontSize: 22 }}>
                {c.name}{" "}
                <span style={{ fontFamily: theme.ui, fontSize: 13, color: theme.muted }}>
                  ({c.services?.length ?? 0})
                </span>
              </div>
              {c.description ? (
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>{c.description}</div>
              ) : null}
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(c.services || []).map((s) => {
              const on = derived.isSelected(s.id);
              return (
                <div key={s.id}>
                  <button type="button"
                    onClick={() => dispatch({ type: "toggleService", service: s, categoryId: c.id })}
                    style={{ ...clickable, ...row(on), alignItems: "flex-start" }}
                  >
                    <div style={{ ...monogram, width: 52, height: 52, flex: "0 0 52px", fontSize: 19 }}>
                      {initials(s.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 5 }}>{s.name}</div>
                      <div style={{ display: "flex", gap: 14, fontSize: 13, color: theme.accent, marginBottom: 6 }}>
                        <span>{duration(s.duration)}</span>
                        <span style={{ color: theme.text }}>{money(s.price)}</span>
                      </div>
                      {s.description ? (
                        <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, textWrap: "pretty" }}>
                          {s.description}
                        </div>
                      ) : null}
                    </div>
                    <div style={checkbox(on)}>
                      {on ? <span style={{ color: theme.bg, fontSize: 13, lineHeight: 1 }}>✓</span> : null}
                    </div>
                  </button>

                  {on && s.extras?.length ? (
                    <div
                      style={{
                        background: "#191715",
                        borderLeft: `2px solid ${theme.accent}`,
                        padding: "12px 16px 6px 22px",
                      }}
                    >
                      <div style={{ ...microLabel, marginBottom: 10 }}>Available add-ons</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
                        {s.extras.map((x) => {
                          const xon = derived.isSelected(x.id);
                          return (
                            <button type="button"
                              key={x.id}
                              onClick={() =>
                                dispatch({
                                  type: "toggleService",
                                  service: x,
                                  parentServiceId: s.id,
                                  categoryId: c.id,
                                })
                              }
                              style={{ ...clickable,
                                display: "flex",
                                gap: 14,
                                alignItems: "center",
                                cursor: "pointer",
                                padding: 10,
                                background: theme.surface,
                              }}
                            >
                              <div style={{ color: theme.accent, fontSize: 16, width: 16, textAlign: "center" }}>+</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 500 }}>{x.name}</div>
                                <div style={{ display: "flex", gap: 12, fontSize: 12, color: theme.muted, marginTop: 3 }}>
                                  <span>{duration(x.duration)}</span>
                                  <span>{money(x.price)}</span>
                                </div>
                              </div>
                              <div style={{ ...checkbox(xon), width: 20, height: 20, flex: "0 0 20px", marginTop: 0 }}>
                                {xon ? <span style={{ color: theme.bg, fontSize: 12, lineHeight: 1 }}>✓</span> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button type="button"
        onClick={onDone}
        style={{ ...clickable,
          position: "sticky",
          bottom: 16,
          textAlign: "center",
          padding: 15,
          background: theme.accent,
          color: theme.bg,
          fontWeight: 500,
          fontSize: 14,
          letterSpacing: "0.04em",
          cursor: "pointer",
        }}
      >
        {derived.count
          ? `Done · ${derived.count} selected · ${money(derived.price)}`
          : "Done"}
      </button>
    </div>
  );
}

function TimePanel({ b, onDone }) {
  const { state, dispatch } = b;
  const month = state.month;

  const step = (delta) => {
    if (!month) return;
    const d = new Date(Date.UTC(month.year, month.month - 1 + delta, 1));
    b.loadAvailability(d.getUTCFullYear(), d.getUTCMonth() + 1);
  };

  const slots = state.day?.timeSlots || [];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: `1px solid rgba(232,226,214,0.12)`,
          paddingBottom: 12,
          marginBottom: 16,
        }}
      >
        <Stepper onClick={() => step(-1)}>‹</Stepper>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15 }}>
          {month ? monthLabel(month.year, month.month) : ""}
        </div>
        <Stepper onClick={() => step(1)}>›</Stepper>
      </div>

      {state.loading.availability ? (
        <Skeleton rows={3} theme={theme} />
      ) : state.errors.availability ? (
        <ErrorState
          error={state.errors.availability}
          onRetry={() => month && b.loadAvailability(month.year, month.month)}
          theme={theme}
        />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
              <div key={w} style={{ ...microLabel, textAlign: "center", padding: "6px 0" }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {padStart(state.days).map((d, i) =>
              d ? (
                <button type="button"
                  key={d.date || i}
                  onClick={() => d.isAvailable && dispatch({ type: "pickDay", day: d })}
                  style={{ ...clickable,
                    aspectRatio: "1 / 1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    border: `1px solid ${d.isAvailable ? theme.hairline : "rgba(232,226,214,0.04)"}`,
                    background: state.day?.date === d.date ? theme.accent : "transparent",
                    color:
                      state.day?.date === d.date
                        ? theme.bg
                        : d.isAvailable
                        ? theme.text
                        : theme.disabled,
                    fontWeight: state.day?.date === d.date ? 600 : 400,
                    cursor: d.isAvailable ? "pointer" : "not-allowed",
                  }}
                >
                  {d.day}
                </button>
              ) : (
                <div key={`pad-${i}`} style={{ aspectRatio: "1 / 1" }} />
              )
            )}
          </div>

          <div style={{ ...microLabel, margin: "26px 0 12px" }}>
            {state.day ? "Select a time" : "Pick a day first"}
          </div>

          {state.day && !slots.length ? (
            <EmptyState title="Fully booked" theme={theme}>
              No slots left on this day for the selected services. Pick another date.
            </EmptyState>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
              {slots.map((s) => {
                const on = state.slot?.startMinutesOfDay === s.startMinutesOfDay;
                return (
                  <button type="button"
                    key={s.startMinutesOfDay}
                    onClick={() => dispatch({ type: "pickSlot", slot: { ...s, date: s.date || state.day.date } })}
                    style={{ ...clickable,
                      padding: "12px 6px",
                      textAlign: "center",
                      fontSize: 13,
                      cursor: "pointer",
                      border: `1px solid ${on ? theme.accent : "rgba(232,226,214,0.14)"}`,
                      background: on ? theme.accent : theme.surface,
                      color: on ? theme.bg : theme.text,
                      fontWeight: on ? 600 : 400,
                    }}
                  >
                    {slotLabel(s)}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      <button type="button"
        onClick={onDone}
        style={{ ...clickable,
          position: "sticky",
          bottom: 16,
          marginTop: 20,
          textAlign: "center",
          padding: 15,
          background: theme.accent,
          color: theme.bg,
          fontWeight: 500,
          fontSize: 14,
          letterSpacing: "0.04em",
          cursor: "pointer",
        }}
      >
        {state.slot ? `Done · ${slotLabel(state.slot)}, ${dayLabel(state.day)}` : "Done"}
      </button>
    </div>
  );
}

function Stepper({ children, onClick }) {
  return (
    <button type="button"
      onClick={onClick}
      style={{ ...clickable,
        width: 32,
        height: 32,
        flex: "0 0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid rgba(232,226,214,0.16)`,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// The availability response starts on the first day of the month, so pad the grid
// to the right weekday. Days from neighbouring months come back flagged already.
function padStart(days) {
  if (!days?.length) return [];
  const first = days[0];
  const offset = new Date(Date.UTC(first.year, first.month - 1, first.day)).getUTCDay();
  return [...Array.from({ length: offset }, () => null), ...days];
}

function DetailsPanel({ b, onFixTime }) {
  const { state, derived, dispatch } = b;
  const set = (patch) => dispatch({ type: "guest", patch });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 380px", minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Field label="First name *" style={{ flex: "1 1 160px" }}>
            <input
              value={state.guest.firstName}
              onChange={(e) => set({ firstName: e.target.value })}
              placeholder="John"
              style={input}
            />
          </Field>
          <Field label="Last name" style={{ flex: "1 1 160px" }}>
            <input
              value={state.guest.lastName}
              onChange={(e) => set({ lastName: e.target.value })}
              placeholder="Reed"
              style={input}
            />
          </Field>
        </div>
        <Field label="Phone *">
          <input
            value={state.guest.phoneNumber}
            onChange={(e) => set({ phoneNumber: e.target.value })}
            placeholder="+1 212 555 0134"
            style={input}
          />
        </Field>
        <Field label="Email">
          <input
            value={state.guest.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="john@example.com"
            style={input}
          />
        </Field>
        <Field label="Note for the salon">
          <textarea
            value={state.note}
            onChange={(e) => dispatch({ type: "note", note: e.target.value })}
            rows={3}
            placeholder="Anything the barber should know"
            style={{ ...input, resize: "vertical" }}
          />
        </Field>
        <div style={{ fontSize: 12, color: theme.faint, lineHeight: 1.6 }}>
          No account is created. The salon may still require approval, in which case the booking comes
          back unconfirmed.
        </div>
      </div>

      <div style={{ flex: "1 1 260px", minWidth: 250 }}>
        <Summary b={b}>
          <button type="button"
            onClick={() => derived.ready && b.submit()}
            style={{ ...clickable, ...primaryButton(derived.ready && !state.submitting), marginTop: 16 }}
          >
            {state.submitting ? "Booking…" : "Confirm booking"}
          </button>
          {state.errors.booking ? (
            <div style={{ marginTop: 14 }}>
              <ErrorState error={state.errors.booking} theme={theme} />
              <button type="button"
                onClick={onFixTime}
                style={{ ...clickable,
                  fontSize: 12,
                  color: theme.accent,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: 10,
                }}
              >
                Pick another time
              </button>
            </div>
          ) : null}
        </Summary>
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{ ...microLabel, marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

function Confirmation({ b }) {
  const { state, derived, dispatch } = b;
  const booking = state.booking;
  const lines = [
    ["Booking", `#${String(booking.id).slice(0, 8)}`],
    ["Status", booking.status],
    ["Where", state.location ? `${state.location.name} · ${state.location.streetAddress}` : "—"],
    ["Who", state.teamMember ? fullName(state.teamMember) : "Any available"],
    ["What", state.selected.map((s) => s.name).join(", ")],
    ["When", `${slotLabel(state.slot)}, ${dayLabel(state.day)}`],
  ];

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", fontFamily: theme.ui }}>
      <Header />
      <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 20px 64px" }}>
        <div
          style={{
            width: 56,
            height: 56,
            background: theme.accent,
            color: theme.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            marginBottom: 22,
          }}
        >
          ✓
        </div>
        <div style={{ fontFamily: theme.display, fontSize: 38, lineHeight: 1.1, marginBottom: 8 }}>
          {booking.isConfirmed ? "You're booked" : "Request sent"}
        </div>
        <div style={{ fontSize: 14, color: theme.muted, marginBottom: 26, lineHeight: 1.6 }}>
          {booking.isConfirmed
            ? "A confirmation was sent to your phone. Show up five minutes early."
            : "This salon approves bookings manually. You'll hear back once a barber confirms."}
        </div>

        <div style={{ border: `1px solid rgba(232,226,214,0.12)`, background: theme.surface }}>
          {lines.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                padding: "14px 18px",
                borderBottom: `1px solid rgba(232,226,214,0.08)`,
                fontSize: 14,
              }}
            >
              <span style={{ color: theme.muted }}>{label}</span>
              <span style={{ textAlign: "right" }}>{value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "16px 18px" }}>
            <span style={{ color: theme.muted, fontSize: 14 }}>Total</span>
            <span style={{ fontFamily: theme.display, fontSize: 26 }}>
              {money(booking.price ?? derived.price)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button type="button"
            onClick={() => dispatch({ type: "reset" })}
            style={{ ...clickable,
              flex: "1 1 160px",
              textAlign: "center",
              padding: 14,
              border: `1px solid ${theme.hairlineStrong}`,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Book another
          </button>
          <button type="button"
            onClick={b.cancel}
            style={{ ...clickable,
              flex: "1 1 160px",
              textAlign: "center",
              padding: 14,
              border: `1px solid ${theme.hairlineStrong}`,
              cursor: "pointer",
              fontSize: 14,
              color: theme.muted,
            }}
          >
            Cancel appointment
          </button>
        </div>
      </div>
    </div>
  );
}
