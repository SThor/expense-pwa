import React from "react";
import ToggleButton from "./ToggleButton";

export default function AppToggles({ target, setTarget }) {
  return (
    <div className="flex gap-4 mb-4">
      <ToggleButton
        active={target.ynab}
        color="#5C6CFA"
        label="YNAB"
        icon="/ynab-icon.png"
        onClick={() => setTarget({ ...target, ynab: !target.ynab })}
      />
      <ToggleButton
        active={target.settleup}
        color="#f2774a"
        label="SettleUp"
        icon="/settleup-icon.png"
        onClick={() => setTarget({ ...target, settleup: !target.settleup })}
      />
    </div>
  );
}
