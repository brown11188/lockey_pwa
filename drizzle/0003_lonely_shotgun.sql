CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`monthly_budget` real NOT NULL,
	`currency` text DEFAULT 'VND' NOT NULL,
	`is_recurring` integer DEFAULT true NOT NULL,
	`applied_from` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`logo_url` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'VND' NOT NULL,
	`cycle` text DEFAULT 'monthly' NOT NULL,
	`next_renewal_date` text NOT NULL,
	`category_id` text,
	`note` text DEFAULT '',
	`reminder_days_before` integer DEFAULT 3 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
