import PropTypes from "prop-types";
import { forwardRef } from "react";

import AmountInput from "./AmountInput.jsx";

const AmountSection = forwardRef(function AmountSection(
  { amountMilliunits, setAmountMilliunits },
  ref,
) {
  return (
    <div ref={ref} className="mb-4">
      <label className="block text-sm font-medium text-sky-700 mb-1">
        Total Spent
      </label>
      <AmountInput value={amountMilliunits} onChange={setAmountMilliunits} />
    </div>
  );
});

AmountSection.propTypes = {
  amountMilliunits: PropTypes.number.isRequired,
  setAmountMilliunits: PropTypes.func.isRequired,
};

export default AmountSection;
