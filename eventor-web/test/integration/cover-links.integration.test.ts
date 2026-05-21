import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

const storageCalls = vi.hoisted(() => ({
  uploads: [] as Array<{ key: string; contentType: string }>,
  deletes: [] as string[],
}));

vi.mock("@/lib/storage/r2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage/r2")>();

  return {
    ...actual,
    uploadPublicImage: vi.fn(
      async (input: { key: string; contentType: string }) => {
        storageCalls.uploads.push({
          key: input.key,
          contentType: input.contentType,
        });

        return {
          key: input.key,
          url: `https://cdn.test/${input.key}`,
        };
      },
    ),
    deleteImageObject: vi.fn(async (key: string | null | undefined) => {
      if (key) {
        storageCalls.deletes.push(key);
      }
    }),
  };
});

import { eventLinks, events, groups } from "@/db/schema";
import {
  createEventLink,
  updateEventCoverImage,
} from "@/services/events";
import { updateGroupCoverImage } from "@/services/groups";
import {
  getIntegrationDb,
  resetAndSeedTestDb,
  type IntegrationSeed,
} from "./helpers/db";

describe("Cover images and event links integration flows", () => {
  let seed: IntegrationSeed;

  beforeEach(async () => {
    storageCalls.uploads = [];
    storageCalls.deletes = [];
    seed = await resetAndSeedTestDb();
  });

  it("lets managers update group cover images", async () => {
    const result = await updateGroupCoverImage(
      seed.users.manager.id,
      seed.groups.primary.id,
      new File(["image"], "cover.png", { type: "image/png" }),
    );

    expect(result).toMatchObject({
      ok: true,
      message: "Group cover image updated.",
      groupId: seed.groups.primary.id,
    });

    const [group] = await getIntegrationDb()
      .select({
        coverImageUrl: groups.coverImageUrl,
        coverImageKey: groups.coverImageKey,
      })
      .from(groups)
      .where(eq(groups.id, seed.groups.primary.id));

    expect(group.coverImageKey).toMatch(
      new RegExp(`^groups/${seed.groups.primary.id}/cover-\\d+-[a-f0-9]+\\.png$`),
    );
    expect(group.coverImageUrl).toBe(`https://cdn.test/${group.coverImageKey}`);
    expect(storageCalls.uploads).toHaveLength(1);
  });

  it("prevents regular members from updating group cover images", async () => {
    const result = await updateGroupCoverImage(
      seed.users.member.id,
      seed.groups.primary.id,
      new File(["image"], "cover.png", { type: "image/png" }),
    );

    expect(result).toEqual({
      ok: false,
      message: "Only group managers can change this group.",
    });
    expect(storageCalls.uploads).toHaveLength(0);
  });

  it("lets managers update event cover images", async () => {
    const result = await updateEventCoverImage(
      seed.users.manager.id,
      seed.events.active.id,
      new File(["image"], "cover.webp", { type: "image/webp" }),
    );

    expect(result).toEqual({
      ok: true,
      message: "Event cover image updated.",
    });

    const [event] = await getIntegrationDb()
      .select({
        coverImageUrl: events.coverImageUrl,
        coverImageKey: events.coverImageKey,
      })
      .from(events)
      .where(eq(events.id, seed.events.active.id));

    expect(event.coverImageKey).toMatch(
      new RegExp(`^events/${seed.events.active.id}/cover-\\d+-[a-f0-9]+\\.webp$`),
    );
    expect(event.coverImageUrl).toBe(`https://cdn.test/${event.coverImageKey}`);
  });

  it("lets managers add event links", async () => {
    const result = await createEventLink(seed.users.manager.id, seed.events.active.id, {
      title: "Trail map",
      url: "https://example.com/trail",
    });

    expect(result).toEqual({ ok: true, message: "Event link added." });

    const links = await getIntegrationDb()
      .select({ title: eventLinks.title, url: eventLinks.url })
      .from(eventLinks)
      .where(eq(eventLinks.eventId, seed.events.active.id));

    expect(links).toEqual([
      { title: "Trail map", url: "https://example.com/trail" },
    ]);
  });

  it("prevents regular members from adding event links", async () => {
    const result = await createEventLink(seed.users.member.id, seed.events.active.id, {
      title: "Trail map",
      url: "https://example.com/trail",
    });

    expect(result).toEqual({
      ok: false,
      message: "Only event organizers and group managers can change this event.",
    });
  });

  it("rejects invalid event link URLs", async () => {
    const result = await createEventLink(seed.users.manager.id, seed.events.active.id, {
      title: "Bad",
      url: "ftp://example.com/file",
    });

    expect(result).toEqual({
      ok: false,
      message: "Enter a valid http or https URL.",
    });
  });
});
