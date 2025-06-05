import React from "react";

function makeConicGradient(colors) {
  if (!colors || colors.length === 0) return undefined;
  return `conic-gradient(${colors.join(", ")})`;
}

export default function ToggleButton({
  active,
  color = "#23285A",
  gradientColors,
  icon,
  label,
  onClick,
  size = 80,
  background = "#fff",
}) {
  const borderWidth = 3; // px
  const borderRadius = 16; // px, for square buttons
  const innerRadius = borderRadius - 2; // px, for inner div rounding

  // Icon rendering logic
  let iconElement;
  if (typeof icon === "string") {
    iconElement = (
      <img
        src={icon}
        alt={label}
        className="w-10 h-10 object-contain"
        style={{ filter: active ? "" : "grayscale(100%) opacity(0.7)" }}
      />
    );
  } else if (icon) {
    iconElement = React.cloneElement(icon, {
      size: 40,
      color: active ? color : "#9ca3af",
      style: { opacity: active ? 1 : 0.7 },
    });
  }

  const labelStyle = active
    ? { color }
    : { color: "#4b5563" }; // Tailwind gray-700

  // --- GRADIENT CASE ---
  if (gradientColors && gradientColors.length > 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          width: size,
          height: size,
          padding: borderWidth,
          border: "none",
          borderRadius: borderRadius,
          background: active
            ? makeConicGradient(gradientColors)
            : "#d1d5db", // gray-300 for inactive
          boxSizing: "border-box",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        className="focus:outline-none"
      >
        <div
          style={{
            width: size - borderWidth * 2,
            height: size - borderWidth * 2,
            borderRadius: innerRadius,
            background: background,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="flex-1 flex items-center justify-center">
            {iconElement}
          </div>
          <div
            className="mt-1 text-xs font-semibold"
            style={{
              ...labelStyle,
              textAlign: "center",
            }}
          >
            {label}
          </div>
        </div>
      </button>
    );
  }

  // --- CLASSIC SOLID BORDER CASE ---
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        border: `${borderWidth}px solid ${
          active ? color : "#9ca3af"
        }`, // gray-400 for inactive
        background: active ? `${color}22` : "#fff", // subtle colored bg if active
        boxSizing: "border-box",
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
      className="focus:outline-none"
    >
      <div className="flex-1 flex items-center justify-center">
        {iconElement}
      </div>
      <div
        className="mt-1 text-xs font-semibold"
        style={{
          ...labelStyle,
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </button>
  );
}