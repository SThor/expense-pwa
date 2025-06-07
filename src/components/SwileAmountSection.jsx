import React from "react";
import AmountInput from "./AmountInput";

export default function SwileAmountSection({ swileMilliunits, setSwileMilliunits, max }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-sky-700 mb-1">Amount paid by Swile</label>
      <AmountInput
        label="Amount paid by Swile"
        value={swileMilliunits}
        onChange={setSwileMilliunits}
        min={0}
        max={max}
      />
    </div>
  );
}
