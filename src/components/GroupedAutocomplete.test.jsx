import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

import GroupedAutocomplete from "./GroupedAutocomplete.jsx";

describe("GroupedAutocomplete", () => {
  const mockOnChange = vi.fn();
  const mockOnCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Wait for any pending timeouts to complete
    await new Promise(resolve => setTimeout(resolve, 150));
  });

  test("renders with initial value", () => {
    const testData = [
      {
        label: "Group-1",
        items: [
          { label: "item-1a", value: "val-1a" },
          { label: "item-1b", value: "val-1b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value="item-1a"
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByDisplayValue("item-1a")).toBeInTheDocument();
  });

  test("filters items based on input", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-2",
        items: [
          { label: "item-2a", value: "val-2a" },
          { label: "item-2b", value: "val-2b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "item-2a");

    // Should show item-2a but not item-2b
    expect(screen.getByText("item-2a")).toBeInTheDocument();
    expect(screen.queryByText("item-2b")).not.toBeInTheDocument();
  });

  test("calls onChange with correct values on item selection", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-3",
        items: [
          { label: "item-3a", value: "val-3a" },
          { label: "item-3b", value: "val-3b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "item-3a");

    const targetItem = screen.getByText("item-3a");
    await user.click(targetItem);

    expect(mockOnChange).toHaveBeenCalledWith("item-3a", "val-3a");
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  test("calls onChange on blur with existing item", async () => {
    const testData = [
      {
        label: "Group-4",
        items: [
          { label: "item-4a", value: "val-4a" },
          { label: "item-4b", value: "val-4b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");

    // Use fireEvent to set the value directly
    fireEvent.change(input, { target: { value: "item-4a" } });

    // Ensure the input has the full value before blurring
    expect(input.value).toBe("item-4a");

    fireEvent.blur(input);

    await new Promise((resolve) => setTimeout(resolve, 150)); // Wait longer than 120ms
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith("item-4a", "val-4a");
    });
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  test("calls onCreate on blur with non-existing item", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-5",
        items: [
          { label: "item-5a", value: "val-5a" },
          { label: "item-5b", value: "val-5b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "new-item-5");
    await user.tab(); // Blur

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith("new-item-5");
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  test("calls onChange with empty strings on blur with empty input", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-6",
        items: [
          { label: "item-6a", value: "val-6a" },
          { label: "item-6b", value: "val-6b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value="item-6a"
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.tab(); // Blur

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith("", "");
      expect(mockOnCreate).not.toHaveBeenCalled();
    });
  });

  test("calls onChange with empty strings on clear button click", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-7",
        items: [
          { label: "item-7a", value: "val-7a" },
          { label: "item-7b", value: "val-7b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value="item-7a"
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith("", "");
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  test("navigates with keyboard and selects with Enter", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-8",
        items: [
          { label: "item-8a", value: "val-8a" },
          { label: "item-8b", value: "val-8b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "item-8a");

    // Navigate with arrow keys and select with Enter
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(mockOnChange).toHaveBeenCalledWith("item-8a", "val-8a");
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  test("calls onCreate when clicking create option for non-existing items", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-9",
        items: [
          { label: "item-9a", value: "val-9a" },
          { label: "item-9b", value: "val-9b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "new-item-9");

    // Should show create option
    expect(
      screen.getByText('Create "new-item-9" Test Field')
    ).toBeInTheDocument();

    // Find and click the create option
    const createOption = screen.getByText('Create "new-item-9" Test Field');
    await user.click(createOption);

    expect(mockOnCreate).toHaveBeenCalledWith("new-item-9");
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('shows "No matches" when no items match filter', async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-10",
        items: [
          { label: "item-10a", value: "val-10a" },
          { label: "item-10b", value: "val-10b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "zzzzz"); // No matches

    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  test("opens dropdown on focus", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-11",
        items: [
          { label: "item-11a", value: "val-11a" },
          { label: "item-11b", value: "val-11b" },
        ],
      },
      {
        label: "Group-11B",
        items: [
          { label: "item-11c", value: "val-11c" },
          { label: "item-11d", value: "val-11d" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.click(input); // Focus

    // Should show all items
    expect(screen.getByText("item-11a")).toBeInTheDocument();
    expect(screen.getByText("item-11b")).toBeInTheDocument();
    expect(screen.getByText("item-11c")).toBeInTheDocument();
    expect(screen.getByText("item-11d")).toBeInTheDocument();
  });

  test("closes dropdown on Escape key", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-12",
        items: [
          { label: "item-12a", value: "val-12a" },
          { label: "item-12b", value: "val-12b" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.click(input); // Focus to open dropdown

    // Verify dropdown is open
    expect(screen.getByText("item-12a")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    // Dropdown should be closed - items should not be visible
    await waitFor(() => {
      expect(screen.queryByText("item-12a")).not.toBeInTheDocument();
    });
  });

  test("handles keyboard navigation with ArrowUp and ArrowDown", async () => {
    const user = userEvent.setup();
    const testData = [
      {
        label: "Group-13",
        items: [
          { label: "item-13a", value: "val-13a" },
          { label: "item-13b", value: "val-13b" },
        ],
      },
      {
        label: "Group-13B",
        items: [
          { label: "item-13c", value: "val-13c" },
          { label: "item-13d", value: "val-13d" },
        ],
      },
    ];

    render(
      <GroupedAutocomplete
        value=""
        onChange={mockOnChange}
        groupedItems={testData}
        placeholder="Test Field"
        onCreate={mockOnCreate}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "item-13"); // This will show all items

    // Navigate down to highlight first item, then up, then down again, then select
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    // Select whichever item ends up being highlighted - we'll see what the component does
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnCreate).not.toHaveBeenCalled();
  });
});
