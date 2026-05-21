import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("allows local paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
  });

  it("preserves query strings", () => {
    expect(safeRedirectPath("/groups/1/join?code=abc")).toBe(
      "/groups/1/join?code=abc",
    );
  });

  it("blocks external URLs and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://example.com/groups")).toBe("/");
    expect(safeRedirectPath("http://example.com/groups")).toBe("/");
    expect(safeRedirectPath("//example.com/groups")).toBe("/");
  });
});
