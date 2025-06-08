import React, { forwardRef } from "react";
import ToggleButton from "./ToggleButton";

// Hoist gradientColors outside the component to avoid recreating it on every render
const gradientColors = [
  "#FF0080",
  "#7928CA",
  "#007AFF",
  "#00FFE7",
  "#00FF94",
  "#FFD600",
  "#FFA81F",
  "#FF0080",
];

const AccountToggles = forwardRef(function AccountToggles(props, ref) {
  return (
    <div ref={ref} className="flex gap-4 mb-4">
      <ToggleButton
        active={props.account.bourso}
        color="#d20073"
        label="BoursoBank"
        icon="/boursobank-icon.png"
        onClick={() => props.setAccount((a) => ({ ...a, bourso: !a.bourso }))}
        disabled={props.disabled}
      />
      <ToggleButton
        active={props.account.swile}
        gradientColors={gradientColors}
        label="Swile"
        icon="/swile-icon.png"
        onClick={() => props.setAccount((a) => ({ ...a, swile: !a.swile }))}
        disabled={props.disabled}
      />
    </div>
  );
});

export default AccountToggles;
