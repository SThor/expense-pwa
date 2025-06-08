import React, { forwardRef } from "react";
import AmountInput from "./AmountInput";

const AmountSection = forwardRef(function AmountSection(
  { amountMilliunits, setAmountMilliunits },
  ref
) {
  return (
    <div ref={ref} className="mb-4">
      <label className="block text-sm font-medium text-sky-700 mb-1">
        Total Spent
      </label>
      <AmountInput
        value={amountMilliunits}
        onChange={setAmountMilliunits}
      />
    </div>
  );
});

export default AmountSection;
