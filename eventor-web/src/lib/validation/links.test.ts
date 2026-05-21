import { describe, expect, it } from "vitest";
import { validateEventLinkInput } from "./links";

describe("event link validation", () => {
  it("requires a title", () => {
    expect(validateEventLinkInput({ title: " ", url: "https://example.com" })).toEqual({
      ok: false,
      message: "Enter a link title.",
    });
  });

  it("accepts valid http and https URLs", () => {
    expect(
      validateEventLinkInput({ title: "Map", url: "https://example.com/trail" }),
    ).toEqual({
      ok: true,
      title: "Map",
      url: "https://example.com/trail",
    });

    expect(validateEventLinkInput({ title: "Info", url: "http://example.com" })).toMatchObject({
      ok: true,
      url: "http://example.com/",
    });
  });

  it("rejects non-http URLs and malformed URLs", () => {
    expect(validateEventLinkInput({ title: "Bad", url: "ftp://example.com" })).toEqual({
      ok: false,
      message: "Enter a valid http or https URL.",
    });

    expect(validateEventLinkInput({ title: "Bad", url: "example.com" })).toEqual({
      ok: false,
      message: "Enter a valid http or https URL.",
    });
  });
});
