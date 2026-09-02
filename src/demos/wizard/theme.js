export const theme = {
  bg: "#000000",
  text: "#FFFFFF",
  secondary: "#DCDCDC",
  muted: "#ADADAD",
  faint: "#9A9A9A",
  closed: "#5E5E5E",
  accent: "#FFFFFF",
  hairline: "rgba(255,255,255,0.16)",
  hairlineStrong: "rgba(255,255,255,0.26)",
  selectedFill: "rgba(255,255,255,0.07)",
  errorFill: "rgba(255,255,255,0.05)",
  skeletonFill: "transparent",
  skeletonAnimation: "pulseline",
  ui: "Jost, system-ui, sans-serif",
  emptyTitle: { fontSize: 20, fontWeight: 400, letterSpacing: "0.08em", textTransform: "uppercase" },
};

export const microLabel = {
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: theme.muted,
};

export const row = (selected) => ({
  display: "flex",
  gap: 22,
  alignItems: "center",
  flexWrap: "wrap",
  padding: 22,
  cursor: "pointer",
  border: `1px solid ${selected ? theme.text : "rgba(255,255,255,0.2)"}`,
  background: selected ? theme.selectedFill : "transparent",
});

export const checkbox = (on, size = 22) => ({
  width: size,
  height: size,
  flex: `0 0 ${size}px`,
  border: `1px solid ${on ? theme.text : "rgba(255,255,255,0.4)"}`,
  background: on ? theme.text : "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const primaryButton = (enabled) => ({
  padding: "16px 34px",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  userSelect: "none",
  textAlign: "center",
  background: enabled ? theme.text : "transparent",
  border: enabled ? "none" : `1px solid rgba(255,255,255,0.2)`,
  color: enabled ? theme.bg : "#8F8F8F",
  cursor: enabled ? "pointer" : "not-allowed",
});

export const underlineInput = {
  width: "100%",
  padding: "14px 0",
  background: "transparent",
  border: "none",
  borderBottom: `1px solid rgba(255,255,255,0.3)`,
  color: theme.text,
  fontSize: 16,
  letterSpacing: "0.06em",
  outline: "none",
};
