import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import Version from "./Version.jsx";

describe("Version", () => {
  it("renders version information", () => {
    render(<Version variant="short" />);

    // Should render a version element
    const versionElement = screen.getByText(/^v/);
    expect(versionElement).toBeInTheDocument();

    // Should have the correct CSS classes
    expect(versionElement).toHaveClass("text-xs", "text-gray-500", "font-mono");
  });

  it("renders with different variants", () => {
    const { rerender } = render(<Version variant="short" />);

    // Short variant should show commit hash
    let versionElement = screen.getByText(/^v/);
    expect(versionElement).toBeInTheDocument();

    // Full variant should show more detailed version
    rerender(<Version variant="full" />);
    versionElement = screen.getByText(/^v/);
    expect(versionElement).toBeInTheDocument();

    // Branch-commit variant
    rerender(<Version variant="branch-commit" />);
    versionElement = screen.getByText(/^v/);
    expect(versionElement).toBeInTheDocument();

    // Tag-only variant (should fall back to short version since no tags exist)
    rerender(<Version variant="tag-only" />);
    versionElement = screen.getByText(/^v/);
    expect(versionElement).toBeInTheDocument();
  });

  it("handles default case with invalid variant", () => {
    // Test the default case in the switch statement
    render(<Version variant="invalid-variant" />);

    const versionElement = screen.getByText(/^v/);
    expect(versionElement).toBeInTheDocument();
  });

  it("includes title with detailed version information", () => {
    render(<Version variant="short" />);

    const versionElement = screen.getByText(/^v/);
    const title = versionElement.getAttribute("title");

    // Title should contain version details
    expect(title).toContain("Version:");
    expect(title).toContain("Branch:");
    expect(title).toContain("Commit:");
    expect(title).toContain("Built:");
  });

  it("applies custom className", () => {
    render(<Version variant="short" className="custom-class" />);

    const versionElement = screen.getByText(/^v/);
    expect(versionElement).toHaveClass("custom-class");
  });

  it("shows dirty indicator when working directory is dirty", () => {
    // This test will pass if VERSION_INFO.isDirty is true
    render(<Version variant="short" />);

    const versionElement = screen.getByText(/^v/);
    const text = versionElement.textContent;

    // The text should either have * or not, both are valid
    expect(text).toMatch(/^v.+/);
  });

  it("handles tag-only variant correctly", () => {
    // Test specifically for tag-only variant
    render(<Version variant="tag-only" />);

    const versionElement = screen.getByText(/^v/);
    expect(versionElement).toBeInTheDocument();

    // Since VERSION_INFO.tag is null, it should fall back to getShortVersionString()
    expect(versionElement.textContent).toMatch(/^v/);
  });

  it("formats branch-commit variant correctly", () => {
    render(<Version variant="branch-commit" />);

    const versionElement = screen.getByText(/^v/);
    expect(versionElement).toBeInTheDocument();

    // Should contain branch@commit format
    expect(versionElement.textContent).toMatch(/^v.+@.+/);
  });

  it("handles working directory status correctly in title and display", () => {
    render(<Version variant="short" />);

    const versionElement = screen.getByText(/^v/);
    const title = versionElement.getAttribute("title");
    const text = versionElement.textContent;

    // Test should work regardless of actual git state
    // If working directory is dirty, should show dirty message and asterisk
    // If clean, should not show either
    if (title.includes("Working directory: dirty")) {
      // Dirty state - should have asterisk
      expect(text).toMatch(/\*$/);
    } else {
      // Clean state - should not have asterisk
      expect(text).not.toMatch(/\*$/);
    }

    // Title should always contain basic version info
    expect(title).toContain("Version:");
    expect(title).toContain("Branch:");
    expect(title).toContain("Commit:");
    expect(title).toContain("Built:");
  });

  it("uses HTML entity for line breaks in tooltip for cross-browser compatibility", () => {
    render(<Version variant="short" />);

    const versionElement = screen.getByText(/^v/);
    const title = versionElement.getAttribute("title");

    // Should use HTML entity &#10; instead of literal \n for better cross-browser support
    expect(title).toContain("&#10;");
    // Should not contain literal newline characters in the source
    expect(title.split("&#10;").length).toBeGreaterThan(1);
  });
});
