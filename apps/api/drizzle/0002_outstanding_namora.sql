CREATE TABLE `indent_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`indent_id` bigint NOT NULL,
	`item_id` bigint NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`unit_id` bigint NOT NULL,
	`estimated_rate` decimal(12,2),
	`estimated_amount` decimal(14,2),
	`required_date` timestamp NULL DEFAULT NULL,
	`remarks` text,
	CONSTRAINT `indent_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_indents` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`indent_number` varchar(50) NOT NULL,
	`site_id` bigint NOT NULL,
	`requested_by_id` bigint NOT NULL,
	`required_date` timestamp NULL DEFAULT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('draft','submitted','approved','rejected','cancelled','po_created') NOT NULL DEFAULT 'draft',
	`purpose` text,
	`remarks` text,
	`approved_by_id` bigint,
	`approved_at` timestamp NULL DEFAULT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `material_indents_id` PRIMARY KEY(`id`),
	CONSTRAINT `material_indents_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_indent_no_idx` UNIQUE(`tenant_id`,`indent_number`)
);
--> statement-breakpoint
CREATE TABLE `po_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`po_id` bigint NOT NULL,
	`item_id` bigint NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`unit_id` bigint NOT NULL,
	`unit_rate` decimal(12,2) NOT NULL,
	`discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
	`taxable_amount` decimal(14,2) NOT NULL,
	`gst_rate` varchar(10) NOT NULL,
	`cgst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`sgst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`igst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`total_amount` decimal(14,2) NOT NULL,
	`received_quantity` decimal(12,3) NOT NULL DEFAULT '0.000',
	`remarks` text,
	CONSTRAINT `po_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`po_number` varchar(50) NOT NULL,
	`indent_id` bigint,
	`rfq_id` bigint,
	`quotation_id` bigint,
	`vendor_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`warehouse_id` bigint,
	`po_date` timestamp NOT NULL DEFAULT (now()),
	`delivery_date` timestamp NULL DEFAULT NULL,
	`payment_terms` varchar(255),
	`status` enum('draft','pending_approval','approved','issued','partially_received','completed','cancelled') NOT NULL DEFAULT 'draft',
	`is_inter_state` boolean NOT NULL DEFAULT false,
	`subtotal` decimal(14,2) NOT NULL,
	`discount_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`taxable_amount` decimal(14,2) NOT NULL,
	`cgst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`sgst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`igst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`round_off` decimal(6,2) NOT NULL DEFAULT '0.00',
	`total_amount` decimal(14,2) NOT NULL,
	`amount_in_words` text,
	`billing_address` text,
	`shipping_address` text,
	`terms_and_conditions` text,
	`idempotency_key` varchar(100),
	`created_by_id` bigint NOT NULL,
	`approved_by_id` bigint,
	`approved_at` timestamp NULL DEFAULT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchase_orders_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_po_no_idx` UNIQUE(`tenant_id`,`po_number`)
);
--> statement-breakpoint
CREATE TABLE `rfq_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`rfq_id` bigint NOT NULL,
	`item_id` bigint NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`unit_id` bigint NOT NULL,
	`target_rate` decimal(12,2),
	CONSTRAINT `rfq_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfq_quotation_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`quotation_id` bigint NOT NULL,
	`item_id` bigint NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`unit_rate` decimal(12,2) NOT NULL,
	`discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
	`taxable_amount` decimal(14,2) NOT NULL,
	`gst_rate` varchar(10) NOT NULL,
	`cgst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`sgst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`igst_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`total_amount` decimal(14,2) NOT NULL,
	CONSTRAINT `rfq_quotation_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rfq_quotations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`rfq_id` bigint NOT NULL,
	`vendor_id` bigint NOT NULL,
	`quotation_ref` varchar(100),
	`quotation_date` timestamp NULL DEFAULT NULL,
	`subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
	`tax_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`total_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
	`payment_terms` varchar(255),
	`delivery_lead_time_days` int,
	`is_lowest` boolean NOT NULL DEFAULT false,
	`is_awarded` boolean NOT NULL DEFAULT false,
	`status` enum('received','accepted','rejected') NOT NULL DEFAULT 'received',
	`remarks` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rfq_quotations_id` PRIMARY KEY(`id`),
	CONSTRAINT `rfq_quotations_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `rfqs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`rfq_number` varchar(50) NOT NULL,
	`indent_id` bigint,
	`site_id` bigint NOT NULL,
	`title` varchar(255) NOT NULL,
	`deadline_date` timestamp NULL DEFAULT NULL,
	`status` enum('draft','sent','quotations_received','evaluated','po_created','closed') NOT NULL DEFAULT 'draft',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rfqs_id` PRIMARY KEY(`id`),
	CONSTRAINT `rfqs_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_rfq_no_idx` UNIQUE(`tenant_id`,`rfq_number`)
);
--> statement-breakpoint
CREATE INDEX `ind_item_idx` ON `indent_items` (`indent_id`);--> statement-breakpoint
CREATE INDEX `ind_tenant_idx` ON `material_indents` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `ind_site_idx` ON `material_indents` (`site_id`);--> statement-breakpoint
CREATE INDEX `po_item_idx` ON `po_items` (`po_id`);--> statement-breakpoint
CREATE INDEX `po_tenant_idx` ON `purchase_orders` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `po_vendor_idx` ON `purchase_orders` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `po_site_idx` ON `purchase_orders` (`site_id`);--> statement-breakpoint
CREATE INDEX `rfq_item_idx` ON `rfq_items` (`rfq_id`);--> statement-breakpoint
CREATE INDEX `quote_item_idx` ON `rfq_quotation_items` (`quotation_id`);--> statement-breakpoint
CREATE INDEX `rfq_quote_idx` ON `rfq_quotations` (`rfq_id`);--> statement-breakpoint
CREATE INDEX `rfq_quote_vendor_idx` ON `rfq_quotations` (`vendor_id`);--> statement-breakpoint
CREATE INDEX `rfq_tenant_idx` ON `rfqs` (`tenant_id`);