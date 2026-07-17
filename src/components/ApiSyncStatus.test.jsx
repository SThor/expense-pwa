import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { API_STATUS } from "../hooks/useApiSync";

import ApiSyncStatus from "./ApiSyncStatus.jsx";

function renderStatus(overrides = {}) {
  const onRetryYnab = vi.fn();
  const onRetrySettleup = vi.fn();

  render(
    <ApiSyncStatus
      ynab={{ status: API_STATUS.SUCCESS, error: null }}
      settleup={{ status: API_STATUS.SUCCESS, error: null }}
      onRetryYnab={onRetryYnab}
      onRetrySettleup={onRetrySettleup}
      {...overrides}
    />,
  );

  return { onRetryYnab, onRetrySettleup };
}

describe("ApiSyncStatus", () => {
  it("renders nothing when both APIs are idle", () => {
    const { container } = render(
      <ApiSyncStatus
        ynab={{ status: API_STATUS.IDLE, error: null }}
        settleup={{ status: API_STATUS.SKIPPED, error: null }}
        onRetryYnab={vi.fn()}
        onRetrySettleup={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the current status labels with the API names", () => {
    render(
      <ApiSyncStatus
        ynab={{ status: API_STATUS.FETCHING, error: null }}
        settleup={{ status: API_STATUS.READY, error: null }}
        onRetryYnab={vi.fn()}
        onRetrySettleup={vi.fn()}
      />,
    );

    expect(screen.getByText(/YNAB fetching data/i)).toBeInTheDocument();
    expect(screen.getByText(/SettleUp ready/i)).toBeInTheDocument();
  });

  it("renders retry buttons for error states and disables them immediately on click", () => {
    const { onRetrySettleup } = renderStatus({
      ynab: { status: API_STATUS.SUCCESS, error: null },
      settleup: {
        status: API_STATUS.ENTER_ERROR,
        error: "Temporary network issue",
      },
    });

    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toHaveAttribute("type", "button");

    fireEvent.click(retryButton);

    expect(retryButton).toBeDisabled();
    expect(onRetrySettleup).toHaveBeenCalledTimes(1);
  });
});
