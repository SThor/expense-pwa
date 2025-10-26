import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import AmountInput from "./AmountInput.jsx";

describe("AmountInput with max/min constraints", () => {
  it("caps input value at maximum when max prop is provided", () => {
    const mockOnChange = vi.fn();
    const maxValue = 0; // 0.00 € in milliunits

    render(
      <AmountInput
        value={-10000} // Start with negative value (-10.00 €)
        onChange={mockOnChange}
        max={maxValue}
      />,
    );

    const signButton = screen.getByRole("button");

    // Click the sign toggle to change from negative to positive
    fireEvent.click(signButton);

    // This should toggle the value to +10000, but should be capped at max (0)
    expect(mockOnChange).toHaveBeenCalledWith(maxValue);
  });

  it("caps value when value prop exceeds maximum", () => {
    const mockOnChange = vi.fn();
    const maxValue = 0; // 0.00 € in milliunits

    const { rerender } = render(
      <AmountInput
        value={-10000} // Start with negative value (-10.00 €)
        onChange={mockOnChange}
        max={maxValue}
      />,
    );

    // Change the value prop to a positive value that exceeds max
    rerender(
      <AmountInput
        value={15000} // Change to positive value (+15.00 €)
        onChange={mockOnChange}
        max={maxValue}
      />,
    );

    // The display should show the actual value (not capped) since this is controlled by the parent
    // But if user tries to input, it should be capped
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "20.00" } });

    // Should call onChange with the capped value (0 milliunits)
    expect(mockOnChange).toHaveBeenCalledWith(maxValue);
  });

  it("caps pasted value at maximum when max prop is provided", () => {
    const mockOnChange = vi.fn();
    const maxValue = 0; // 0.00 € in milliunits

    render(
      <AmountInput
        value={5000} // Start with positive value (5.00 €)
        onChange={mockOnChange}
        max={maxValue}
      />,
    );

    const input = screen.getByRole("textbox");

    // Try to paste 15.50 € (which should be capped at 0)
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => "15.50",
      },
    });

    // Should call onChange with the capped value (0 milliunits)
    expect(mockOnChange).toHaveBeenCalledWith(maxValue);
  });

  it("allows input below maximum when max prop is provided", () => {
    const mockOnChange = vi.fn();
    const maxValue = 0; // 0.00 € in milliunits

    render(
      <AmountInput
        value={-10000} // Start with negative value (-10.00 €)
        onChange={mockOnChange}
        max={maxValue}
      />,
    );

    const input = screen.getByRole("textbox");

    // Input 5.00 € (which should result in -5000, below max of 0, so allowed)
    fireEvent.change(input, { target: { value: "5.00" } });

    // Should call onChange with the actual value (-5000 milliunits)
    expect(mockOnChange).toHaveBeenCalledWith(-5000);
  });

  it("respects min constraint when min prop is provided", () => {
    const mockOnChange = vi.fn();
    const minValue = -50000; // -50.00 € in milliunits

    render(
      <AmountInput
        value={-25000} // Start with -25.00 €
        onChange={mockOnChange}
        min={minValue}
      />,
    );

    const input = screen.getByRole("textbox");

    // Try to input 60.00 € (which should be capped at 50.00 € = -50000 milliunits minimum)
    fireEvent.change(input, { target: { value: "60.00" } });

    // Should call onChange with the minimum value (-50000 milliunits)
    expect(mockOnChange).toHaveBeenCalledWith(minValue);
  });

  it("works correctly for Swile use case - enforces min constraint", () => {
    const mockOnChange = vi.fn();
    const transactionAmount = -50000; // -50.00 € transaction

    render(
      <AmountInput
        value={-25000} // Start with -25.00 € Swile amount
        onChange={mockOnChange}
        min={transactionAmount} // Swile can't pay more than transaction amount
        max={0} // Swile can't be positive
      />,
    );

    const input = screen.getByRole("textbox");

    // Try to input 60.00 € which would be -60000 milliunits (more negative than min)
    // This should be capped to the minimum allowed value of -50000 milliunits
    fireEvent.change(input, { target: { value: "60.00" } });

    // Should call onChange with the minimum value (can't be more negative than transaction)
    expect(mockOnChange).toHaveBeenCalledWith(transactionAmount);
  });

  it("works correctly for Swile use case - enforces max constraint", () => {
    const mockOnChange = vi.fn();
    const transactionAmount = -50000; // -50.00 € transaction

    render(
      <AmountInput
        value={5000} // Start with positive value (+5.00 €)
        onChange={mockOnChange}
        min={transactionAmount} // Swile can't pay more than transaction amount
        max={0} // Swile can't be positive
      />,
    );

    const input = screen.getByRole("textbox");

    // Try to input 10.00 € which would be +10000 milliunits (more than max of 0)
    // This should be capped to the maximum allowed value of 0 milliunits
    fireEvent.change(input, { target: { value: "10.00" } });

    // Should call onChange with the maximum value (can't be positive)
    expect(mockOnChange).toHaveBeenCalledWith(0);
  });

  it("automatically applies constraint when min prop changes (Swile cap issue)", () => {
    const mockOnChange = vi.fn();

    // Initial state: Swile amount is -25.00 €, transaction amount is -20.00 €
    // This means Swile is trying to pay more than the transaction amount, which shouldn't be allowed
    const { rerender } = render(
      <AmountInput
        value={-25000} // Swile amount: -25.00 €
        onChange={mockOnChange}
        min={-20000} // Transaction amount: -20.00 € (Swile can't exceed this)
        max={0} // Swile can't be positive
      />,
    );

    // The constraint should be applied immediately, capping to -20000
    expect(mockOnChange).toHaveBeenCalledWith(-20000);

    // Clear mock to test the next scenario
    mockOnChange.mockClear();

    // Now the transaction amount increases to -30.00 €
    // Swile amount is at -20.00 € (after the previous cap), which is now within bounds
    rerender(
      <AmountInput
        value={-20000} // Current Swile amount after previous cap: -20.00 €
        onChange={mockOnChange}
        min={-30000} // New transaction amount: -30.00 € (larger transaction)
        max={0}
      />,
    );

    // No constraint should be applied since -20000 is between -30000 (min) and 0 (max)
    expect(mockOnChange).not.toHaveBeenCalled();

    // Clear mock for next test
    mockOnChange.mockClear();

    // Now the transaction amount decreases to -15.00 €
    // Swile amount is at -20.00 €, which exceeds the new transaction amount
    rerender(
      <AmountInput
        value={-20000} // Current Swile amount: -20.00 €
        onChange={mockOnChange}
        min={-15000} // New transaction amount: -15.00 € (smaller transaction)
        max={0}
      />,
    );

    // The constraint should be applied, capping to -15000
    expect(mockOnChange).toHaveBeenCalledWith(-15000);
  });
});
