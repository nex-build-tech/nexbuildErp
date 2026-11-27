CREATE TABLE IF NOT EXISTS `categories` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`name` varchar(150) NOT NULL,
	`code` varchar(50) NOT NULL,
	`parent_id` bigint NULL DEFAULT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_cat_code_idx` UNIQUE(`tenant_id`,`code`)
);

CREATE TABLE IF NOT EXISTS `contractors` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact_person` varchar(150),
	`email` varchar(255),
	`phone` varchar(50),
	`trade` varchar(100),
	`pan` varchar(10),
	`address` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractors_id` PRIMARY KEY(`id`),
	CONSTRAINT `contractors_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_cont_code_idx` UNIQUE(`tenant_id`,`code`)
);

CREATE TABLE IF NOT EXISTS `document_series` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`document_type` varchar(20) NOT NULL,
	`prefix` varchar(20) NOT NULL,
	`financial_year` varchar(10) NOT NULL,
	`next_number` int NOT NULL DEFAULT 1,
	`padding` int NOT NULL DEFAULT 4,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_series_id` PRIMARY KEY(`id`),
	CONSTRAINT `document_series_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_doc_series_idx` UNIQUE(`tenant_id`,`document_type`,`financial_year`)
);

CREATE TABLE IF NOT EXISTS `units` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`name` varchar(50) NOT NULL,
	`code` varchar(20) NOT NULL,
	`symbol` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `units_id` PRIMARY KEY(`id`),
	CONSTRAINT `units_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_unit_code_idx` UNIQUE(`tenant_id`,`code`)
);

CREATE TABLE IF NOT EXISTS `items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`category_id` bigint NOT NULL,
	`unit_id` bigint NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`hsn_code` varchar(20),
	`gst_rate` varchar(10) NOT NULL DEFAULT '18',
	`default_rate` decimal(14,4) NOT NULL DEFAULT '0.0000',
	`reorder_level` decimal(14,3) DEFAULT '0.000',
	`brand` varchar(100),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp NULL DEFAULT NULL,
	CONSTRAINT `items_id` PRIMARY KEY(`id`),
	CONSTRAINT `items_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_item_code_idx` UNIQUE(`tenant_id`,`code`)
);

CREATE TABLE IF NOT EXISTS `sites` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`client_name` varchar(255),
	`address` text NOT NULL,
	`city` varchar(100) DEFAULT 'Mumbai',
	`state_code` varchar(2) DEFAULT '27',
	`pincode` varchar(10),
	`status` enum('planning','active','on_hold','completed') NOT NULL DEFAULT 'active',
	`start_date` timestamp NULL DEFAULT NULL,
	`target_date` timestamp NULL DEFAULT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp NULL DEFAULT NULL,
	CONSTRAINT `sites_id` PRIMARY KEY(`id`),
	CONSTRAINT `sites_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_site_code_idx` UNIQUE(`tenant_id`,`code`)
);

CREATE TABLE IF NOT EXISTS `vendors` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`contact_person` varchar(150),
	`email` varchar(255),
	`phone` varchar(50),
	`gstin` varchar(15),
	`pan` varchar(10),
	`state_code` varchar(2) NOT NULL DEFAULT '27',
	`address` text,
	`city` varchar(100),
	`pincode` varchar(10),
	`bank_name` varchar(150),
	`bank_account_no` varchar(50),
	`bank_ifsc` varchar(20),
	`payment_terms` varchar(100) DEFAULT '30 Days Credit',
	`rating` decimal(3,2) DEFAULT '5.00',
	`status` enum('active','inactive','blacklisted') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp NULL DEFAULT NULL,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`),
	CONSTRAINT `vendors_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_vendor_code_idx` UNIQUE(`tenant_id`,`code`)
);

CREATE TABLE IF NOT EXISTS `warehouses` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NULL DEFAULT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(150) NOT NULL,
	`address` text,
	`is_central` boolean NOT NULL DEFAULT false,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouses_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_wh_code_idx` UNIQUE(`tenant_id`,`code`)
);

CREATE INDEX `cat_tenant_idx` ON `categories` (`tenant_id`);
CREATE INDEX `cont_tenant_idx` ON `contractors` (`tenant_id`);
CREATE INDEX `item_tenant_idx` ON `items` (`tenant_id`);
CREATE INDEX `item_category_idx` ON `items` (`category_id`);
CREATE INDEX `site_tenant_idx` ON `sites` (`tenant_id`);
CREATE INDEX `unit_tenant_idx` ON `units` (`tenant_id`);
CREATE INDEX `vendor_tenant_idx` ON `vendors` (`tenant_id`);
CREATE INDEX `wh_tenant_idx` ON `warehouses` (`tenant_id`);
