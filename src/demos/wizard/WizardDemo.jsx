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
  money,
  shortDayLabel,
  slotLabel,
} from "../../lib/format.js";
import { theme, microLabel, row, checkbox, primaryButton, underlineInput } from "./theme.js";

// Example 2 — guided wizard.
// The same API calls as the hub demo, presented as five gated steps with one
// forward action in a fixed bottom bar. Steps whose data has only one option
// (a single location, a single barber) are skipped automatically.

const STEPS = ["location", "barber", "service", "time", "details"];
const TITLES = {
  location: ["Choose a location", "Every shop bookable through this API key."],
  barber: ["Choose a barber", "Pick a specific barber, or let the salon assign the first one free."],
  service: ["Choose services", "Selecting a service reveals the add-ons available for it."],
  time: ["Choose date and time", "Slots are filtered by your barber and the total duration."],
  details: ["Your details", "Name and phone are all that's required — no account."],
};

export default function WizardDemo() {
  const b = useBooking();
  const { state, derived, dispatch } = b;
  const [step, setStep] = useState("location");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      STEPS.filter((s) => {
        if (s === "location") return (state.locations?.length ?? 2) !== 1;
        if (s === "barber") return (state.teamMembers?.length ?? 2) !== 1;
        return true;
      }),
    [state.locations, state.teamMembers]
  );

  const index = Math.max(0, visible.indexOf(step));

  const go = (next) => {
    setStep(next);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (step === "barber" && !state.teamMembers) b.loadTeamMembers();
    if (step === "service" && !state.categories) b.loadServices();
    if (step === "time" && !state.days) {
      const now = new Date();
      b.loadAvailability(now.getFullYear(), now.getMonth() + 1);
    }
  }, [step, state.teamMembers, state.categories, state.days]);

  // A location list of one prefills itself; move past the step immediately.
  useEffect(() => {
    if (step === "location" && state.locations?.length === 1) go("barber");
  }, [step, state.locations]);

  if (state.booking) return <Confirmed b={b} />;

  const [title, hint] = TITLES[step];
  const stepReady = {
    location: !!state.location,
    barber: derived.barberChosen,
    service: derived.count > 0,
    time: !!state.slot,
    details: derived.ready && !state.submitting,
  }[step];

  const bar = {
    location: ["Location", state.location ? `${state.location.name} · ${state.location.streetAddress}` : "Pick a shop", "Choose a barber"],
    barber: [
      "Barber",
      state.teamMember ? fullName(state.teamMember) : state.anyTeamMember ? "Any barber" : "Not chosen",
      "Choose services",
    ],
    service: [
      derived.count ? `${derived.count} ${derived.count === 1 ? "service" : "services"} · ${duration(derived.minutes)}` : "Nothing selected",
      money(derived.price),
      "Choose a time",
    ],
    time: [
      "Selected",
      state.slot ? `${slotLabel(state.slot)}, ${dayLabel(state.day)}` : "Pick a day and a time",
      "Your details",
    ],
    details: [
      `${derived.count} ${derived.count === 1 ? "service" : "services"} · ${duration(derived.minutes)}`,
      money(derived.price),
      state.submitting ? "Booking…" : "Confirm booking",
    ],
  }[step];

  const next = () => {
    if (!stepReady) return;
    if (step === "details") return void b.submit();
    go(visible[Math.min(visible.length - 1, index + 1)]);
  };

  return (
    <div
      style={{
        fontFamily: theme.ui,
        background: theme.bg,
        color: theme.text,
        fontWeight: 400,
        minHeight: "100vh",
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${theme.hairline}`,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div
              style={{
                width: 26,
                height: 26,
                flex: "0 0 26px",
                border: `1px solid rgba(255,255,255,0.7)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              B
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Barberly · Book a visit
            </div>
          </div>
          <div style={{ ...microLabel, color: theme.faint }}>Example 2</div>
        </div>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 22px 16px", display: "flex", gap: 4 }}>
          {visible.map((s, i) => (
            <div
              key={s}
              style={{ height: 2, flex: 1, background: i <= index ? theme.text : "rgba(255,255,255,0.16)" }}
            />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "44px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 40 }}>
          <button type="button"
            onClick={() => index > 0 && go(visible[index - 1])}
            style={{ ...clickable,
              width: 38,
              height: 38,
              flex: "0 0 38px",
              border: `1px solid rgba(255,255,255,0.35)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              marginTop: 6,
              opacity: index === 0 ? 0.3 : 1,
              cursor: index === 0 ? "not-allowed" : "pointer",
            }}
          >
            ←
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...microLabel, color: theme.faint, marginBottom: 12 }}>
              Step {index + 1} of {visible.length}
            </div>
            <div style={{ fontSize: 32, fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.2 }}>
              {title}
            </div>
            <div style={{ fontSize: 15, color: theme.muted, marginTop: 12 }}>{hint}</div>
          </div>
        </div>

        {step === "location" && <LocationStep b={b} />}
        {step === "barber" && <BarberStep b={b} query={query} setQuery={setQuery} />}
        {step === "service" && <ServiceStep b={b} />}
        {step === "time" && <TimeStep b={b} />}
        {step === "details" && <DetailsStep b={b} onFixTime={() => go("time")} />}
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 35,
          borderTop: `1px solid ${theme.hairline}`,
          background: "rgba(0,0,0,0.94)",
          backdropFilter: "blur(8px)",
          padding: "16px 22px",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            gap: 18,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <div style={{ ...microLabel, color: theme.faint, marginBottom: 7 }}>{bar[0]}</div>
            <div style={{ fontSize: 14, letterSpacing: "0.06em" }}>{bar[1]}</div>
          </div>
          <button type="button" onClick={next} style={{ ...clickable, ...primaryButton(stepReady) }}>
            {bar[2]}
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationStep({ b }) {
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
      {state.locations.map((l) => {
        const on = state.location?.id === l.id;
        return (
          <button type="button" key={l.id} onClick={() => dispatch({ type: "pickLocation", location: l })} style={{ ...clickable, ...row(on) }}>
            <div
              style={{
                width: 20,
                height: 20,
                flex: "0 0 20px",
                borderRadius: "50%",
                border: on ? `5px solid ${theme.text}` : `1px solid rgba(255,255,255,0.45)`,
              }}
            />
            <div style={{ flex: "1 1 240px", minWidth: 200 }}>
              <div style={{ fontSize: 19, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                {l.name}
              </div>
              <div style={{ fontSize: 15, color: theme.muted }}>{address(l)}</div>
            </div>
            {l.rating ? (
              <div style={{ ...microLabel, whiteSpace: "nowrap" }}>
                {l.rating} ★ · {l.reviewsCount ?? 0}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function BarberStep({ b, query, setQuery }) {
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
        style={{ ...underlineInput, maxWidth: 420, marginBottom: 30 }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 12 }}>
        <button type="button"
          onClick={() => dispatch({ type: "pickAnyTeamMember" })}
          style={{ ...clickable,
            aspectRatio: "4 / 5",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            cursor: "pointer",
            border: state.anyTeamMember ? `2px solid ${theme.text}` : `1px solid rgba(255,255,255,0.3)`,
            background: state.anyTeamMember ? theme.selectedFill : "transparent",
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 14 }}>✳</div>
          <div style={{ fontSize: 17, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Any barber
          </div>
          <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.6 }}>First one free at your time</div>
        </button>

        {list.map((t) => {
          const on = state.teamMember?.id === t.id;
          const photo = t.photoUrl || t.thumbnailUrl;
          return (
            <button type="button"
              key={t.id}
              onClick={() => dispatch({ type: "pickTeamMember", member: t })}
              style={{ ...clickable,
                position: "relative",
                aspectRatio: "4 / 5",
                overflow: "hidden",
                background: "#0B0B0B",
                cursor: "pointer",
              }}
            >
              {photo ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${photo})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center 22%",
                    filter: "grayscale(1) contrast(1.05)",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 64,
                    color: "rgba(255,255,255,0.14)",
                  }}
                >
                  {fullName(t).slice(0, 1)}
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 32%, rgba(0,0,0,0.92))",
                }}
              />
              {on ? <div style={{ position: "absolute", inset: 0, border: `2px solid ${theme.text}` }} /> : null}
              {on ? (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: theme.text,
                    color: theme.bg,
                    padding: "6px 10px",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Selected
                </div>
              ) : null}
              <div style={{ position: "absolute", left: 14, right: 14, bottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  {fullName(t)}
                </div>
                {t.title ? <div style={{ fontSize: 13, color: theme.secondary }}>{t.title}</div> : null}
              </div>
            </button>
          );
        })}
      </div>

      {!list.length ? (
        <div style={{ marginTop: 14 }}>
          <EmptyState title="No barber matches" theme={theme}>
            Nothing for “{query}”. Try a shorter search, or book any barber.
          </EmptyState>
        </div>
      ) : null}
    </div>
  );
}

function ServiceStep({ b }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
      {state.categories.map((c, ci) => (
        <div key={c.id || `uncategorised-${ci}`}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "baseline",
              paddingBottom: 14,
              borderBottom: `1px solid rgba(255,255,255,0.2)`,
              marginBottom: 6,
            }}
          >
            <div style={microLabel}>{c.name || "Other services"}</div>
            <div style={{ ...microLabel, color: "#8F8F8F" }}>
              {c.services?.length ?? 0} {c.services?.length === 1 ? "service" : "services"}
            </div>
          </div>

          {(c.services || []).map((s) => {
            const on = derived.isSelected(s.id);
            return (
              <div key={s.id}>
                <button type="button"
                  onClick={() => dispatch({ type: "toggleService", service: s, categoryId: c.id })}
                  style={{ ...clickable,
                    display: "flex",
                    gap: 20,
                    alignItems: "center",
                    flexWrap: "wrap",
                    padding: "22px 14px",
                    borderBottom: `1px solid rgba(255,255,255,0.14)`,
                    cursor: "pointer",
                    background: on ? "rgba(255,255,255,0.05)" : "transparent",
                  }}
                >
                  <div style={{ flex: "1 1 240px", minWidth: 190 }}>
                    <div style={{ fontSize: 18, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 9 }}>
                      {s.name}
                    </div>
                    {s.description ? (
                      <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.7, maxWidth: 480, textWrap: "pretty" }}>
                        {s.description}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ ...microLabel, width: 78 }}>{duration(s.duration)}</div>
                  <div style={{ fontSize: 18, width: 76, textAlign: "right" }}>{money(s.price)}</div>
                  <div style={checkbox(on)}>
                    {on ? <span style={{ color: theme.bg, fontSize: 12, lineHeight: 1 }}>✓</span> : null}
                  </div>
                </button>

                {on && s.extras?.length ? (
                  <div
                    style={{
                      borderLeft: `1px solid rgba(255,255,255,0.3)`,
                      margin: "0 0 10px 14px",
                      padding: "16px 0 6px 20px",
                    }}
                  >
                    <div style={{ ...microLabel, marginBottom: 12 }}>Add to this service</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {s.extras.map((x) => {
                        const xon = derived.isSelected(x.id);
                        return (
                          <button type="button"
                            key={x.id}
                            onClick={() =>
                              dispatch({ type: "toggleService", service: x, parentServiceId: s.id, categoryId: c.id })
                            }
                            style={{ ...clickable,
                              display: "flex",
                              gap: 16,
                              alignItems: "center",
                              padding: "13px 14px",
                              border: `1px solid rgba(255,255,255,0.16)`,
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                {x.name}
                              </div>
                              <div style={{ fontSize: 12, color: theme.muted, marginTop: 6 }}>
                                {duration(x.duration)} · {money(x.price)}
                              </div>
                            </div>
                            <div style={checkbox(xon, 20)}>
                              {xon ? <span style={{ color: theme.bg, fontSize: 11, lineHeight: 1 }}>✓</span> : null}
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
      ))}
    </div>
  );
}

function TimeStep({ b }) {
  const { state, dispatch } = b;
  const month = state.month;
  const bookable = (state.days || []).filter((d) => d.isAvailable);
  const groups = groupSlots(state.day?.timeSlots || []);

  const step = (delta) => {
    if (!month) return;
    const d = new Date(Date.UTC(month.year, month.month - 1 + delta, 1));
    b.loadAvailability(d.getUTCFullYear(), d.getUTCMonth() + 1);
  };

  if (state.loading.availability) return <Skeleton theme={theme} />;
  if (state.errors.availability)
    return (
      <ErrorState
        error={state.errors.availability}
        onRetry={() => month && b.loadAvailability(month.year, month.month)}
        theme={theme}
      />
    );

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 20,
          borderBottom: `1px solid rgba(255,255,255,0.2)`,
          marginBottom: 28,
          alignItems: "center",
        }}
      >
        <NavCell onClick={() => step(-1)}>←</NavCell>
        {(state.days || []).map((d) => {
          const on = state.day?.date === d.date;
          return (
            <button type="button"
              key={d.date}
              onClick={() => d.isAvailable && dispatch({ type: "pickDay", day: d })}
              style={{ ...clickable,
                flex: "0 0 74px",
                padding: "14px 0",
                textAlign: "center",
                border: `1px solid ${d.isAvailable ? (on ? theme.text : "rgba(255,255,255,0.26)") : "rgba(255,255,255,0.06)"}`,
                background: on ? theme.text : "transparent",
                color: on ? theme.bg : d.isAvailable ? theme.text : theme.closed,
                cursor: d.isAvailable ? "pointer" : "not-allowed",
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                {shortDayLabel(d)}
              </div>
              <div style={{ fontSize: 21 }}>{d.day}</div>
              <div style={{ fontSize: 11, marginTop: 6 }}>{d.isAvailable ? "" : "Full"}</div>
            </button>
          );
        })}
        <NavCell onClick={() => step(1)}>→</NavCell>
      </div>

      {!state.day ? (
        <div style={{ ...microLabel }}>Pick a day first</div>
      ) : groups.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {groups.map((g) => (
            <div key={g.name}>
              <div style={{ ...microLabel, marginBottom: 14 }}>{g.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 8 }}>
                {g.slots.map((s) => {
                  const on = state.slot?.startMinutesOfDay === s.startMinutesOfDay;
                  return (
                    <button type="button"
                      key={s.startMinutesOfDay}
                      onClick={() => dispatch({ type: "pickSlot", slot: { ...s, date: s.date || state.day.date } })}
                      style={{ ...clickable,
                        padding: "15px 6px",
                        textAlign: "center",
                        fontSize: 13,
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        border: `1px solid ${on ? theme.text : "rgba(255,255,255,0.26)"}`,
                        background: on ? theme.text : "transparent",
                        color: on ? theme.bg : theme.text,
                      }}
                    >
                      {slotLabel(s)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Fully booked"
          theme={theme}
          action={
            bookable.length ? (
              <button type="button"
                onClick={() => dispatch({ type: "pickDay", day: bookable[0] })}
                style={{ ...clickable, ...primaryButton(true), display: "inline-block" }}
              >
                Next available day
              </button>
            ) : null
          }
        >
          Nothing left on this day for the services you picked.
        </EmptyState>
      )}
    </div>
  );
}

function NavCell({ children, onClick }) {
  return (
    <button type="button"
      onClick={onClick}
      style={{ ...clickable,
        flex: "0 0 44px",
        alignSelf: "stretch",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid rgba(255,255,255,0.26)`,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function DetailsStep({ b, onFixTime }) {
  const { state, derived, dispatch } = b;
  const set = (patch) => dispatch({ type: "guest", patch });

  const lines = [
    ["Location", state.location?.name || "—"],
    ["Barber", state.teamMember ? fullName(state.teamMember) : state.anyTeamMember ? "Any barber" : "—"],
    ["Services", state.selected.map((s) => s.name).join(", ") || "—"],
    ["Duration", duration(derived.minutes)],
    ["When", state.slot ? `${slotLabel(state.slot)}, ${dayLabel(state.day)}` : "—"],
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 44, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 340px", minWidth: 270, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field label="First name *" style={{ flex: "1 1 150px" }}>
            <input value={state.guest.firstName} onChange={(e) => set({ firstName: e.target.value })} placeholder="John" style={underlineInput} />
          </Field>
          <Field label="Last name" style={{ flex: "1 1 150px" }}>
            <input value={state.guest.lastName} onChange={(e) => set({ lastName: e.target.value })} placeholder="Reed" style={underlineInput} />
          </Field>
        </div>
        <Field label="Phone *">
          <input value={state.guest.phoneNumber} onChange={(e) => set({ phoneNumber: e.target.value })} placeholder="+1 212 555 0134" style={underlineInput} />
        </Field>
        <Field label="Email">
          <input value={state.guest.email} onChange={(e) => set({ email: e.target.value })} placeholder="john@example.com" style={underlineInput} />
        </Field>
        <Field label="Note for the salon">
          <textarea
            value={state.note}
            onChange={(e) => dispatch({ type: "note", note: e.target.value })}
            rows={3}
            placeholder="Anything the barber should know"
            style={{ ...underlineInput, resize: "vertical" }}
          />
        </Field>
        <div style={{ fontSize: 12, color: theme.faint, lineHeight: 1.8 }}>
          No account is created. The salon may still require approval, in which case the booking comes back
          unconfirmed.
        </div>
      </div>

      <div style={{ flex: "1 1 260px", minWidth: 250, border: `1px solid rgba(255,255,255,0.2)`, padding: 22 }}>
        <div style={{ ...microLabel, marginBottom: 18 }}>Your appointment</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {lines.map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
              <span style={{ ...microLabel, fontSize: 11, paddingTop: 4 }}>{label}</span>
              <span style={{ textAlign: "right", fontSize: 13 }}>{value}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: `1px solid rgba(255,255,255,0.2)`,
            marginTop: 20,
            paddingTop: 18,
          }}
        >
          <span style={microLabel}>Total</span>
          <span style={{ fontSize: 28 }}>{money(derived.price)}</span>
        </div>
        {state.errors.booking ? (
          <div style={{ marginTop: 18 }}>
            <ErrorState error={state.errors.booking} theme={theme} />
            <button type="button"
              onClick={onFixTime}
              style={{ ...clickable,
                marginTop: 14,
                ...microLabel,
                color: theme.text,
                cursor: "pointer",
                borderBottom: `1px solid rgba(255,255,255,0.5)`,
                display: "inline-block",
                paddingBottom: 3,
              }}
            >
              Choose a new time
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{ ...microLabel, marginBottom: 9 }}>{label}</div>
      {children}
    </div>
  );
}

function Confirmed({ b }) {
  const { state, derived, dispatch } = b;
  const booking = state.booking;
  const lines = [
    ["Booking", `#${String(booking.id).slice(0, 8)}`],
    ["Status", booking.status],
    ["Location", state.location ? `${state.location.name} · ${state.location.streetAddress}` : "—"],
    ["Barber", state.teamMember ? fullName(state.teamMember) : "Any barber"],
    ["Services", state.selected.map((s) => s.name).join(", ")],
    ["When", `${slotLabel(state.slot)}, ${dayLabel(state.day)}`],
  ];

  return (
    <div
      style={{
        fontFamily: theme.ui,
        background: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        padding: "60px 22px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 32, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          {booking.isConfirmed ? "You're in" : "Request sent"}
        </div>
        <div style={{ fontSize: 15, color: theme.muted, lineHeight: 1.8, marginBottom: 36 }}>
          {booking.isConfirmed
            ? "Confirmation sent by text. Arrive five minutes early."
            : "This salon approves bookings manually. You'll hear back shortly."}
        </div>
        <div style={{ border: `1px solid rgba(255,255,255,0.2)` }}>
          {lines.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                padding: "16px 20px",
                borderBottom: `1px solid rgba(255,255,255,0.14)`,
              }}
            >
              <span style={{ ...microLabel, paddingTop: 4 }}>{label}</span>
              <span style={{ fontSize: 14, textAlign: "right" }}>{value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 18, padding: "18px 20px" }}>
            <span style={microLabel}>Total</span>
            <span style={{ fontSize: 26 }}>{money(booking.price ?? derived.price)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <button type="button" onClick={() => dispatch({ type: "reset" })} style={{ ...clickable, ...primaryButton(true), flex: "1 1 150px" }}>
            Book another
          </button>
          <button type="button" onClick={b.cancel} style={{ ...clickable, ...primaryButton(false), flex: "1 1 150px", cursor: "pointer", color: theme.muted }}>
            Cancel appointment
          </button>
        </div>
      </div>
    </div>
  );
}
