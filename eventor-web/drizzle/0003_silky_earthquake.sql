CREATE INDEX "event_comments_created_at_idx" ON "event_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_event_date_event_time_idx" ON "events" USING btree ("event_date","event_time");--> statement-breakpoint
CREATE INDEX "groups_title_idx" ON "groups" USING btree ("title");