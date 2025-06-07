import React from "react";
import ToggleButton from "./ToggleButton";

export default function AccountToggles({ account, setAccount, disabled }) {
  return (
    <div className="flex gap-4 mb-4">
      <ToggleButton
        active={account.bourso}
        color="#d20073"
        label="BoursoBank"
        icon="/boursobank-icon.png"
        onClick={() => setAccount((a) => ({ ...a, bourso: !a.bourso }))}
        disabled={disabled}
      />
      <ToggleButton
        active={account.swile}
        gradientColors={[
          "#FF0080",
          "#7928CA",
          "#007AFF",
          "#00FFE7",
          "#00FF94",
          "#FFD600",
          "#FF4B1F",
          "#FF0080",
        ]}
        label="Swile"
        icon="/swile-icon.png"
        onClick={() => setAccount((a) => ({ ...a, swile: !a.swile }))}
        disabled={disabled}
      />
    </div>
  );
}
