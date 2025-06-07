import React from "react";
import AmountInput from "./AmountInput";

export default function AmountSection({ amountMilliunits, setAmountMilliunits }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-sky-700 mb-1">Total Spent</label>
      <AmountInput
        value={amountMilliunits}
        onChange={setAmountMilliunits}
      />
    </div>
  );
}
