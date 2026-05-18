import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Application-level roles. Regular users can create groups; admins can manage the whole app.
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// Event attendance choices shown to members.
export const eventParticipantStatusEnum = pgEnum("event_participant_status", [
  "going",
  "interested",
  "not_going",
  "waiting_list",
]);

// Notification categories used by the in-app notification feed.
export const notificationTypeEnum = pgEnum("notification_type", [
  "group_invite",
  "event_created",
  "event_updated",
  "event_canceled",
]);

export const groupInviteStatusEnum = pgEnum("group_invite_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    photoUrl: text("photo_url"),
    role: userRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("groups_created_by_user_id_idx").on(table.createdByUserId)],
);

export const groupMembers = pgTable(
  "group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isManager: boolean("is_manager").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("group_members_group_id_user_id_idx").on(table.groupId, table.userId),
    index("group_members_user_id_idx").on(table.userId),
    index("group_members_group_id_is_manager_idx").on(table.groupId, table.isManager),
  ],
);

export const groupInvites = pgTable(
  "group_invites",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id),
    invitedUserId: integer("invited_user_id").references(() => users.id, { onDelete: "set null" }),
    inviteToken: varchar("invite_token", { length: 255 }).notNull(),
    status: groupInviteStatusEnum("status").notNull().default("pending"),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("group_invites_invite_token_idx").on(table.inviteToken),
    index("group_invites_group_id_idx").on(table.groupId),
    index("group_invites_created_by_user_id_idx").on(table.createdByUserId),
    index("group_invites_invited_user_id_idx").on(table.invitedUserId),
    index("group_invites_status_idx").on(table.status),
    index("group_invites_is_active_expires_at_idx").on(table.isActive, table.expiresAt),
  ],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    eventDate: date("event_date").notNull(),
    eventTime: time("event_time").notNull(),
    location: text("location"),
    capacity: integer("capacity"),
    canceled: boolean("canceled").notNull().default(false),
    createdByUserId: integer("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("events_group_id_event_date_event_time_idx").on(table.groupId, table.eventDate, table.eventTime),
    index("events_created_by_user_id_idx").on(table.createdByUserId),
    index("events_canceled_idx").on(table.canceled),
  ],
);

export const eventParticipants = pgTable(
  "event_participants",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: eventParticipantStatusEnum("status").notNull().default("going"),
    extraSlots: integer("extra_slots").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("event_participants_event_id_user_id_idx").on(table.eventId, table.userId),
    index("event_participants_user_id_idx").on(table.userId),
    index("event_participants_event_id_status_idx").on(table.eventId, table.status),
  ],
);

export const eventComments = pgTable(
  "event_comments",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("event_comments_event_id_created_at_idx").on(table.eventId, table.createdAt),
    index("event_comments_user_id_idx").on(table.userId),
  ],
);

export const eventNotifications = pgTable(
  "event_notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: integer("group_id").references(() => groups.id, { onDelete: "cascade" }),
    eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    text: text("text").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("event_notifications_user_id_read_created_at_idx").on(table.userId, table.read, table.createdAt),
    index("event_notifications_group_id_idx").on(table.groupId),
    index("event_notifications_event_id_idx").on(table.eventId),
  ],
);
