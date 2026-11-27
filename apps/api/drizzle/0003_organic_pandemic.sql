CREATE TABLE `goods_receipt_notes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`grn_number` varchar(50) NOT NULL,
	`po_id` bigint NOT NULL,
	`vendor_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`warehouse_id` bigint NOT NULL,
	`challan_no` varchar(50),
	`challan_date` timestamp NULL DEFAULT NULL,
	`invoice_no` varchar(50),
	`invoice_date` timestamp NULL DEFAULT NULL,
	`vehicle_no` varchar(50),
	`received_date` timestamp NOT NULL DEFAULT (now()),
	`status` enum('draft','inspected','verified','cancelled') NOT NULL DEFAULT 'verified',
	`gate_pass_no` varchar(50),
	`inspection_remarks` text,
	`received_by_id` bigint NOT NULL,
	`verified_by_id` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goods_receipt_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `goods_receipt_notes_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_grn_no_idx` UNIQUE(`tenant_id`,`grn_number`)
);
--> statement-breakpoint
CREATE TABLE `grn_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`grn_id` bigint NOT NULL,
	`po_item_id` bigint NOT NULL,
	`item_id` bigint NOT NULL,
	`ordered_qty` decimal(12,3) NOT NULL,
	`received_qty` decimal(12,3) NOT NULL,
	`accepted_qty` decimal(12,3) NOT NULL,
	`rejected_qty` decimal(12,3) NOT NULL DEFAULT '0.000',
	`unit_id` bigint NOT NULL,
	`unit_rate` decimal(12,2) NOT NULL,
	`total_value` decimal(14,2) NOT NULL,
	`rejection_reason` text,
	`batch_no` varchar(50),
	CONSTRAINT `grn_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_issue_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`issue_id` bigint NOT NULL,
	`item_id` bigint NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`unit_id` bigint NOT NULL,
	`unit_rate` decimal(12,2) NOT NULL,
	`total_value` decimal(14,2) NOT NULL,
	`remarks` text,
	CONSTRAINT `material_issue_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_issues` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`issue_number` varchar(50) NOT NULL,
	`site_id` bigint NOT NULL,
	`warehouse_id` bigint NOT NULL,
	`contractor_id` bigint,
	`issued_to_name` varchar(100) NOT NULL,
	`purpose` text NOT NULL,
	`issue_date` timestamp NOT NULL DEFAULT (now()),
	`status` enum('issued','cancelled') NOT NULL DEFAULT 'issued',
	`total_value` decimal(14,2) NOT NULL DEFAULT '0.00',
	`issued_by_id` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `material_issues_id` PRIMARY KEY(`id`),
	CONSTRAINT `material_issues_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_issue_no_idx` UNIQUE(`tenant_id`,`issue_number`)
);
--> statement-breakpoint
CREATE TABLE `stock_balances` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`warehouse_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`item_id` bigint NOT NULL,
	`quantity` decimal(12,3) NOT NULL DEFAULT '0.000',
	`weighted_avg_rate` decimal(12,2) NOT NULL DEFAULT '0.00',
	`total_value` decimal(14,2) NOT NULL DEFAULT '0.00',
	`last_movement_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `wh_item_unique_idx` UNIQUE(`warehouse_id`,`item_id`)
);
--> statement-breakpoint
CREATE TABLE `stock_ledger` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`warehouse_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`item_id` bigint NOT NULL,
	`movement_type` enum('grn_inward','site_issue','transfer_out','transfer_in','return_in','scrap_out','stock_adjust') NOT NULL,
	`reference_type` varchar(50) NOT NULL,
	`reference_id` bigint NOT NULL,
	`reference_number` varchar(50) NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`balance_after` decimal(12,3) NOT NULL,
	`unit_rate` decimal(12,2) NOT NULL,
	`total_value` decimal(14,2) NOT NULL,
	`performed_by_id` bigint NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `grn_tenant_idx` ON `goods_receipt_notes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `grn_po_idx` ON `goods_receipt_notes` (`po_id`);--> statement-breakpoint
CREATE INDEX `grn_site_idx` ON `goods_receipt_notes` (`site_id`);--> statement-breakpoint
CREATE INDEX `grn_item_idx` ON `grn_items` (`grn_id`);--> statement-breakpoint
CREATE INDEX `issue_item_idx` ON `material_issue_items` (`issue_id`);--> statement-breakpoint
CREATE INDEX `issue_tenant_idx` ON `material_issues` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `issue_site_idx` ON `material_issues` (`site_id`);--> statement-breakpoint
CREATE INDEX `stock_tenant_idx` ON `stock_balances` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `ledger_tenant_idx` ON `stock_ledger` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `ledger_wh_item_idx` ON `stock_ledger` (`warehouse_id`,`item_id`);--> statement-breakpoint
CREATE INDEX `ledger_ref_idx` ON `stock_ledger` (`reference_type`,`reference_id`);