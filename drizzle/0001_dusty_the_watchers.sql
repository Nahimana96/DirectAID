CREATE TABLE `feedback_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`contribution_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`email_dedupe` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`contribution_id`) REFERENCES `contributions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`email_dedupe`) REFERENCES `emails`(`dedupe`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_feedback_invites_contribution` ON `feedback_invites` (`contribution_id`);--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`contribution_id` text NOT NULL,
	`invite_id` text NOT NULL,
	`comment` text NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`locale` text NOT NULL,
	`consent` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`moderated_at` text,
	FOREIGN KEY (`contribution_id`) REFERENCES `contributions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invite_id`) REFERENCES `feedback_invites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_testimonials_contribution` ON `testimonials` (`contribution_id`);--> statement-breakpoint
CREATE INDEX `idx_testimonials_status` ON `testimonials` (`status`,`consent`);