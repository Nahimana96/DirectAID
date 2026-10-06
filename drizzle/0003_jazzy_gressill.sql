CREATE TABLE `access_links` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`purpose` text NOT NULL,
	`user_id` text,
	`password_version` integer,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `backup_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`asset_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `content_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `donor_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `contributions` ADD `campaign_id` text REFERENCES content_entries(id);