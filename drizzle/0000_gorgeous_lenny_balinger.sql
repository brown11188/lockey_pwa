CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`photo_uri` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'VND' NOT NULL,
	`category` text NOT NULL,
	`note` text DEFAULT '',
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
