-- Safe additive migration for Affan's tasks:
-- 1. Profile completion tracking on users
-- 2. Missing geofence columns on sites (coordinates remain NULL / unconfigured)
-- 3. Staff attendance logs table for geofenced + watermarked photo check-ins

ALTER TABLE `users`
  ADD COLUMN `profile_completed` boolean NOT NULL DEFAULT false,
  ADD COLUMN `profile_completed_at` timestamp NULL;
--> statement-breakpoint
UPDATE `users`
SET
  `profile_completed` = true,
  `profile_completed_at` = COALESCE(`profile_completed_at`, NOW())
WHERE `deleted_at` IS NULL
  AND `full_name` IS NOT NULL AND TRIM(`full_name`) <> ''
  AND `email` IS NOT NULL AND TRIM(`email`) <> ''
  AND `phone` IS NOT NULL AND TRIM(`phone`) <> '';
--> statement-breakpoint
ALTER TABLE `sites`
  ADD COLUMN `latitude` decimal(10,7) NULL,
  ADD COLUMN `longitude` decimal(10,7) NULL,
  ADD COLUMN `geofence_radius` int NOT NULL DEFAULT 200;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `staff_attendance_logs` (
  `id` bigint AUTO_INCREMENT NOT NULL,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `site_id` bigint NOT NULL,
  `punch_type` enum('check_in','check_out') NOT NULL DEFAULT 'check_in',
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `distance_meters` decimal(10,2) NOT NULL,
  `geofence_radius_meters` int NOT NULL,
  `geofence_verified` boolean NOT NULL DEFAULT true,
  `photo_url` varchar(500) NOT NULL,
  `remarks` varchar(500) NULL,
  `punched_at` timestamp NOT NULL DEFAULT (now()),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `staff_attendance_logs_id` PRIMARY KEY(`id`),
  CONSTRAINT `staff_attendance_logs_uuid_unique` UNIQUE(`uuid`),
  INDEX `staff_att_tenant_user_idx` (`tenant_id`, `user_id`, `punched_at`),
  INDEX `staff_att_tenant_site_idx` (`tenant_id`, `site_id`, `punched_at`)
);
