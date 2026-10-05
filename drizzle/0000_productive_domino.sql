CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`contribution_id` text,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`token` text NOT NULL,
	`public` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`contribution_id`) REFERENCES `contributions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_assets_contribution` ON `assets` (`contribution_id`);--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`reference` text NOT NULL,
	`cause` text NOT NULL,
	`offer` text NOT NULL,
	`quantity` integer NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`frequency` text NOT NULL,
	`method` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`locale` text NOT NULL,
	`details` text NOT NULL,
	`project_id` text,
	`access_hash` text NOT NULL,
	`demo` integer DEFAULT 1 NOT NULL,
	`stripe_session` text,
	`stripe_customer` text,
	`stripe_subscription` text,
	`reminder_count` integer DEFAULT 0 NOT NULL,
	`reminders_paused` integer DEFAULT 0 NOT NULL,
	`next_reminder` text,
	`created_at` text NOT NULL,
	`paid_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_contributions_request` ON `contributions` (`request_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_contributions_reference` ON `contributions` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_contributions_project` ON `contributions` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_contributions_subscription` ON `contributions` (`stripe_subscription`);--> statement-breakpoint
CREATE INDEX `idx_contributions_reminders` ON `contributions` (`status`,`method`,`next_reminder`);--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`dedupe` text NOT NULL,
	`contribution_id` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`html` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`provider_id` text,
	`error` text,
	`created_at` text NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`contribution_id`) REFERENCES `contributions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_emails_dedupe` ON `emails` (`dedupe`);--> statement-breakpoint
CREATE INDEX `idx_emails_status` ON `emails` (`status`);--> statement-breakpoint
CREATE INDEX `idx_emails_contribution` ON `emails` (`contribution_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`contribution_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`contribution_id`) REFERENCES `contributions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payments_contribution` ON `payments` (`contribution_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`title_ar` text DEFAULT '' NOT NULL,
	`location` text NOT NULL,
	`description` text NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`description_ar` text DEFAULT '' NOT NULL,
	`goal` integer NOT NULL,
	`stage` text DEFAULT 'planned' NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`cover` text,
	`updates` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_projects_published` ON `projects` (`published`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
