import React, { useState } from "react";
import HubDemo from "./demos/hub/HubDemo.jsx";
import WizardDemo from "./demos/wizard/WizardDemo.jsx";

// Two independent examples of the same flow. Delete the switcher and keep the
// one you want as your starting point.
const demos = [
  { id: "hub", label: "Appointment hub", Component: HubDemo },
  { id: "wizard", label: "Guided wizard", Component: WizardDemo },
];

export default function App() {
  const initial = new URLSearchParams(location.search).get("demo");
  const [id, setId] = useState(demos.some((d) => d.id === initial) ? initial : "hub");
  const active = demos.find((d) => d.id === id);

  const select = (next) => {
    setId(next);
    const url = new URL(location.href);
    url.searchParams.set("demo", next);
    history.replaceState(null, "", url);
  };

  return (
    <div>
      <div
        style={{
          position: "fixed",
          right: 16,
          // Clear of both demos' sticky action bars, which sit at the bottom edge.
          bottom: 84,
          zIndex: 100,
          display: "flex",
          gap: 2,
          background: "#000",
          border: "1px solid #444",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {demos.map((d) => (
          <button
            key={d.id}
            onClick={() => select(d.id)}
            style={{
              border: "none",
              padding: "9px 14px",
              fontSize: 12,
              letterSpacing: "0.06em",
              cursor: "pointer",
              background: d.id === id ? "#fff" : "transparent",
              color: d.id === id ? "#000" : "#bbb",
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
      <active.Component />
    </div>
  );
}
