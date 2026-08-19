CREATE TABLE `delivery_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`stripe_session_id` text NOT NULL,
	`customer_email` text NOT NULL,
	`product_key` text NOT NULL,
	`object_key` text NOT NULL,
	`download_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`download_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_delivery_orders_stripe_session` ON `delivery_orders` (`stripe_session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_delivery_orders_download_token` ON `delivery_orders` (`download_token`);