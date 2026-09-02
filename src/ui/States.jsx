import React from "react";
import { clickable } from "./clickable.js";

// Loading / empty / error blocks, themed by the demo that renders them.

export function Skeleton({ rows = 4, theme }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 80,
            background: theme.skeletonFill,
            border: `1px solid ${theme.hairline}`,
            animation: `${theme.skeletonAnimation} 1.4s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function EmptyState({ title, children, theme, action }) {
  return (
    <div
      style={{
        border: `1px dashed ${theme.hairlineStrong}`,
        padding: "44px 22px",
        textAlign: "center",
      }}
    >
      <div style={{ ...theme.emptyTitle, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.7 }}>{children}</div>
      {action ? <div style={{ marginTop: 20 }}>{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, onRetry, theme }) {
  if (!error) return null;
  return (
    <div
      style={{
        borderLeft: `2px solid ${theme.accent}`,
        background: theme.errorFill,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 5 }}>{error.message}</div>
      {error.detail ? (
        <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.55 }}>{error.detail}</div>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          style={{
            ...clickable,
            width: "auto",
            marginTop: 10,
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: theme.accent,
            cursor: "pointer",
            display: "inline-block",
          }}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
