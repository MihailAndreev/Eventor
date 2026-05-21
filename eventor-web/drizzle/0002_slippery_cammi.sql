CREATE TABLE "event_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"url" text NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cover_image_key" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "cover_image_key" text;--> statement-breakpoint
ALTER TABLE "event_links" ADD CONSTRAINT "event_links_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_links" ADD CONSTRAINT "event_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_links_event_id_idx" ON "event_links" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_links_created_by_user_id_idx" ON "event_links" USING btree ("created_by_user_id");