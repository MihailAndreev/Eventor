import { describe, expect, it } from "vitest";
import { validateCommentText, validateEventManagementInput } from "./events";

const validEventInput = {
  title: "Trail morning",
  description: "",
  eventDate: "2026-06-10",
  eventTime: "09:30",
  location: "",
  capacity: "",
};

describe("event validation", () => {
  it("requires a title", () => {
    expect(validateEventManagementInput({ ...validEventInput, title: " " })).toEqual({
      ok: false,
      message: "Enter an event title.",
    });
  });

  it("requires a valid date", () => {
    expect(
      validateEventManagementInput({ ...validEventInput, eventDate: "2026-02-31" }),
    ).toEqual({ ok: false, message: "Enter a valid event date." });
  });

  it("requires a valid time", () => {
    expect(
      validateEventManagementInput({ ...validEventInput, eventTime: "24:00" }),
    ).toEqual({ ok: false, message: "Enter a valid event time." });
  });

  it("allows empty capacity and rejects non-positive capacity", () => {
    expect(validateEventManagementInput(validEventInput)).toMatchObject({
      ok: true,
      capacity: null,
    });
    expect(validateEventManagementInput({ ...validEventInput, capacity: "0" })).toEqual({
      ok: false,
      message: "Capacity must be empty or a positive integer.",
    });
    expect(validateEventManagementInput({ ...validEventInput, capacity: "1.5" })).toEqual({
      ok: false,
      message: "Capacity must be empty or a positive integer.",
    });
  });
});

describe("comment validation", () => {
  it("rejects empty comments", () => {
    expect(validateCommentText("   ")).toEqual({
      ok: false,
      message: "Enter a comment before saving.",
    });
  });

  it("trims whitespace", () => {
    expect(validateCommentText("  See you there  ")).toEqual({
      ok: true,
      text: "See you there",
    });
  });

  it("enforces max length", () => {
    expect(validateCommentText("a".repeat(1001))).toEqual({
      ok: false,
      message: "Comments must be 1000 characters or less.",
    });
  });
});
