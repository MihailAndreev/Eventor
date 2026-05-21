import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./jwt";

describe("session JWT helpers", () => {
  it("signs and verifies a session payload", async () => {
    const payload = {
      userId: 7,
      email: "ada@example.com",
      name: "Ada Lovelace",
      role: "user" as const,
    };

    const token = await signSessionToken(payload);

    await expect(verifySessionToken(token)).resolves.toEqual(payload);
  });

  it("returns null for invalid tokens", async () => {
    await expect(verifySessionToken("not-a-token")).resolves.toBeNull();
  });
});
