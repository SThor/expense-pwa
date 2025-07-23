import PropTypes from "prop-types";
import { forwardRef } from "react";

import AmountInput from "./AmountInput.jsx";

const SwileAmountSection = forwardRef(function SwileAmountSection(
  { swileMilliunits, setSwileMilliunits, min },
  ref,
) {
  return (
    <div ref={ref} className="mb-4">
      <label className="block text-sm font-medium text-sky-700 mb-1">
        Amount paid by Swile
      </label>
      <AmountInput
        label="Amount paid by Swile"
        value={swileMilliunits}
        onChange={setSwileMilliunits}
        min={min || undefined}
        max={0}
      />
    </div>
  );
});

export default SwileAmountSection;

SwileAmountSection.propTypes = {
  swileMilliunits: PropTypes.number.isRequired,
  setSwileMilliunits: PropTypes.func.isRequired,
  min: PropTypes.number,
};
