export const theme = {
  bg: "#151412",
  surface: "#1E1C19",
  surfaceHover: "#262320",
  tile: "#2E2A25",
  accent: "#D2603A",
  accentHover: "#E8823F",
  text: "#EDE7DB",
  muted: "#9C9488",
  faint: "#6E675C",
  disabled: "#4A453E",
  hairline: "rgba(232,226,214,0.10)",
  hairlineStrong: "rgba(232,226,214,0.18)",
  errorFill: "#241C18",
  skeletonFill: "#1E1C19",
  skeletonAnimation: "shimmer",
  display: "'Instrument Serif', Georgia, serif",
  ui: "Geist, system-ui, sans-serif",
  emptyTitle: { fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22 },
};

export const microLabel = {
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: theme.muted,
};

export const monogram = {
  width: 54,
  height: 54,
  flex: "0 0 54px",
  background: theme.tile,
  color: theme.accent,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: theme.display,
  fontSize: 20,
};

export const row = (selected) => ({
  display: "flex",
  gap: 16,
  alignItems: "center",
  padding: 18,
  background: selected ? theme.surfaceHover : theme.surface,
  boxShadow: selected ? `inset 2px 0 0 ${theme.accent}` : "none",
  cursor: "pointer",
});

export const checkbox = (on) => ({
  width: 22,
  height: 22,
  flex: "0 0 22px",
  border: `1px solid ${on ? theme.accent : "rgba(232,226,214,0.3)"}`,
  background: on ? theme.accent : "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 2,
});

export const primaryButton = (enabled) => ({
  textAlign: "center",
  padding: 15,
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "0.04em",
  userSelect: "none",
  background: enabled ? theme.accent : theme.surfaceHover,
  color: enabled ? theme.bg : theme.faint,
  cursor: enabled ? "pointer" : "not-allowed",
});

export const input = {
  width: "100%",
  padding: "13px 14px",
  background: theme.surface,
  border: `1px solid rgba(232,226,214,0.14)`,
  color: theme.text,
  fontSize: 15,
  outline: "none",
};
