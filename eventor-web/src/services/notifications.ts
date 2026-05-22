import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventNotifications } from "@/db/schema";

export type UserNotification = {
  id: number;
  type: string;
  text: string;
  read: boolean;
  createdAt: Date;
  groupId: number | null;
  eventId: number | null;
};

export type NotificationsPageResult = {
  notifications: UserNotification[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type NotificationMutationResult =
  | { ok: true; message: string }
  | { ok: false; reason: "not_found" };

export async function getUserNotificationsPage(
  userId: number,
  input: { page?: number; pageSize?: number } = {},
): Promise<NotificationsPageResult> {
  const page = normalizePositiveInteger(input.page, 1);
  const pageSize = Math.min(normalizePositiveInteger(input.pageSize, 20), 50);
  const offset = (page - 1) * pageSize;

  const [[totalRow], notifications] = await Promise.all([
    db
      .select({ total: count() })
      .from(eventNotifications)
      .where(eq(eventNotifications.userId, userId)),
    db
      .select({
        id: eventNotifications.id,
        type: eventNotifications.type,
        text: eventNotifications.text,
        read: eventNotifications.read,
        createdAt: eventNotifications.createdAt,
        groupId: eventNotifications.groupId,
        eventId: eventNotifications.eventId,
      })
      .from(eventNotifications)
      .where(eq(eventNotifications.userId, userId))
      .orderBy(desc(eventNotifications.createdAt), desc(eventNotifications.id))
      .limit(pageSize)
      .offset(offset),
  ]);
  const total = totalRow?.total ?? 0;

  return {
    notifications,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function markNotificationRead(
  userId: number,
  notificationId: number,
): Promise<NotificationMutationResult> {
  const [updatedNotification] = await db
    .update(eventNotifications)
    .set({ read: true })
    .where(
      and(
        eq(eventNotifications.id, notificationId),
        eq(eventNotifications.userId, userId),
      ),
    )
    .returning({ id: eventNotifications.id });

  if (!updatedNotification) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, message: "Notification marked as read." };
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}
