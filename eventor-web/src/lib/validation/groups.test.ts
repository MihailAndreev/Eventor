import { describe, expect, it } from "vitest";
import { validateGroupInput } from "./groups";

describe("group validation", () => {
  it("requires a title", () => {
    expect(validateGroupInput({ title: "   ", description: "" })).toEqual({
      ok: false,
      message: "Enter a group title.",
    });
  });

  it("enforces title max length", () => {
    expect(validateGroupInput({ title: "a".repeat(181), description: "" })).toEqual({
      ok: false,
      message: "Group titles must be 180 characters or less.",
    });
  });

  it("enforces description max length", () => {
    expect(
      validateGroupInput({ title: "Hikers", description: "a".repeat(1001) }),
    ).toEqual({
      ok: false,
      message: "Group descriptions must be 1000 characters or less.",
    });
  });

  it("trims valid input and normalizes an empty description", () => {
    expect(validateGroupInput({ title: " Hikers ", description: "   " })).toEqual({
      ok: true,
      title: "Hikers",
      description: null,
    });
  });
});
