import { describe, expect, it } from "vitest";
import { createCoverImageKey } from "@/lib/storage/r2";
import { validateCoverImageFile } from "./media";

describe("cover image validation", () => {
  it("allows jpeg, png, and webp files up to 5 MB", () => {
    const file = new File(["image"], "cover.png", { type: "image/png" });

    expect(validateCoverImageFile(file)).toEqual({
      ok: true,
      mimeType: "image/png",
      extension: "png",
    });
  });

  it("rejects unsupported image types", () => {
    const file = new File(["image"], "cover.gif", { type: "image/gif" });

    expect(validateCoverImageFile(file)).toEqual({
      ok: false,
      message: "Cover images must be JPEG, PNG, or WebP files.",
    });
  });

  it("rejects files larger than 5 MB", () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "cover.jpg", {
      type: "image/jpeg",
    });

    expect(validateCoverImageFile(file)).toEqual({
      ok: false,
      message: "Cover images must be 5 MB or smaller.",
    });
  });
});

describe("cover image object keys", () => {
  it("creates organized group cover keys with safe random filenames", () => {
    expect(
      createCoverImageKey({
        target: "groups",
        id: 12,
        extension: ".jpg",
        now: 123456,
        randomBytesValue: Buffer.from("abcdef123456abcdef123456", "hex"),
      }),
    ).toBe("groups/12/cover-123456-abcdef123456abcdef123456.jpg");
  });

  it("creates organized event cover keys", () => {
    expect(
      createCoverImageKey({
        target: "events",
        id: 7,
        extension: "webp",
        now: 999,
        randomBytesValue: Buffer.from("000102030405060708090a0b", "hex"),
      }),
    ).toBe("events/7/cover-999-000102030405060708090a0b.webp");
  });
});
