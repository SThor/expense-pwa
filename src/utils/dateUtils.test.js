import { describe, expect, it } from "vitest";

import { formatYYYYMMDDLocal } from "./dateUtils";

describe("formatYYYYMMDDLocal", () => {
  it("formats a normal local date as YYYY-MM-DD", () => {
    const d = new Date(2023, 0, 2); // Jan 2, 2023 local time
    expect(formatYYYYMMDDLocal(d)).toBe("2023-01-02");
  });

  it("pads month and day with leading zeros", () => {
    const d = new Date(2023, 8, 7); // Sep 7, 2023
    expect(formatYYYYMMDDLocal(d)).toBe("2023-09-07");
  });

  it("throws on invalid date", () => {
    const invalid = new Date("not-a-date");
    expect(() => formatYYYYMMDDLocal(invalid)).toThrow(TypeError);
  });

  it("throws when input is not a Date", () => {
    // @ts-expect-error - non-Date argument
    expect(() => formatYYYYMMDDLocal("2023-01-02")).toThrow(TypeError);
  });
});
