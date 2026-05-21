import { describe, expect, it } from "vitest";
import { validateLoginInput, validateRegistrationInput } from "./auth";

describe("auth validation", () => {
  it("requires a registration email", () => {
    expect(
      validateRegistrationInput({
        name: "Ada Lovelace",
        email: "",
        password: "password123",
      }),
    ).toEqual({ ok: false, message: "Enter a valid email address." });
  });

  it("requires a valid registration email format", () => {
    expect(
      validateRegistrationInput({
        name: "Ada Lovelace",
        email: "not-email",
        password: "password123",
      }),
    ).toEqual({ ok: false, message: "Enter a valid email address." });
  });

  it("requires a registration password", () => {
    expect(
      validateRegistrationInput({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "",
      }),
    ).toEqual({
      ok: false,
      message: "Password must be at least 8 characters.",
    });
  });

  it("validates login email and password", () => {
    expect(validateLoginInput({ email: "", password: "password123" })).toEqual({
      ok: false,
      message: "Invalid email or password.",
    });
    expect(validateLoginInput({ email: "ada@example.com", password: "" })).toEqual({
      ok: false,
      message: "Invalid email or password.",
    });
  });
});
