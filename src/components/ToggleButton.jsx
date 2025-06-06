import React, { useRef } from "react";

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
  const borderWidth = 3;
  const borderRadius = 16;
  const innerRadius = borderRadius - 2;
  const isGradient = gradientColors && gradientColors.length > 0;

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

  const buttonStyle = {
    width: size,
    height: size,
    borderRadius: borderRadius,
    boxSizing: "border-box",
    transition: "background 0.2s, border 0.2s, color 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isGradient ? borderWidth : 0,
    border: isGradient ? "none" : `${borderWidth}px solid ${active ? color : "#9ca3af"}`,
    background: isGradient
      ? (active ? makeConicGradient(gradientColors) : "#9ca3af")
      : (active ? `${color}22` : "#fff"),
    outline: "none",
    boxShadow: "none",
  };

  // --- Prevent background flash on gradient variant ---
  const buttonRef = useRef(null);
  const handleMouseDown = (e) => {
    if (buttonRef.current && isGradient) {
      buttonRef.current.style.background = active
        ? makeConicGradient(gradientColors)
        : "#9ca3af";
    }
    // Prevent default active background flash
    if (isGradient) {
      e.preventDefault();
    }
  };
  const handleMouseUp = () => {
    if (buttonRef.current && isGradient) {
      buttonRef.current.style.background = active
        ? makeConicGradient(gradientColors)
        : "#9ca3af";
    }
  };

  const innerContainerStyle = isGradient
    ? {
        width: size - borderWidth * 2,
        height: size - borderWidth * 2,
        borderRadius: innerRadius,
        background: background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
      };

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={buttonStyle}
      className="focus:outline-none"
    >
      <div style={innerContainerStyle}>
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