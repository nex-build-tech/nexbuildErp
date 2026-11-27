CREATE TABLE `boq_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`item_code` varchar(64) NOT NULL,
	`description` varchar(255) NOT NULL,
	`work_package` varchar(128) NOT NULL,
	`budgeted_qty` decimal(12,3) NOT NULL,
	`uom` varchar(32) NOT NULL,
	`budgeted_rate` decimal(12,2) NOT NULL,
	`budgeted_amount` decimal(14,2) NOT NULL,
	`tolerance_percent` decimal(5,2) NOT NULL DEFAULT '5.00',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boq_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `boq_items_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `boq_tenant_site_item_pkg_idx` UNIQUE(`tenant_id`,`site_id`,`item_code`,`work_package`)
);
--> statement-breakpoint
CREATE TABLE `daily_progress_reports` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`report_number` varchar(64) NOT NULL,
	`report_date` timestamp NOT NULL,
	`weather` varchar(64) NOT NULL DEFAULT 'Clear / Sunny',
	`temperature` varchar(32) DEFAULT '32°C',
	`shift` varchar(32) NOT NULL DEFAULT 'Day',
	`general_progress` text,
	`delays_issues` text,
	`safety_notes` text,
	`status` varchar(32) NOT NULL DEFAULT 'draft',
	`created_by_id` bigint NOT NULL,
	`approved_by_id` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_progress_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_progress_reports_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `dpr_tenant_num_idx` UNIQUE(`tenant_id`,`report_number`)
);
--> statement-breakpoint
CREATE TABLE `dpr_equipments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`dpr_id` bigint NOT NULL,
	`equipment_name` varchar(128) NOT NULL,
	`running_hours` decimal(6,2) NOT NULL DEFAULT '0.00',
	`idle_hours` decimal(6,2) NOT NULL DEFAULT '0.00',
	`breakdown_hours` decimal(6,2) NOT NULL DEFAULT '0.00',
	`status` varchar(32) NOT NULL DEFAULT 'working',
	`remarks` varchar(255),
	CONSTRAINT `dpr_equipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dpr_photos` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`dpr_id` bigint NOT NULL,
	`photo_url` text NOT NULL,
	`caption` varchar(255),
	`activity_tag` varchar(128),
	`taken_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dpr_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dpr_work_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`dpr_id` bigint NOT NULL,
	`activity_name` varchar(255) NOT NULL,
	`location_ref` varchar(255) NOT NULL,
	`uom` varchar(32) NOT NULL DEFAULT 'SQ.M',
	`planned_qty` decimal(12,3) NOT NULL DEFAULT '0.000',
	`completed_qty` decimal(12,3) NOT NULL DEFAULT '0.000',
	`remarks` text,
	CONSTRAINT `dpr_work_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labour_attendance` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`contractor_id` bigint,
	`attendance_date` timestamp NOT NULL,
	`shift` varchar(32) NOT NULL DEFAULT 'Day',
	`trade_category` varchar(64) NOT NULL DEFAULT 'General Civil',
	`skilled_male` int NOT NULL DEFAULT 0,
	`skilled_female` int NOT NULL DEFAULT 0,
	`semi_skilled_male` int NOT NULL DEFAULT 0,
	`semi_skilled_female` int NOT NULL DEFAULT 0,
	`unskilled_male` int NOT NULL DEFAULT 0,
	`unskilled_female` int NOT NULL DEFAULT 0,
	`supervisors` int NOT NULL DEFAULT 0,
	`total_workers` int NOT NULL DEFAULT 0,
	`overtime_hours` decimal(6,2) NOT NULL DEFAULT '0.00',
	`work_location` varchar(255),
	`remarks` text,
	`recorded_by_id` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labour_attendance_id` PRIMARY KEY(`id`),
	CONSTRAINT `labour_attendance_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`user_id` bigint,
	`role_code` varchar(50),
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`channel` varchar(50) NOT NULL DEFAULT 'IN_APP',
	`is_read` boolean NOT NULL DEFAULT false,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_approvals` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`entity` varchar(50) NOT NULL,
	`entity_id` bigint NOT NULL,
	`level` int NOT NULL,
	`approver_role` varchar(50) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`remarks` text,
	`acted_by` bigint,
	`acted_at` timestamp,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_approvals_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_booking_applicants` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`type` enum('primary','co1','co2','co3') NOT NULL,
	`title` varchar(10),
	`first_name` varchar(100) NOT NULL,
	`middle_name` varchar(100),
	`last_name` varchar(100) NOT NULL,
	`dob` timestamp,
	`gender` enum('male','female','other'),
	`occupation` varchar(100),
	`pan` varchar(10),
	`aadhaar_enc` varchar(500),
	`mobile` varchar(20),
	`email` varchar(255),
	`permanent_address` text,
	`correspondence_address` text,
	`same_address` boolean NOT NULL DEFAULT false,
	`city` varchar(100),
	`state_code` varchar(2),
	`pincode` varchar(10),
	`relation` varchar(50),
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `re_booking_applicants_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_booking_applicants_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_booking_charges` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`booking_id` bigint NOT NULL,
	`charge_head_id` bigint NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`gst_amt` decimal(15,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `re_booking_charges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_booking_documents` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`type` enum('pan','aadhaar','photo','agreement','registration','allotment','other') NOT NULL,
	`file_url` text NOT NULL,
	`is_private` boolean NOT NULL DEFAULT true,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `re_booking_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_booking_parkings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`booking_id` bigint NOT NULL,
	`slot_id` bigint NOT NULL,
	`price` decimal(15,2) NOT NULL,
	CONSTRAINT `re_booking_parkings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_bookings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_no` varchar(50) NOT NULL,
	`unit_id` bigint NOT NULL,
	`lead_id` bigint,
	`cp_id` bigint,
	`scheme_id` bigint,
	`booking_date` timestamp NOT NULL,
	`area_basis` enum('carpet','saleable','builtup') NOT NULL DEFAULT 'carpet',
	`sold_rate` decimal(15,2),
	`basic_cost` decimal(15,2),
	`floor_rise_amt` decimal(15,2),
	`plc_amt` decimal(15,2),
	`discount_pct` decimal(7,4),
	`discount_amt` decimal(15,2),
	`net_cost` decimal(15,2),
	`agreement_value` decimal(15,2),
	`gst_pct` decimal(7,4),
	`gst_amt` decimal(15,2),
	`stamp_duty` decimal(15,2),
	`registration_fee` decimal(15,2),
	`stamp_by_builder` boolean NOT NULL DEFAULT false,
	`reg_by_builder` boolean NOT NULL DEFAULT false,
	`other_charges_total` decimal(15,2),
	`grand_total_incl_gst` decimal(15,2),
	`grand_total_excl_gst` decimal(15,2),
	`status` enum('draft','pending_approval','booked','agreement_done','registered','possession','cancelled','transferred') NOT NULL DEFAULT 'draft',
	`agreement_date` timestamp,
	`registration_date` timestamp,
	`registration_no` varchar(50),
	`loan_bank` varchar(150),
	`loan_amount` decimal(15,2),
	`possession_date` timestamp,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_bookings_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_bookings_tenant_bookingno_idx` UNIQUE(`tenant_id`,`booking_no`)
);
--> statement-breakpoint
CREATE TABLE `re_brokerage_entries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`cp_id` bigint NOT NULL,
	`base` decimal(15,2) NOT NULL,
	`pct` decimal(7,4) NOT NULL,
	`brokerage` decimal(15,2) NOT NULL,
	`gst` decimal(15,2) NOT NULL,
	`tds_194h` decimal(15,2) NOT NULL,
	`net` decimal(15,2) NOT NULL,
	`status` enum('accrued','eligible','invoiced','approved','paid') NOT NULL DEFAULT 'accrued',
	`eligible_rule` text,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_brokerage_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_brokerage_entries_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_brokerage_slabs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`tier` enum('silver','gold','platinum') NOT NULL,
	`from_count` int NOT NULL,
	`to_count` int,
	`pct` decimal(7,4) NOT NULL,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_brokerage_slabs_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_brokerage_slabs_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_campaigns` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`name` varchar(150) NOT NULL,
	`source_id` bigint,
	`site_id` bigint,
	`budget` decimal(15,2),
	`start_date` timestamp,
	`end_date` timestamp,
	`utm_source` varchar(100),
	`utm_medium` varchar(100),
	`utm_campaign` varchar(100),
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_campaigns_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_cancellations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`cancellation_no` varchar(50) NOT NULL,
	`received_till_date` timestamp,
	`cancellation_charges` decimal(15,2),
	`tds` decimal(15,2),
	`gst_reversal` decimal(15,2),
	`refund_amount` decimal(15,2),
	`refund_status` enum('pending','processed','cancelled') NOT NULL DEFAULT 'pending',
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_cancellations_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_cancellations_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_channel_partners` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`firm_name` varchar(200) NOT NULL,
	`contact_person` varchar(150),
	`mobile` varchar(20),
	`email` varchar(255),
	`rera_no` varchar(50),
	`pan` varchar(10),
	`gstin` varchar(15),
	`bank_details` json,
	`status` enum('pending_kyc','active','suspended') NOT NULL DEFAULT 'pending_kyc',
	`tier` enum('silver','gold','platinum') NOT NULL DEFAULT 'silver',
	`agreement_accepted_at` timestamp,
	`agreement_ip` varchar(45),
	`user_id` bigint,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_channel_partners_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_channel_partners_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_charge_heads` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`code` varchar(30) NOT NULL,
	`name` varchar(100) NOT NULL,
	`calc_type` enum('fixed','per_sqft','pct_of_agreement','per_month') NOT NULL,
	`default_value` decimal(15,2),
	`gst_applicable` boolean NOT NULL DEFAULT false,
	`gst_rate` decimal(7,4),
	`sequence` int NOT NULL DEFAULT 0,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_charge_heads_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_charge_heads_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_charge_heads_tenant_code_idx` UNIQUE(`tenant_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `re_cost_sheets` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`lead_id` bigint,
	`unit_id` bigint,
	`scheme_id` bigint,
	`rate` decimal(15,2),
	`discount_pct` decimal(7,4),
	`lines` json,
	`totals` json,
	`valid_till` timestamp,
	`status` enum('draft','pending_approval','approved','rejected','shared') NOT NULL DEFAULT 'draft',
	`approved_by` bigint,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_cost_sheets_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_cost_sheets_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_cp_lead_tags` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`lead_id` bigint NOT NULL,
	`cp_id` bigint NOT NULL,
	`tagged_at` timestamp NOT NULL DEFAULT (now()),
	`valid_till` timestamp,
	`status` enum('active','expired','rejected_duplicate','converted') NOT NULL DEFAULT 'active',
	`evidence` text,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `re_cp_lead_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_cp_payouts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`cp_id` bigint NOT NULL,
	`payout_date` timestamp NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`tds` decimal(15,2) NOT NULL,
	`net_paid` decimal(15,2) NOT NULL,
	`bank_ref` varchar(100),
	`status` enum('pending','paid') NOT NULL DEFAULT 'pending',
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_cp_payouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_cp_payouts_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_cp_project_access` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`cp_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	CONSTRAINT `re_cp_project_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_cp_project_access_cp_site_idx` UNIQUE(`cp_id`,`site_id`)
);
--> statement-breakpoint
CREATE TABLE `re_credit_notes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`credit_no` varchar(50) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`reason` text,
	`status` enum('draft','approved','cancelled') NOT NULL DEFAULT 'draft',
	`approved_by` bigint,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_credit_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_credit_notes_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_demands` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`demand_no` varchar(50) NOT NULL,
	`booking_id` bigint NOT NULL,
	`pay_stage_id` bigint,
	`demand_date` timestamp NOT NULL,
	`due_date` timestamp,
	`principal` decimal(15,2) NOT NULL,
	`gst` decimal(15,2) NOT NULL DEFAULT '0.00',
	`interest_carried` decimal(15,2) NOT NULL DEFAULT '0.00',
	`total` decimal(15,2) NOT NULL,
	`pdf_url` text,
	`sent_via` varchar(50),
	`sent_at` timestamp,
	`status` enum('draft','sent','paid','cancelled') NOT NULL DEFAULT 'draft',
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_demands_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_demands_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_demands_tenant_demandno_idx` UNIQUE(`tenant_id`,`demand_no`)
);
--> statement-breakpoint
CREATE TABLE `re_feature_interest` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`module_code` varchar(50) NOT NULL,
	`user_id` bigint NOT NULL,
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `re_feature_interest_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_floors` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`wing_id` bigint NOT NULL,
	`name` varchar(50) NOT NULL,
	`level_no` int NOT NULL DEFAULT 0,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_floors_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_floors_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_followups` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`lead_id` bigint NOT NULL,
	`due_at` timestamp NOT NULL,
	`type` varchar(50),
	`assigned_to` bigint,
	`status` enum('pending','done','cancelled') NOT NULL DEFAULT 'pending',
	`done_at` timestamp,
	`outcome` text,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_followups_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_followups_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_interest_entries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`schedule_id` bigint,
	`from_date` timestamp NOT NULL,
	`to_date` timestamp NOT NULL,
	`days` int NOT NULL,
	`rate` decimal(7,4) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`waived_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
	`waiver_approval_id` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `re_interest_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_lead_activities` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`lead_id` bigint NOT NULL,
	`type` enum('call','whatsapp','sms','email','note','stage_change','assign') NOT NULL,
	`outcome` varchar(100),
	`duration_sec` int,
	`notes` text,
	`activity_at` timestamp NOT NULL DEFAULT (now()),
	`user_id` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `re_lead_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_lead_sources` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(30) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_lead_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_lead_sources_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_lead_sources_tenant_code_idx` UNIQUE(`tenant_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `re_leads` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`name` varchar(150) NOT NULL,
	`mobile` varchar(20) NOT NULL,
	`alt_mobile` varchar(20),
	`email` varchar(255),
	`city` varchar(100),
	`budget_min` decimal(15,2),
	`budget_max` decimal(15,2),
	`config_pref` varchar(100),
	`purpose` varchar(100),
	`source_id` bigint,
	`campaign_id` bigint,
	`cp_id` bigint,
	`site_id` bigint,
	`stage` varchar(50) NOT NULL DEFAULT 'new',
	`sub_stage` varchar(50),
	`lost_reason` text,
	`score` int NOT NULL DEFAULT 0,
	`temperature` enum('hot','warm','cold') NOT NULL DEFAULT 'warm',
	`presales_owner_id` bigint,
	`sales_owner_id` bigint,
	`next_followup_at` timestamp,
	`first_response_at` timestamp,
	`sla_breached` boolean NOT NULL DEFAULT false,
	`duplicate_of_id` bigint,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_leads_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_ledger_entries` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`entry_date` timestamp NOT NULL,
	`doc_type` varchar(50) NOT NULL,
	`doc_id` bigint,
	`debit` decimal(15,2) NOT NULL DEFAULT '0.00',
	`credit` decimal(15,2) NOT NULL DEFAULT '0.00',
	`narration` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `re_ledger_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_letter_templates` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`type` enum('demand','allotment','welcome','agreement_intimation','possession','noc','reminder','interest','cancellation','other') NOT NULL,
	`name` varchar(150) NOT NULL,
	`body_html` text,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_letter_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_letter_templates_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_letters_issued` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`template_id` bigint NOT NULL,
	`issued_at` timestamp NOT NULL DEFAULT (now()),
	`sent_via` varchar(50),
	`sent_at` timestamp,
	`pdf_url` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `re_letters_issued_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_parking_slots` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`wing_id` bigint,
	`type` enum('open','stilt','podium','basement') NOT NULL,
	`slot_no` varchar(20) NOT NULL,
	`price` decimal(15,2) NOT NULL,
	`status` enum('available','hold','booked') NOT NULL DEFAULT 'available',
	`booking_id` bigint,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_parking_slots_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_parking_slots_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_pay_stages` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`code` varchar(5) NOT NULL,
	`name` varchar(100) NOT NULL,
	`default_pct` decimal(7,4),
	`sequence` int NOT NULL DEFAULT 0,
	`is_construction_linked` boolean NOT NULL DEFAULT false,
	`status` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`completed_on` timestamp,
	`certificate_file` text,
	`linked_boq_item_id` bigint,
	`linked_dpr_id` bigint,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_pay_stages_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_pay_stages_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_pay_stages_tenant_site_code_idx` UNIQUE(`tenant_id`,`site_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `re_payment_schedule` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`booking_id` bigint NOT NULL,
	`pay_stage_id` bigint NOT NULL,
	`pct` decimal(7,4),
	`amount` decimal(15,2) NOT NULL,
	`gst_amt` decimal(15,2) NOT NULL DEFAULT '0.00',
	`due_date` timestamp,
	`demand_id` bigint,
	`paid_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
	`status` enum('not_due','demanded','partly_paid','paid','overdue') NOT NULL DEFAULT 'not_due',
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `re_payment_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_phases` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`name` varchar(100) NOT NULL,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_phases_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_phases_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_project_settings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`site_id` bigint NOT NULL,
	`rera_no` varchar(50),
	`launch_date` timestamp,
	`possession_date` timestamp,
	`stamp_duty_pct` decimal(7,4) DEFAULT '6.0000',
	`metro_cess_pct` decimal(7,4) DEFAULT '0.0000',
	`registration_pct` decimal(7,4) DEFAULT '1.0000',
	`registration_cap` decimal(15,2) DEFAULT '30000.00',
	`interest_rate_pa` decimal(7,4),
	`interest_grace_days` int DEFAULT 10,
	`gst_rate_under_construction` decimal(7,4) DEFAULT '5.0000',
	`hold_hours_default` int DEFAULT 48,
	`cp_tag_validity_days` int DEFAULT 60,
	`letterhead_html` text,
	`bank_details_text` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `re_project_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_project_settings_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_project_settings_site_id_unique` UNIQUE(`site_id`),
	CONSTRAINT `re_project_settings_site_idx` UNIQUE(`site_id`)
);
--> statement-breakpoint
CREATE TABLE `re_receipt_allocations` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`receipt_id` bigint NOT NULL,
	`schedule_id` bigint,
	`charge_type` varchar(50),
	`amount` decimal(15,2) NOT NULL,
	CONSTRAINT `re_receipt_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `re_receipts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`receipt_no` varchar(50) NOT NULL,
	`booking_id` bigint NOT NULL,
	`receipt_date` timestamp NOT NULL,
	`against` varchar(50),
	`pay_stage_id` bigint,
	`mode` enum('cash','cheque','dd','neft','rtgs','imps','upi','swift','online') NOT NULL,
	`instrument_no` varchar(100),
	`instrument_date` timestamp,
	`drawn_on_bank` varchar(150),
	`deposit_bank_id` bigint,
	`amount` decimal(15,2) NOT NULL,
	`tds_applicable` boolean NOT NULL DEFAULT false,
	`tds_pct` decimal(7,4),
	`tds_amount` decimal(15,2),
	`gst_component` decimal(15,2),
	`status` enum('draft','pending_approval','passed','hold','bounced','cancelled') NOT NULL DEFAULT 'draft',
	`realised_on` timestamp,
	`bounce_charges` decimal(15,2),
	`narration` text,
	`attachment_url` text,
	`tally_synced` boolean NOT NULL DEFAULT false,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_receipts_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_receipts_tenant_receiptno_idx` UNIQUE(`tenant_id`,`receipt_no`)
);
--> statement-breakpoint
CREATE TABLE `re_routing_rules` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`name` varchar(150) NOT NULL,
	`conditions` json,
	`user_pool` json,
	`strategy` enum('round_robin','load') NOT NULL,
	`sla_minutes` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_routing_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_routing_rules_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_scheme_stages` (
	`scheme_id` bigint NOT NULL,
	`pay_stage_id` bigint NOT NULL,
	`pct` decimal(7,4) NOT NULL,
	CONSTRAINT `re_scheme_stages_scheme_id_pay_stage_id_pk` PRIMARY KEY(`scheme_id`,`pay_stage_id`)
);
--> statement-breakpoint
CREATE TABLE `re_schemes` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`name` varchar(150) NOT NULL,
	`gst_mode` enum('with','without') NOT NULL,
	`unit_type_ids` json,
	`floor_from` int,
	`floor_to` int,
	`stamp_by_builder` boolean NOT NULL DEFAULT false,
	`registration_by_builder` boolean NOT NULL DEFAULT false,
	`max_discount_pct` decimal(7,4),
	`active` boolean NOT NULL DEFAULT true,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_schemes_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_schemes_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_site_visits` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`lead_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`scheduled_at` timestamp NOT NULL,
	`status` enum('scheduled','confirmed','done','no_show','rescheduled') NOT NULL DEFAULT 'scheduled',
	`attended_by` bigint,
	`feedback` text,
	`is_revisit` boolean NOT NULL DEFAULT false,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_site_visits_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_site_visits_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_transfers` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`old_booking_id` bigint NOT NULL,
	`new_booking_id` bigint NOT NULL,
	`transfer_date` timestamp NOT NULL,
	`reason` text,
	`status` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_transfers_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_transfers_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `re_unit_types` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` enum('RES','COM') NOT NULL,
	`default_carpet_area` decimal(10,2),
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_unit_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_unit_types_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_unit_types_tenant_code_idx` UNIQUE(`tenant_id`,`code`)
);
--> statement-breakpoint
CREATE TABLE `re_units` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`site_id` bigint NOT NULL,
	`wing_id` bigint NOT NULL,
	`floor_id` bigint NOT NULL,
	`unit_no` varchar(20) NOT NULL,
	`unit_type_id` bigint NOT NULL,
	`carpet_area` decimal(10,2),
	`balcony_area` decimal(10,2),
	`terrace_area` decimal(10,2),
	`saleable_area` decimal(10,2),
	`facing` varchar(30),
	`base_rate` decimal(15,2),
	`floor_rise_rate` decimal(15,2),
	`plc_amount` decimal(15,2),
	`status` enum('available','hold','blocked','booked','agreement','registered','possession','cancelled','not_for_sale') NOT NULL DEFAULT 'available',
	`hold_by` bigint,
	`hold_till` timestamp,
	`is_investor` boolean NOT NULL DEFAULT false,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_units_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_units_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `re_units_tenant_wing_unitno_idx` UNIQUE(`tenant_id`,`wing_id`,`unit_no`)
);
--> statement-breakpoint
CREATE TABLE `re_wings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenant_id` bigint NOT NULL,
	`phase_id` bigint NOT NULL,
	`name` varchar(100) NOT NULL,
	`total_floors` int NOT NULL,
	`created_by` bigint,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `re_wings_id` PRIMARY KEY(`id`),
	CONSTRAINT `re_wings_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `tenant_modules` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tenant_id` bigint NOT NULL,
	`module_code` varchar(50) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `tm_tenant_module_idx` UNIQUE(`tenant_id`,`module_code`)
);
--> statement-breakpoint
ALTER TABLE `tenants` ADD `tagline` varchar(255) DEFAULT 'Builders & Developers';--> statement-breakpoint
ALTER TABLE `tenants` ADD `mfa_enabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `branding` text;--> statement-breakpoint
ALTER TABLE `users` ADD `totp_secret` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `totp_enabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `backup_codes` text;--> statement-breakpoint
CREATE INDEX `boq_tenant_site_idx` ON `boq_items` (`tenant_id`,`site_id`);--> statement-breakpoint
CREATE INDEX `boq_item_code_idx` ON `boq_items` (`item_code`);--> statement-breakpoint
CREATE INDEX `dpr_tenant_idx` ON `daily_progress_reports` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `dpr_site_date_idx` ON `daily_progress_reports` (`site_id`,`report_date`);--> statement-breakpoint
CREATE INDEX `dpr_equip_dpr_idx` ON `dpr_equipments` (`dpr_id`);--> statement-breakpoint
CREATE INDEX `dpr_photo_dpr_idx` ON `dpr_photos` (`dpr_id`);--> statement-breakpoint
CREATE INDEX `dpr_work_item_dpr_idx` ON `dpr_work_items` (`dpr_id`);--> statement-breakpoint
CREATE INDEX `labour_tenant_site_date_idx` ON `labour_attendance` (`tenant_id`,`site_id`,`attendance_date`);--> statement-breakpoint
CREATE INDEX `labour_contractor_idx` ON `labour_attendance` (`contractor_id`);--> statement-breakpoint
CREATE INDEX `notif_tenant_idx` ON `notifications` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notif_tenant_read_idx` ON `notifications` (`tenant_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `re_approvals_tenant_idx` ON `re_approvals` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_booking_applicants_tenant_idx` ON `re_booking_applicants` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_booking_applicants_booking_idx` ON `re_booking_applicants` (`booking_id`);--> statement-breakpoint
CREATE INDEX `re_booking_charges_booking_idx` ON `re_booking_charges` (`booking_id`);--> statement-breakpoint
CREATE INDEX `re_booking_documents_tenant_idx` ON `re_booking_documents` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_booking_documents_booking_idx` ON `re_booking_documents` (`booking_id`);--> statement-breakpoint
CREATE INDEX `re_booking_parkings_booking_idx` ON `re_booking_parkings` (`booking_id`);--> statement-breakpoint
CREATE INDEX `re_bookings_tenant_idx` ON `re_bookings` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_brokerage_entries_tenant_idx` ON `re_brokerage_entries` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_brokerage_slabs_tenant_idx` ON `re_brokerage_slabs` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_campaigns_tenant_idx` ON `re_campaigns` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_cancellations_tenant_idx` ON `re_cancellations` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_channel_partners_tenant_idx` ON `re_channel_partners` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_charge_heads_tenant_idx` ON `re_charge_heads` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_cost_sheets_tenant_idx` ON `re_cost_sheets` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_cp_lead_tags_tenant_idx` ON `re_cp_lead_tags` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_cp_payouts_tenant_idx` ON `re_cp_payouts` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_credit_notes_tenant_idx` ON `re_credit_notes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_demands_tenant_idx` ON `re_demands` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_feature_interest_tenant_idx` ON `re_feature_interest` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_floors_tenant_idx` ON `re_floors` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_followups_tenant_idx` ON `re_followups` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_interest_entries_tenant_idx` ON `re_interest_entries` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_interest_entries_booking_idx` ON `re_interest_entries` (`booking_id`);--> statement-breakpoint
CREATE INDEX `re_lead_activities_tenant_idx` ON `re_lead_activities` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_lead_activities_lead_idx` ON `re_lead_activities` (`lead_id`);--> statement-breakpoint
CREATE INDEX `re_lead_sources_tenant_idx` ON `re_lead_sources` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_leads_tenant_idx` ON `re_leads` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_leads_tenant_mobile_site_idx` ON `re_leads` (`tenant_id`,`mobile`,`site_id`);--> statement-breakpoint
CREATE INDEX `re_ledger_entries_tenant_idx` ON `re_ledger_entries` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_ledger_entries_booking_idx` ON `re_ledger_entries` (`booking_id`);--> statement-breakpoint
CREATE INDEX `re_letter_templates_tenant_idx` ON `re_letter_templates` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_letters_issued_tenant_idx` ON `re_letters_issued` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_letters_issued_booking_idx` ON `re_letters_issued` (`booking_id`);--> statement-breakpoint
CREATE INDEX `re_parking_slots_tenant_idx` ON `re_parking_slots` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_pay_stages_tenant_idx` ON `re_pay_stages` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_payment_schedule_tenant_idx` ON `re_payment_schedule` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_payment_schedule_booking_idx` ON `re_payment_schedule` (`booking_id`);--> statement-breakpoint
CREATE INDEX `re_phases_tenant_idx` ON `re_phases` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_receipt_allocations_receipt_idx` ON `re_receipt_allocations` (`receipt_id`);--> statement-breakpoint
CREATE INDEX `re_receipts_tenant_idx` ON `re_receipts` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_routing_rules_tenant_idx` ON `re_routing_rules` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_scheme_stages_scheme_idx` ON `re_scheme_stages` (`scheme_id`);--> statement-breakpoint
CREATE INDEX `re_schemes_tenant_idx` ON `re_schemes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_site_visits_tenant_idx` ON `re_site_visits` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_transfers_tenant_idx` ON `re_transfers` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_unit_types_tenant_idx` ON `re_unit_types` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_units_tenant_idx` ON `re_units` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `re_wings_tenant_idx` ON `re_wings` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `tm_tenant_idx` ON `tenant_modules` (`tenant_id`);