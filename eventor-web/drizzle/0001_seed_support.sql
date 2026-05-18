CREATE TYPE "public"."group_invite_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
ALTER TABLE "event_participants" ADD COLUMN "extra_slots" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "group_invites" ADD COLUMN "invited_user_id" integer;--> statement-breakpoint
ALTER TABLE "group_invites" ADD COLUMN "status" "group_invite_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "group_invites" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_invites" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_invites_invited_user_id_idx" ON "group_invites" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "group_invites_status_idx" ON "group_invites" USING btree ("status");