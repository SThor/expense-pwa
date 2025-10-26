import PropTypes from "prop-types";
import { useState, useEffect } from "react";

/**
 * AmountInput component for YNAB-style entry.
 * Props:
 *   value: number (milliunits, negative for expense)
 *   onChange: function (milliunits: number) => void
 *   max: number (optional, maximum value in milliunits)
 *   min: number (optional, minimum value in milliunits)
 */
export default function AmountInput({ value, onChange, max, min }) {
  // Internal state: string for display
  const [display, setDisplay] = useState("");
  // Remove local isNegative state, always derive from value
  const isNegative = value <= 0;

  // Convert milliunits to display string
  function milliUnitsToDisplay(milliunits) {
    const absMilli = Math.abs(milliunits);
    const euros = (absMilli / 1000).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return euros === "0,00" ? "" : euros;
  }

  // Convert milliunits to display string
  useEffect(() => {
    setDisplay(milliUnitsToDisplay(value));
  }, [value]);

  // Helper function to apply constraints to a value
  function applyConstraints(val) {
    let constrainedValue = val;

    // Apply max constraint if provided
    if (max !== undefined && constrainedValue > max) {
      constrainedValue = max;
    }

    // Apply min constraint if provided
    if (min !== undefined && constrainedValue < min) {
      constrainedValue = min;
    }

    return constrainedValue;
  }

  // Apply constraints when min or max props change
  useEffect(() => {
    const constrainedValue = applyConstraints(value);

    // Only call onChange if the value needs to be constrained
    if (constrainedValue !== value) {
      onChange(constrainedValue);
    }
  }, [min, max]);

  // Format input as YNAB-style cents (last 2 digits = cents)
  function formatAmountInput(raw) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    let num = parseFloat(digits) / 100;
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Convert display string to milliunits (int)
  function displayToMilliunits(str, negative) {
    const digits = str.replace(/\D/g, "");
    if (!digits) return 0;
    let num = parseInt(digits, 10); // e.g. 12 for 0.12
    let milli = num * 10; // 0.12€ = 12 * 10 = 120 milliunits
    return negative ? -milli : milli;
  }

  // Apply constraints and update the value
  function applyConstraintsAndUpdate(newValue) {
    const constrainedValue = applyConstraints(newValue);

    // Update display to reflect the final value (after constraints)
    setDisplay(milliUnitsToDisplay(constrainedValue));

    onChange(constrainedValue);
  }

  function handleChange(e) {
    const raw = e.target.value;
    const formatted = formatAmountInput(raw);

    const newValue = displayToMilliunits(formatted, isNegative);
    applyConstraintsAndUpdate(newValue);
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("Text");
    const formatted = formatAmountInput(pasted);

    const newValue = displayToMilliunits(formatted, isNegative);
    applyConstraintsAndUpdate(newValue);
  }

  function handleSignToggle() {
    const newValue = -value;
    applyConstraintsAndUpdate(newValue);
  }

  return (
    <div className="relative w-full">
      <span
        className={`absolute left-3 top-1/2 -translate-y-1/2 select-none cursor-pointer transition-colors duration-150 text-lg font-bold ${
          isNegative ? "text-red-500" : "text-green-600"
        }`}
        onClick={handleSignToggle}
        style={{ userSelect: "none" }}
        tabIndex={0}
        role="button"
        aria-label={isNegative ? "Expense" : "Income"}
      >
        {isNegative ? "-" : "+"}
      </span>
      <input
        className={`input input-bordered w-full pl-9 pr-7 py-2 unified-border ${
          isNegative ? "bg-red-50/40" : "bg-green-50/40"
        }`}
        type="text"
        inputMode="decimal"
        placeholder="Montant"
        value={display}
        onChange={handleChange}
        onPaste={handlePaste}
        required
        style={{}}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none select-none text-lg font-medium">
        €
      </span>
    </div>
  );
}

AmountInput.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  max: PropTypes.number,
  min: PropTypes.number,
};
