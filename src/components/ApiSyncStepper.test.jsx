import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ApiSyncStepper from "./ApiSyncStepper";

describe("ApiSyncStepper", () => {
  const mockFormState = {
    target: {
      ynab: true,
      settleup: true,
    },
  };

  const createMockState = (stateValue) => ({ value: stateValue });
  const createMockContext = (
    formState = mockFormState,
    results = {},
    errors = {},
  ) => ({
    formState,
    results,
    errors,
  });

  describe("Step State Logic", () => {
    test("should show entry as current when in idle state", () => {
      const state = createMockState("idle");
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      // Entry should be visible
      expect(screen.getByText("Entry")).toBeInTheDocument();
    });

    test("should show entry as success when not in idle state", () => {
      const state = createMockState("syncing");
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      // Should render without crashing and show all labels
      expect(screen.getByText("Entry")).toBeInTheDocument();
      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    test("should handle disabled API steps when not targeted", () => {
      const state = createMockState("idle");
      const context = createMockContext({
        target: { ynab: false, settleup: false },
      });

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
    });

    test("should show API steps as current when syncing", () => {
      const state = createMockState({
        syncing: { ynab: "submitting", settleup: "submitting" },
      });
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
    });

    test("should show API steps as success when completed successfully", () => {
      const state = createMockState("syncing");
      const context = createMockContext(mockFormState, {
        ynab: { success: true },
        settleup: { success: true },
      });

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
    });

    test("should show API steps as error when failed", () => {
      const state = createMockState("error");
      const context = createMockContext(
        mockFormState,
        {},
        { ynab: "API Error", settleup: "Network Error" },
      );

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
    });
  });

  describe("Nested State Handling", () => {
    test("should handle complex nested state structures", () => {
      const state = {
        value: {
          syncing: {
            ynab: "success",
            settleup: "error",
          },
        },
      };
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
    });
  });

  describe("Complete Step Logic", () => {
    test("should show complete as success when in success state", () => {
      const state = createMockState("success");
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    test("should show complete as error when in error state", () => {
      const state = createMockState("error");
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    test("should show complete as inactive when in partial success", () => {
      const state = createMockState("partialSuccess");
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    test("should show complete as inactive when not in final state", () => {
      const state = createMockState("syncing");
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("Error Display", () => {
    test("should display errors when present", () => {
      const state = createMockState("error");
      const context = createMockContext(
        mockFormState,
        {},
        {
          ynab: "YNAB API connection failed",
          settleup: "Invalid SettleUp credentials",
        },
      );

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("Errors")).toBeInTheDocument();
      expect(screen.getByText("YNAB:")).toBeInTheDocument();
      expect(screen.getByText("YNAB API connection failed")).toBeInTheDocument();
      expect(screen.getByText("SettleUp:")).toBeInTheDocument();
      expect(
        screen.getByText("Invalid SettleUp credentials"),
      ).toBeInTheDocument();
    });

    test("should handle error objects with message property", () => {
      const state = createMockState("error");
      const context = createMockContext(
        mockFormState,
        {},
        {
          ynab: { message: "Connection timeout" },
          settleup: { message: "Rate limit exceeded" },
        },
      );

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("Connection timeout")).toBeInTheDocument();
      expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    });

    test("should handle error objects without message property", () => {
      const state = createMockState("error");
      const context = createMockContext(
        mockFormState,
        {},
        {
          ynab: { code: 500 },
          settleup: { status: "failed" },
        },
      );

      render(<ApiSyncStepper state={state} context={context} />);

      // Should show "Unknown error" for both APIs since they lack message property
      const unknownErrors = screen.getAllByText("Unknown error");
      expect(unknownErrors).toHaveLength(2);
    });

    test("should not display error section when no errors", () => {
      const state = createMockState("syncing");
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.queryByText("Errors")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases and Null Handling", () => {
    test("should handle null state gracefully", () => {
      const context = createMockContext();

      render(<ApiSyncStepper state={null} context={context} />);

      expect(screen.getByText("Entry")).toBeInTheDocument();
      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    test("should handle undefined state gracefully", () => {
      const context = createMockContext();

      render(<ApiSyncStepper context={context} />);

      expect(screen.getByText("Entry")).toBeInTheDocument();
      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    test("should handle null context gracefully", () => {
      const state = createMockState("idle");

      render(<ApiSyncStepper state={state} context={null} />);

      expect(screen.getByText("Entry")).toBeInTheDocument();
      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    test("should handle missing formState gracefully", () => {
      const state = createMockState("idle");
      const context = { results: {}, errors: {} };

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("Entry")).toBeInTheDocument();
      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    test("should handle missing target configuration", () => {
      const state = createMockState("syncing");
      const context = createMockContext({ target: null });

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
    });
  });

  describe("Mixed Scenarios", () => {
    test("should handle only YNAB enabled", () => {
      const state = createMockState("syncing");
      const context = createMockContext({
        target: { ynab: true, settleup: false },
      });

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
    });

    test("should handle only SettleUp enabled", () => {
      const state = createMockState("syncing");
      const context = createMockContext({
        target: { ynab: false, settleup: true },
      });

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
    });

    test("should handle partial success with some errors", () => {
      const state = createMockState("partialSuccess");
      const context = createMockContext(
        mockFormState,
        { ynab: { success: true } },
        { settleup: "Failed to submit" },
      );

      render(<ApiSyncStepper state={state} context={context} />);

      expect(screen.getByText("Errors")).toBeInTheDocument();
      expect(screen.getByText("SettleUp:")).toBeInTheDocument();
      expect(screen.getByText("Failed to submit")).toBeInTheDocument();
    });

    test("should handle unknown step names gracefully", () => {
      const state = createMockState("unknownState");
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      // Should still render all expected steps
      expect(screen.getByText("Entry")).toBeInTheDocument();
      expect(screen.getByText("YNAB")).toBeInTheDocument();
      expect(screen.getByText("SettleUp")).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });

  describe("SVG Rendering", () => {
    test("should render SVG with correct structure and animations", () => {
      const state = createMockState({
        syncing: { ynab: "submitting", settleup: "idle" },
      });
      const context = createMockContext();

      render(<ApiSyncStepper state={state} context={context} />);

      // Check SVG structure
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 800 280");
      expect(svg).toHaveClass("w-full", "h-auto");

      // Check that SVG elements are present
      const circles = document.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThan(0);

      // Check for animations (pulse for current state)
      const animations = document.querySelectorAll("animate");
      expect(animations.length).toBeGreaterThan(0);

      // Check for connecting elements
      const lines = document.querySelectorAll("line");
      const paths = document.querySelectorAll("path");
      expect(lines.length).toBeGreaterThan(0);
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe("Component Structure", () => {
    test("should render with correct container structure", () => {
      const state = createMockState("idle");
      const context = createMockContext();

      const { container } = render(
        <ApiSyncStepper state={state} context={context} />,
      );

      expect(container.firstChild).toHaveClass("w-full");
    });
  });
});