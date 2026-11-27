CREATE TABLE `measurement_sheets` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`ra_bill_id` bigint NOT NULL,
	`wo_item_id` bigint NOT NULL,
	`location_ref` varchar(100) NOT NULL,
	`description` text,
	`number_of_units` decimal(10,2) NOT NULL DEFAULT '1.00',
	`length` decimal(10,3),
	`breadth` decimal(10,3),
	`depth` decimal(10,3),
	`total_qty` decimal(12,3) NOT NULL,
	`rate` decimal(12,2) NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	CONSTRAINT `measurement_sheets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ra_bills` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`bill_number` varchar(50) NOT NULL,
	`ra_number` int NOT NULL,
	`wo_id` bigint NOT NULL,
	`contractor_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`bill_date` timestamp NOT NULL DEFAULT (now()),
	`period_start` timestamp NULL DEFAULT NULL,
	`period_end` timestamp NULL DEFAULT NULL,
	`gross_amount` decimal(14,2) NOT NULL,
	`retention_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`tds_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`material_deduction` decimal(14,2) NOT NULL DEFAULT '0.00',
	`other_deductions` decimal(14,2) NOT NULL DEFAULT '0.00',
	`net_payable` decimal(14,2) NOT NULL,
	`amount_in_words` text,
	`status` enum('draft','certified','approved','paid') NOT NULL DEFAULT 'certified',
	`certified_by_id` bigint,
	`approved_by_id` bigint,
	`remarks` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ra_bills_id` PRIMARY KEY(`id`),
	CONSTRAINT `ra_bills_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_ra_no_idx` UNIQUE(`tenant_id`,`bill_number`)
);
--> statement-breakpoint
CREATE TABLE `wo_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`wo_id` bigint NOT NULL,
	`item_code` varchar(50) NOT NULL,
	`description` text NOT NULL,
	`unit_code` varchar(20) NOT NULL,
	`estimated_qty` decimal(12,3) NOT NULL,
	`executed_qty` decimal(12,3) NOT NULL DEFAULT '0.000',
	`rate` decimal(12,2) NOT NULL,
	`total_amount` decimal(14,2) NOT NULL,
	CONSTRAINT `wo_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`wo_number` varchar(50) NOT NULL,
	`contractor_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`title` varchar(255) NOT NULL,
	`contract_type` enum('item_rate','lump_sum') NOT NULL DEFAULT 'item_rate',
	`start_date` timestamp NULL DEFAULT NULL,
	`completion_date` timestamp NULL DEFAULT NULL,
	`contract_value` decimal(14,2) NOT NULL,
	`retention_percent` decimal(5,2) NOT NULL DEFAULT '5.00',
	`tds_percent` decimal(5,2) NOT NULL DEFAULT '1.00',
	`status` enum('draft','active','completed','terminated') NOT NULL DEFAULT 'active',
	`scope_of_work` text,
	`terms` text,
	`created_by_id` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_orders_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_wo_no_idx` UNIQUE(`tenant_id`,`wo_number`)
);
--> statement-breakpoint
CREATE INDEX `mb_ra_bill_idx` ON `measurement_sheets` (`ra_bill_id`);--> statement-breakpoint
CREATE INDEX `ra_tenant_idx` ON `ra_bills` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `ra_wo_idx` ON `ra_bills` (`wo_id`);--> statement-breakpoint
CREATE INDEX `ra_contractor_idx` ON `ra_bills` (`contractor_id`);--> statement-breakpoint
CREATE INDEX `wo_item_idx` ON `wo_items` (`wo_id`);--> statement-breakpoint
CREATE INDEX `wo_tenant_idx` ON `work_orders` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `wo_contractor_idx` ON `work_orders` (`contractor_id`);--> statement-breakpoint
CREATE INDEX `wo_site_idx` ON `work_orders` (`site_id`);