CREATE TYPE "public"."event_participant_status" AS ENUM('going', 'interested', 'not_going', 'waiting_list');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('group_invite', 'event_created', 'event_updated', 'event_canceled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "event_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"group_id" integer,
	"event_id" integer,
	"type" "notification_type" NOT NULL,
	"text" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" "event_participant_status" DEFAULT 'going' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"event_date" date NOT NULL,
	"event_time" time NOT NULL,
	"location" text,
	"capacity" integer,
	"canceled" boolean DEFAULT false NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"invite_token" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_manager" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(160) NOT NULL,
	"photo_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_notifications" ADD CONSTRAINT "event_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_notifications" ADD CONSTRAINT "event_notifications_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_notifications" ADD CONSTRAINT "event_notifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_comments_event_id_created_at_idx" ON "event_comments" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "event_comments_user_id_idx" ON "event_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_notifications_user_id_read_created_at_idx" ON "event_notifications" USING btree ("user_id","read","created_at");--> statement-breakpoint
CREATE INDEX "event_notifications_group_id_idx" ON "event_notifications" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "event_notifications_event_id_idx" ON "event_notifications" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_participants_event_id_user_id_idx" ON "event_participants" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "event_participants_user_id_idx" ON "event_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_participants_event_id_status_idx" ON "event_participants" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "events_group_id_event_date_event_time_idx" ON "events" USING btree ("group_id","event_date","event_time");--> statement-breakpoint
CREATE INDEX "events_created_by_user_id_idx" ON "events" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "events_canceled_idx" ON "events" USING btree ("canceled");--> statement-breakpoint
CREATE UNIQUE INDEX "group_invites_invite_token_idx" ON "group_invites" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "group_invites_group_id_idx" ON "group_invites" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_invites_created_by_user_id_idx" ON "group_invites" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "group_invites_is_active_expires_at_idx" ON "group_invites" USING btree ("is_active","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_group_id_user_id_idx" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "group_members_user_id_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "group_members_group_id_is_manager_idx" ON "group_members" USING btree ("group_id","is_manager");--> statement-breakpoint
CREATE INDEX "groups_created_by_user_id_idx" ON "groups" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");