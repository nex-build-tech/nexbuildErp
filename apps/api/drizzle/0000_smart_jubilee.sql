DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `user_sites`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `tenants`;

CREATE TABLE `tenants` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`status` enum('trial','active','suspended','cancelled') NOT NULL DEFAULT 'active',
	`plan` varchar(50) NOT NULL DEFAULT 'enterprise',
	`gstin` varchar(15),
	`pan` varchar(10),
	`state_code` varchar(2) DEFAULT '27',
	`address` text,
	`logo_url` text,
	`primary_color` varchar(20) DEFAULT '#c5a04e',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp NULL DEFAULT NULL,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE `roles` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NULL DEFAULT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`is_system` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_role_code_idx` UNIQUE(`tenant_id`,`code`)
);

CREATE TABLE `permissions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`module` varchar(50) NOT NULL,
	`action` varchar(50) NOT NULL,
	`description` text,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_code_unique` UNIQUE(`code`)
);

CREATE TABLE `role_permissions` (
	`role_id` bigint NOT NULL,
	`permission_id` bigint NOT NULL,
	CONSTRAINT `role_permissions_role_id_permission_id_pk` PRIMARY KEY(`role_id`,`permission_id`)
);

CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NULL DEFAULT NULL,
	`role_id` bigint NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(50) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`full_name` varchar(150) NOT NULL,
	`phone` varchar(20),
	`status` enum('active','inactive','locked') NOT NULL DEFAULT 'active',
	`avatar_url` text,
	`failed_login_attempts` int NOT NULL DEFAULT 0,
	`locked_until` timestamp NULL DEFAULT NULL,
	`last_login_at` timestamp NULL DEFAULT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp NULL DEFAULT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `tenant_username_idx` UNIQUE(`tenant_id`,`username`),
	CONSTRAINT `tenant_email_idx` UNIQUE(`tenant_id`,`email`)
);

CREATE TABLE `user_sites` (
	`user_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	CONSTRAINT `user_sites_user_id_site_id_pk` PRIMARY KEY(`user_id`,`site_id`)
);

CREATE TABLE `refresh_tokens` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp NULL DEFAULT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);

CREATE TABLE `audit_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NULL DEFAULT NULL,
	`user_id` bigint NULL DEFAULT NULL,
	`action` varchar(100) NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entity_id` varchar(100),
	`diff_json` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);

CREATE INDEX `audit_tenant_idx` ON `audit_logs` (`tenant_id`);
CREATE INDEX `audit_user_idx` ON `audit_logs` (`user_id`);
CREATE INDEX `refresh_user_idx` ON `refresh_tokens` (`user_id`);
CREATE INDEX `role_tenant_idx` ON `roles` (`tenant_id`);
CREATE INDEX `user_tenant_idx` ON `users` (`tenant_id`);
