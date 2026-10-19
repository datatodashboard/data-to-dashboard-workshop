CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`experience` text NOT NULL,
	`goal` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'payment_pending' NOT NULL,
	`order_id` text,
	`payment_id` text,
	`amount` integer DEFAULT 99900 NOT NULL,
	`created_at` text NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_order_id_unique` ON `leads` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `leads_payment_id_unique` ON `leads` (`payment_id`);