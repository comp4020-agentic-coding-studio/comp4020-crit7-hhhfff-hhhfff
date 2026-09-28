CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`space_id` integer NOT NULL,
	`date` text NOT NULL,
	`hour` integer NOT NULL,
	`uid` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bookings_uid_date_idx` ON `bookings` (`uid`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_slot_unique` ON `bookings` (`space_id`,`date`,`hour`);--> statement-breakpoint
CREATE TABLE `spaces` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`library` text NOT NULL,
	`kind` text NOT NULL,
	`capacity` integer NOT NULL,
	`features` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `spaces_slug_unique` ON `spaces` (`slug`);