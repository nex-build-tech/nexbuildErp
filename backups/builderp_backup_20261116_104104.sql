-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: builderp
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) DEFAULT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity` varchar(100) NOT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `diff_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`diff_json`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `audit_tenant_idx` (`tenant_id`),
  KEY `audit_user_idx` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-13 10:31:46'),(2,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-13 10:31:58'),(3,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-13 10:33:59'),(4,1,3,'auth.login','user','3','{\"username\":\"store\",\"role\":\"store\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-13 10:33:59'),(5,1,4,'auth.login','user','4','{\"username\":\"purchase\",\"role\":\"purchase\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-13 10:33:59'),(6,1,5,'auth.login','user','5','{\"username\":\"sitemgr\",\"role\":\"sitemgr\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-13 10:33:59'),(7,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-13 10:34:19'),(8,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 10:36:56'),(9,1,4,'auth.login','user','4','{\"username\":\"purchase\",\"role\":\"purchase\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 10:37:25'),(10,1,4,'auth.login','user','4','{\"username\":\"purchase\",\"role\":\"purchase\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 10:43:53'),(11,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 10:47:10'),(12,1,3,'auth.login','user','3','{\"username\":\"store\",\"role\":\"store\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 10:54:19'),(13,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-13 10:59:34'),(14,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 11:02:33'),(15,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 11:02:59'),(16,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 11:11:56'),(17,1,3,'auth.login','user','3','{\"username\":\"store\",\"role\":\"store\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 11:12:05'),(18,1,4,'auth.login','user','4','{\"username\":\"purchase\",\"role\":\"purchase\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 11:12:14'),(19,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 11:23:56'),(20,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 11:40:08'),(21,1,3,'auth.login','user','3','{\"username\":\"store\",\"role\":\"store\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 12:08:23'),(22,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','unknown','2026-11-13 12:13:50'),(23,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 12:24:57'),(24,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 12:26:42'),(25,1,3,'auth.login','user','3','{\"username\":\"store\",\"role\":\"store\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 12:34:18'),(26,1,4,'auth.login','user','4','{\"username\":\"purchase\",\"role\":\"purchase\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 12:36:17'),(27,1,5,'auth.login','user','5','{\"username\":\"sitemgr\",\"role\":\"sitemgr\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 12:43:12'),(28,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','unknown','2026-11-13 12:43:15'),(29,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 12:43:29'),(30,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 12:44:12'),(31,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','unknown','2026-11-13 12:58:22'),(32,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 13:10:25'),(33,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 13:12:47'),(34,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-13 13:13:03'),(35,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','unknown','2026-11-13 13:13:56'),(36,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','unknown','2026-11-13 13:14:04'),(37,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','unknown','2026-11-13 13:17:56'),(38,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-14 08:30:14'),(39,1,1,'po.created','purchase_orders','KB/PO/26-27/0001','{\"action\":\"INSERT\",\"document\":\"KB/PO/26-27/0001\",\"vendor\":\"GCS Hardware & Housekeeping Supplies\",\"site\":\"Kings Heights Tower A & B\",\"totalAmount\":23328,\"itemsCount\":22,\"after\":{\"poNumber\":\"KB/PO/26-27/0001\",\"status\":\"pending_approval\",\"totalAmount\":\"23328.00\",\"cgstAmount\":\"1779.25\",\"sgstAmount\":\"1779.25\"}}','192.168.1.101','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0','2026-11-14 08:47:56'),(40,1,1,'po.approved','purchase_orders','KB/PO/26-27/0001','{\"action\":\"UPDATE\",\"changedFields\":[\"status\",\"approvedById\",\"approvedAt\"],\"before\":{\"status\":\"pending_approval\",\"approvedById\":null,\"approvedAt\":null},\"after\":{\"status\":\"approved\",\"approvedById\":1,\"approvedAt\":\"2026-11-13T12:00:00Z\"}}','192.168.1.101','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0','2026-11-14 08:47:56'),(41,1,3,'grn.inspected','goods_receipt_notes','KB/GRN/26-27/0001','{\"action\":\"UPDATE\",\"changedFields\":[\"status\",\"verifiedById\",\"inspectionRemarks\"],\"before\":{\"status\":\"received\",\"verifiedById\":null,\"inspectionRemarks\":null},\"after\":{\"status\":\"verified\",\"verifiedById\":3,\"inspectionRemarks\":\"All 22 items physically verified and accepted 100% conforming to PO specifications.\"}}','192.168.1.105','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0','2026-11-14 08:47:56'),(42,1,5,'stock.material_issued','material_issues','KB/ISSUE/26-27/0001','{\"action\":\"INSERT\",\"document\":\"KB/ISSUE/26-27/0001\",\"contractor\":\"Apex Infra Civil Works\",\"site\":\"Royal Palm Luxury Residences\",\"item\":\"TMT FE500D 12MM REBAR\",\"quantity\":\"7.000 MT\",\"totalCost\":\"409500.00\",\"after\":{\"stockBalanceBefore\":\"10.000 MT\",\"stockBalanceAfter\":\"3.000 MT\"}}','192.168.1.110','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0','2026-11-14 08:47:56'),(43,1,5,'ra_bill.certified','ra_bills','KB/RA/26-27/0001','{\"action\":\"INSERT\",\"document\":\"KB/RA/26-27/0001\",\"contractor\":\"Apex Infra Civil Works\",\"grossAmount\":282000,\"retentionWithheld\":14100,\"tdsDeducted\":2820,\"materialRecovery\":15000,\"netPayable\":250080,\"after\":{\"status\":\"certified\",\"certifiedById\":5}}','192.168.1.110','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0','2026-11-14 08:47:56'),(44,1,1,'ra_bill.approved','ra_bills','KB/RA/26-27/0001','{\"action\":\"UPDATE\",\"changedFields\":[\"status\",\"approvedById\"],\"before\":{\"status\":\"certified\",\"approvedById\":null},\"after\":{\"status\":\"approved\",\"approvedById\":1}}','192.168.1.101','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0','2026-11-14 08:47:56'),(45,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','unknown','2026-11-14 08:48:53'),(46,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','unknown','2026-11-14 08:49:00'),(47,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-14 08:57:37'),(48,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.22621.6133','2026-11-14 08:58:13'),(49,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-16 04:01:57'),(50,1,1,'auth.login','user','1','{\"username\":\"boss\",\"role\":\"boss\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-16 04:02:19'),(51,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','2026-11-16 04:44:55'),(52,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','node','2026-11-16 05:04:33'),(53,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','node','2026-11-16 05:04:39'),(54,1,2,'auth.login','user','2','{\"username\":\"admin\",\"role\":\"admin\"}','127.0.0.1','node','2026-11-16 05:04:44');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) NOT NULL,
  `parent_id` bigint(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_cat_code_idx` (`tenant_id`,`code`),
  KEY `cat_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'7dafad38-5b7d-42d3-b245-420d7e381cc9',1,'Civil & Structural Materials','CAT-CIVIL',NULL,'Cement, Sand, Aggregates, Red Bricks, AAC Blocks','2026-11-13 10:56:57','2026-11-13 10:56:57'),(2,'38f201f4-0a26-44d4-825e-0286922eadc4',1,'Steel & Reinforcements','CAT-STEEL',NULL,'TMT bars, Binding wires, structural beams','2026-11-13 10:56:57','2026-11-13 10:56:57'),(3,'5a2d8352-a2b9-47b7-826a-eeb1ade64a8d',1,'Plumbing & Sanitary','CAT-PLUMB',NULL,'PVC pipes, CPVC, GI fittings, sanitary fixtures','2026-11-13 10:56:57','2026-11-13 10:56:57'),(4,'e9798f30-af5d-4e5c-a2b2-b9152d45674c',1,'Electrical & Lighting','CAT-ELEC',NULL,'Wires, conduits, switches, distribution boards','2026-11-13 10:56:57','2026-11-13 10:56:57'),(5,'6ec27c4e-dd4a-4829-b001-572681ce8d1e',1,'Finishing & Paints','CAT-FINISH',NULL,'Paints, primers, tiles, marble, granite','2026-11-13 10:56:57','2026-11-13 10:56:57'),(6,'87e99659-08ae-4f44-b38f-04c7009339b4',1,'Housekeeping & Cleaning Materials','CAT-HOUSE',NULL,'Housekeeping supplies, chemicals, brushes, dusters (GCS quotation)','2026-11-13 10:56:57','2026-11-13 10:56:57');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contractors`
--

DROP TABLE IF EXISTS `contractors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contractors` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `trade` varchar(100) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `contractors_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_cont_code_idx` (`tenant_id`,`code`),
  KEY `cont_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contractors`
--

LOCK TABLES `contractors` WRITE;
/*!40000 ALTER TABLE `contractors` DISABLE KEYS */;
INSERT INTO `contractors` VALUES (1,'962c5634-f4ee-4e08-9b23-9415bc88d373',1,'CONT-CIVIL','Sharma Civil Construction & RCC Works','Omprakash Sharma',NULL,'+91 98190 12345','Civil & RCC Structure','ABOPS1234C',NULL,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(2,'b508ebf0-0d2e-49db-ae24-e0cb8bdc90c6',1,'CONT-ELEC','Apex Electrical & MEP Contractors','Vijay Nair',NULL,'+91 98190 23456','Electrical & MEP','ACDVN2345D',NULL,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(3,'3d656ec1-9541-40de-a76f-a458ca8ac812',1,'CONT-PLUMB','Super Flow Plumbing & Sanitary Contractors','Irfan Khan',NULL,'+91 98190 34567','Plumbing & Drainage','ADVIK3456E',NULL,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(4,'4c55dbc2-c1cb-45e7-a66f-51f91d2ad596',1,'CONT-PAINT','Rainbow Painters & Waterproofers','Santosh Sawant',NULL,'+91 98190 45678','Painting & Waterproofing','AEEPS4567F',NULL,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(5,'9a9ec077-8a4c-421c-958a-c2c5cb4ce4c4',1,'CONT-LABOUR','Maharashtra Labour Supply Syndicate','Baburao Shinde',NULL,'+91 98190 56789','Masonry & Manual Labour','AFBBS5678G',NULL,'active','2026-11-13 10:56:57','2026-11-13 10:56:57');
/*!40000 ALTER TABLE `contractors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_series`
--

DROP TABLE IF EXISTS `document_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_series` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `document_type` varchar(20) NOT NULL,
  `prefix` varchar(20) NOT NULL,
  `financial_year` varchar(10) NOT NULL,
  `next_number` int(11) NOT NULL DEFAULT 1,
  `padding` int(11) NOT NULL DEFAULT 4,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `document_series_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_doc_series_idx` (`tenant_id`,`document_type`,`financial_year`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_series`
--

LOCK TABLES `document_series` WRITE;
/*!40000 ALTER TABLE `document_series` DISABLE KEYS */;
INSERT INTO `document_series` VALUES (1,'87102ed1-f3e9-4fd8-8f77-6a076011909c',1,'PO','KB/PO','26-27',3,4,'2026-11-13 10:56:57','2026-11-13 11:22:59'),(2,'e5ae7f5a-0ac3-4fa7-9b42-cb839a6b96f6',1,'GRN','KB/GRN','26-27',1,4,'2026-11-13 10:56:57','2026-11-13 10:56:57'),(3,'c2ca12b7-f858-4608-802b-4acd41c38317',1,'REQ','KB/REQ','26-27',11,4,'2026-11-13 10:56:57','2026-11-13 13:20:30'),(4,'2b41cb83-5e6f-4dd5-bd36-dfe6fd23a5df',1,'ISSUE','KB/ISS','26-27',1,4,'2026-11-13 10:56:57','2026-11-13 10:56:57'),(5,'a8f72c8c-d092-49db-b164-34258b7cac4e',1,'RFQ','KB/RFQ','26-27',2,4,'2026-11-13 11:22:59','2026-11-13 11:22:59'),(6,'cbdfc050-421d-41e8-8815-8cea9c320064',1,'WO','KB/WO','26-27',2,4,'2026-11-13 12:47:06','2026-11-13 12:47:06'),(7,'eca33540-52ae-4069-ae2a-8dd607c5a000',1,'RA','KB/RA','26-27',2,4,'2026-11-13 12:47:06','2026-11-13 12:47:06');
/*!40000 ALTER TABLE `document_series` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_receipt_notes`
--

DROP TABLE IF EXISTS `goods_receipt_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goods_receipt_notes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `grn_number` varchar(50) NOT NULL,
  `po_id` bigint(20) NOT NULL,
  `vendor_id` bigint(20) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `warehouse_id` bigint(20) NOT NULL,
  `challan_no` varchar(50) DEFAULT NULL,
  `challan_date` timestamp NULL DEFAULT NULL,
  `invoice_no` varchar(50) DEFAULT NULL,
  `invoice_date` timestamp NULL DEFAULT NULL,
  `vehicle_no` varchar(50) DEFAULT NULL,
  `received_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('draft','inspected','verified','cancelled') NOT NULL DEFAULT 'verified',
  `gate_pass_no` varchar(50) DEFAULT NULL,
  `inspection_remarks` text DEFAULT NULL,
  `received_by_id` bigint(20) NOT NULL,
  `verified_by_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `goods_receipt_notes_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_grn_no_idx` (`tenant_id`,`grn_number`),
  KEY `grn_tenant_idx` (`tenant_id`),
  KEY `grn_po_idx` (`po_id`),
  KEY `grn_site_idx` (`site_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_receipt_notes`
--

LOCK TABLES `goods_receipt_notes` WRITE;
/*!40000 ALTER TABLE `goods_receipt_notes` DISABLE KEYS */;
INSERT INTO `goods_receipt_notes` VALUES (1,'94b5eb50-fcb3-4fee-a7a0-62c3d68bf99c',1,'KB/GRN/26-27/0001',5,1,1,2,'CH-KT-2026-9041','2026-11-13 07:06:26','INV-KT-2026-4412','2026-11-13 07:06:26','MH-02-CW-4921 (Tata Ace)','2026-11-13 07:06:26','verified','GP/KH/089','All 22 housekeeping packs received in sealed condition. Batch verified with zero damage.',3,5,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(2,'29ae9d66-6dcd-4146-bd41-1409c392b3a2',1,'KB/GRN/26-27/0002',6,8,2,3,'CH-JSPL-2026-10294','2026-11-13 07:06:26','INV-JSPL-2026-08812','2026-11-13 07:06:26','GJ-06-AX-8912 (10-wheeler)','2026-11-13 07:06:26','verified','GP/RP/104','Mill Test Certificate (MTC) Fe 550D verified. Weighbridge net weight matches delivery invoice 20.00 MT.',3,5,'2026-11-13 12:36:26','2026-11-13 12:36:26');
/*!40000 ALTER TABLE `goods_receipt_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grn_items`
--

DROP TABLE IF EXISTS `grn_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `grn_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `grn_id` bigint(20) NOT NULL,
  `po_item_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `ordered_qty` decimal(12,3) NOT NULL,
  `received_qty` decimal(12,3) NOT NULL,
  `accepted_qty` decimal(12,3) NOT NULL,
  `rejected_qty` decimal(12,3) NOT NULL DEFAULT 0.000,
  `unit_id` bigint(20) NOT NULL,
  `unit_rate` decimal(12,2) NOT NULL,
  `total_value` decimal(14,2) NOT NULL,
  `rejection_reason` text DEFAULT NULL,
  `batch_no` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `grn_item_idx` (`grn_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grn_items`
--

LOCK TABLES `grn_items` WRITE;
/*!40000 ALTER TABLE `grn_items` DISABLE KEYS */;
INSERT INTO `grn_items` VALUES (1,1,49,19,5.000,5.000,5.000,0.000,5,650.00,3250.00,NULL,'BATCH-2026-A1'),(2,1,50,20,5.000,5.000,5.000,0.000,5,650.00,3250.00,NULL,'BATCH-2026-A1'),(3,1,51,21,5.000,5.000,5.000,0.000,5,120.00,600.00,NULL,'BATCH-2026-A1'),(4,1,52,22,5.000,5.000,5.000,0.000,5,180.00,900.00,NULL,'BATCH-2026-A1'),(5,1,53,23,5.000,5.000,5.000,0.000,5,400.00,2000.00,NULL,'BATCH-2026-A1'),(6,1,54,24,20.000,20.000,20.000,0.000,5,10.00,200.00,NULL,'BATCH-2026-A1'),(7,1,55,25,10.000,10.000,10.000,0.000,5,80.00,800.00,NULL,'BATCH-2026-A1'),(8,1,56,26,5.000,5.000,5.000,0.000,5,145.00,725.00,NULL,'BATCH-2026-A1'),(9,1,57,27,5.000,5.000,5.000,0.000,5,130.00,650.00,NULL,'BATCH-2026-A1'),(10,1,58,28,5.000,5.000,5.000,0.000,5,50.00,250.00,NULL,'BATCH-2026-A1'),(11,1,59,29,10.000,10.000,10.000,0.000,5,75.00,750.00,NULL,'BATCH-2026-A1'),(12,1,60,30,5.000,5.000,5.000,0.000,5,120.00,600.00,NULL,'BATCH-2026-A1'),(13,1,61,31,5.000,5.000,5.000,0.000,5,50.00,250.00,NULL,'BATCH-2026-A1'),(14,1,62,32,10.000,10.000,10.000,0.000,5,10.00,100.00,NULL,'BATCH-2026-A1'),(15,1,63,33,5.000,5.000,5.000,0.000,5,280.00,1400.00,NULL,'BATCH-2026-A1'),(16,1,64,34,10.000,10.000,10.000,0.000,5,10.00,100.00,NULL,'BATCH-2026-A1'),(17,1,65,35,5.000,5.000,5.000,0.000,5,120.00,600.00,NULL,'BATCH-2026-A1'),(18,1,66,36,10.000,10.000,10.000,0.000,5,120.00,1200.00,NULL,'BATCH-2026-A1'),(19,1,67,37,5.000,5.000,5.000,0.000,5,20.00,100.00,NULL,'BATCH-2026-A1'),(20,1,68,38,10.000,10.000,10.000,0.000,5,55.00,550.00,NULL,'BATCH-2026-A1'),(21,1,69,39,100.000,100.000,100.000,0.000,5,12.00,1200.00,NULL,'BATCH-2026-A1'),(22,1,70,40,34.000,34.000,34.000,0.000,5,15.00,510.00,NULL,'BATCH-2026-A1'),(23,2,71,3,10.000,10.000,10.000,0.000,2,58500.00,585000.00,NULL,'JINDAL-HEAT-7712'),(24,2,72,4,10.000,10.000,10.000,0.000,2,58500.00,585000.00,NULL,'JINDAL-HEAT-7712');
/*!40000 ALTER TABLE `grn_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `indent_items`
--

DROP TABLE IF EXISTS `indent_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `indent_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `indent_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_id` bigint(20) NOT NULL,
  `estimated_rate` decimal(12,2) DEFAULT NULL,
  `estimated_amount` decimal(14,2) DEFAULT NULL,
  `required_date` timestamp NULL DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ind_item_idx` (`indent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indent_items`
--

LOCK TABLES `indent_items` WRITE;
/*!40000 ALTER TABLE `indent_items` DISABLE KEYS */;
INSERT INTO `indent_items` VALUES (1,1,1,200.000,1,385.00,77000.00,NULL,'UltraTech OPC 53 Grade'),(2,1,3,5.000,2,58500.00,292500.00,NULL,'Tata Tiscon Fe550D 12mm'),(3,1,3,10.000,2,7500.00,75000.00,NULL,'Zone II River Sand for structural concrete');
/*!40000 ALTER TABLE `indent_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `category_id` bigint(20) NOT NULL,
  `unit_id` bigint(20) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `hsn_code` varchar(20) DEFAULT NULL,
  `gst_rate` varchar(10) NOT NULL DEFAULT '18',
  `default_rate` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `reorder_level` decimal(14,3) DEFAULT 0.000,
  `brand` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `items_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_item_code_idx` (`tenant_id`,`code`),
  KEY `item_tenant_idx` (`tenant_id`),
  KEY `item_category_idx` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,'9a2475ba-2b9e-44ba-bb75-f92ce071323e',1,1,1,'MAT-CEM-53','UltraTech OPC 53 Grade Cement','UltraTech OPC 53 Grade Cement','252329','28',385.0000,500.000,'UltraTech','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(2,'0673aeaf-f0dd-401a-8c4f-d0c7b93d0bc9',1,1,1,'MAT-CEM-PPC','Ambuja PPC Pozzolana Cement','Ambuja PPC Pozzolana Cement','252329','28',365.0000,300.000,'Ambuja','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(3,'d444261a-00e5-4a63-a9bd-ddc3fbc42d97',1,2,2,'MAT-STL-12','Tata Tiscon TMT Fe 550D Rebar 12mm','Tata Tiscon TMT Fe 550D Rebar 12mm','721420','18',58500.0000,15.000,'Tata Tiscon','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(4,'406e99cb-aae3-46ae-88e9-b621b62431fa',1,2,2,'MAT-STL-16','Tata Tiscon TMT Fe 550D Rebar 16mm','Tata Tiscon TMT Fe 550D Rebar 16mm','721420','18',58500.0000,20.000,'Tata Tiscon','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(5,'2e910f35-a351-457e-b99c-b932723129cb',1,2,2,'MAT-STL-08','JSW Neosteel TMT Rebar 8mm','JSW Neosteel TMT Rebar 8mm','721420','18',60200.0000,10.000,'JSW','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(6,'33e4cba1-cf67-450b-9edc-21464af4988f',1,1,8,'MAT-SAND-RIV','Natural River Sand (Screened)','Natural River Sand (Screened)','250510','5',6500.0000,10.000,'Mahalaxmi','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(7,'8a4cad15-fd32-4fe2-abbe-7db1f1e79749',1,1,8,'MAT-SAND-M','Manufactured Concrete M-Sand','Manufactured Concrete M-Sand','250590','5',4200.0000,15.000,'Mahalaxmi','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(8,'8ba723e5-9635-4922-854d-80e49395aad2',1,1,8,'MAT-AGG-20','Crushed Blue Metal Aggregate 20mm','Crushed Blue Metal Aggregate 20mm','251710','5',3800.0000,15.000,'Mahalaxmi','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(9,'932020cc-c533-47fd-8af5-44778fad4901',1,1,8,'MAT-AGG-10','Crushed Stone Aggregate 10mm','Crushed Stone Aggregate 10mm','251710','5',4100.0000,10.000,'Mahalaxmi','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(10,'9f3054b5-1132-4b8f-afcc-9c5fb9174703',1,1,5,'MAT-BRK-RED','Kiln Baked Red Clay Bricks (Standard)','Kiln Baked Red Clay Bricks (Standard)','690100','12',9.5000,10000.000,'Standard','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(11,'485fa7a4-cb70-4b2a-9250-fa417760e456',1,1,5,'MAT-BRK-AAC','Siporex AAC Lightweight Blocks 600x200x150mm','Siporex AAC Lightweight Blocks 600x200x150mm','681011','18',62.0000,2000.000,'Siporex','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(12,'e6280f9e-ba3a-4124-b03e-793032fa8832',1,3,5,'MAT-PLB-PVC110','Supreme PVC Drainage Pipe 110mm 4kg/cm2 (6m)','Supreme PVC Drainage Pipe 110mm 4kg/cm2 (6m)','391723','18',620.0000,50.000,'Supreme','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(13,'f6841429-2879-46b2-9b76-0085aea527ce',1,3,5,'MAT-PLB-CPVC','Astral CPVC Cold/Hot Water Pipe 1 inch (3m)','Astral CPVC Cold/Hot Water Pipe 1 inch (3m)','391723','18',340.0000,60.000,'Astral','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(14,'c67de80a-82dc-4890-b2cc-37048b2690c6',1,4,5,'MAT-ELC-WIRE25','Polycab FR 2.5 sq mm Copper Wire Red (90m coil)','Polycab FR 2.5 sq mm Copper Wire Red (90m coil)','854449','18',2450.0000,30.000,'Polycab','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(15,'40f44dfa-686c-4666-9e05-120b2dd49ca1',1,4,5,'MAT-ELC-WIRE15','Polycab FR 1.5 sq mm Copper Wire Blue (90m coil)','Polycab FR 1.5 sq mm Copper Wire Blue (90m coil)','854449','18',1580.0000,30.000,'Polycab','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(16,'221ef650-c899-4f48-95bc-c71f5b7a9b68',1,1,4,'MAT-CHM-WP','Dr. Fixit Pidiproof LW+ Integral Waterproofing 5L','Dr. Fixit Pidiproof LW+ Integral Waterproofing 5L','382440','18',165.0000,20.000,'Dr. Fixit','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(17,'87cdfed7-6763-4f4f-a421-7f8586a0287d',1,5,4,'MAT-PNT-EXT','Asian Paints Apex Ultima Exterior Emulsion 20L','Asian Paints Apex Ultima Exterior Emulsion 20L','320910','18',4850.0000,10.000,'Asian Paints','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(18,'b168339f-5645-43e3-8354-43374fd2b698',1,5,4,'MAT-PNT-PRM','Asian Paints Decoprime Wall Primer 20L','Asian Paints Decoprime Wall Primer 20L','320910','18',2100.0000,15.000,'Asian Paints','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(19,'380aa80b-7d2e-4e5a-87c3-d25579c3f2b0',1,6,5,'HK-01-BATH','BATHROOM CLEANER 5LTR','BATHROOM CLEANER 5LTR','340290','18',650.0000,5.000,'Kheteshwar','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(20,'15f2426b-08bd-4323-ac30-ab330d32d4fe',1,6,5,'HK-02-SURF','HARD SURFACE CLEANER 5 LTR','HARD SURFACE CLEANER 5 LTR','340111','18',650.0000,5.000,'Kheteshwar','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(21,'cd2f0f89-7f65-4ecb-9e9d-5f6e95ee39a6',1,6,5,'HK-03-GLASS','GLASS CLEANER 5LTR (BS)','GLASS CLEANER 5LTR (BS)','34021190','18',120.0000,10.000,'Kheteshwar','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(22,'c3ecbc56-eb05-4c51-9de5-369bb4084492',1,6,5,'HK-04-TOILET','TOILET CLEANER 5 LTR','TOILET CLEANER 5 LTR','38089400','18',180.0000,10.000,'Kheteshwar','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(23,'9e9aea07-629b-4d74-8b0a-92161bad9838',1,6,5,'HK-05-SONA','SONA GREEN 5L','SONA GREEN 5L','090962','18',400.0000,5.000,'Sona','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(24,'cd0dfd32-4b24-4fcd-acbe-865db705fe07',1,6,5,'HK-06-DUST','CHECKED DUSTER','CHECKED DUSTER','630710','5',10.0000,50.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(25,'00bc031b-b9e4-4135-aa40-a068acfccd89',1,6,5,'HK-07-GARB','GARBAGE BAGS 29 * 39','GARBAGE BAGS 29 * 39','39232100','18',80.0000,20.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(26,'e5c8b1d9-eb6a-4cf6-8bef-5fdc970ccaf3',1,6,5,'HK-08-MOP','WET MOP (HEAVY DUTY)','WET MOP (HEAVY DUTY)','39249090','18',145.0000,30.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(27,'60519b33-823a-4fb1-b58e-16d9476569b4',1,6,5,'HK-09-SBROOM','SOFT BROOM (PHOOL JHARU)','SOFT BROOM (PHOOL JHARU)','96031000','Exempt',130.0000,25.000,'Natural','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(28,'89aadbb8-afac-433b-947d-7767e4c233b3',1,6,5,'HK-10-HBROOM','HARD BROOM (NARIYAL JHARU)','HARD BROOM (NARIYAL JHARU)','96031000','Exempt',50.0000,25.000,'Natural','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(29,'b35fbf57-e31b-4a0c-87e5-09e3e69d8f8f',1,6,5,'HK-11-TBRUSH','TOILET BRUSH ROUND','TOILET BRUSH ROUND','96039000','18',75.0000,20.000,'Parmar','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(30,'630ee72e-5fcf-4699-88b5-1739917513c7',1,6,5,'HK-12-FEATHER','(C-538) FEATHER DUSTER (M) YELLOW','(C-538) FEATHER DUSTER (M) YELLOW','96032900','18',120.0000,15.000,'C-538','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(31,'527c4584-8342-48d8-9d64-db5b0aa98834',1,6,5,'HK-13-DUSTPAN','DUST PAN BIG (V) PARMAR','DUST PAN BIG (V) PARMAR','3924','18',50.0000,15.000,'Parmar','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(32,'1d45547a-8a27-4139-81eb-df014070fe70',1,6,5,'HK-14-KATHA','KATHA CLEANING SCRUB','KATHA CLEANING SCRUB','392690','18',10.0000,50.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(33,'a17e9a3c-0af8-4faa-9dd8-4b83e3914191',1,6,5,'HK-15-GWIPER','GLASS WIPER (PROFESSIONAL)','GLASS WIPER (PROFESSIONAL)','392690','18',280.0000,10.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(34,'f84dd88f-bc0b-4b81-9af8-521c80d6cbe2',1,6,5,'HK-16-PKATA','PLASTIC KATA SCRUBBER','PLASTIC KATA SCRUBBER','392690','18',10.0000,30.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(35,'c194510c-795d-4924-8242-9a0537915b3a',1,6,5,'HK-17-WIPERBIG','FLOOR WIPER BIG','FLOOR WIPER BIG','96039000','18',120.0000,20.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(36,'0a75e41f-510b-4a89-99fd-695e99e0a586',1,6,5,'HK-18-ACID','CLEANING ACID 5LTR','CLEANING ACID 5LTR','280800','18',120.0000,10.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(37,'9a2f537c-3893-4f2c-a1da-7e0e4a1be5c0',1,6,5,'HK-19-PATRA','PALTI PATRA (SCRAPER)','PALTI PATRA (SCRAPER)','84602990','18',20.0000,25.000,'Generic','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(38,'5b455ac6-c099-43ba-b152-e4be0944b9ae',1,6,5,'HK-20-GLOVES','SAFETY RUBBER HAND GLOVES','SAFETY RUBBER HAND GLOVES','40159099','18',55.0000,30.000,'SafeHand','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(39,'18886510-b8bd-4181-ae01-3c43a212f133',1,6,5,'HK-21-MASK','PROTECTIVE DUST MASKS','PROTECTIVE DUST MASKS','100810','18',12.0000,50.000,'SafeBreathe','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(40,'b2ea6556-9b97-4780-85cb-1e1f45157e8e',1,6,5,'HK-22-MICROFIBER','MICROFIBER DUSTER - RED','MICROFIBER DUSTER - RED','630710','5',15.0000,30.000,'MicroShine','active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_indents`
--

DROP TABLE IF EXISTS `material_indents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material_indents` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `indent_number` varchar(50) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `requested_by_id` bigint(20) NOT NULL,
  `required_date` timestamp NULL DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `status` enum('draft','submitted','approved','rejected','cancelled','po_created') NOT NULL DEFAULT 'draft',
  `purpose` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `approved_by_id` bigint(20) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `material_indents_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_indent_no_idx` (`tenant_id`,`indent_number`),
  KEY `ind_tenant_idx` (`tenant_id`),
  KEY `ind_site_idx` (`site_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_indents`
--

LOCK TABLES `material_indents` WRITE;
/*!40000 ALTER TABLE `material_indents` DISABLE KEYS */;
INSERT INTO `material_indents` VALUES (1,'8deb3bdd-5d5a-4d45-8669-0052dc92fc5d',1,'KB/REQ/26-27/0001',1,5,NULL,'urgent','approved','Structural RCC Column casting for 14th floor slab at Kings Heights','Delivery required before weekend casting schedule',1,'2026-11-13 05:52:59','2026-11-13 11:22:59','2026-11-13 11:22:59'),(3,'e04b3f93-ead9-4458-a0e0-62b565974fa3',1,'KB/REQ/26-27/0002',2,2,NULL,'medium','approved','asdsdafsd',NULL,3,'2026-11-13 07:04:32','2026-11-13 12:28:44','2026-11-13 12:34:32'),(4,'02f18fc7-3528-4301-a5e2-acb4406ab4eb',1,'KB/REQ/26-27/0003',2,2,NULL,'medium','submitted','asdsdafsd',NULL,NULL,NULL,'2026-11-13 12:28:44','2026-11-13 12:28:44'),(5,'764d21ba-8377-4e8e-b811-c25e60aa2a8a',1,'KB/REQ/26-27/0004',2,2,NULL,'medium','approved','asdsdafsd',NULL,4,'2026-11-13 07:06:34','2026-11-13 12:28:44','2026-11-13 12:36:34'),(6,'0d5218c1-9d63-4265-8941-703052d25d3a',1,'KB/REQ/26-27/0005',2,2,NULL,'medium','rejected','asdsdafsd',NULL,NULL,NULL,'2026-11-13 12:28:44','2026-11-13 12:36:27'),(7,'120098d3-d5e0-44cc-81e3-8d2c918bffb0',1,'KB/REQ/26-27/0006',2,2,NULL,'high','approved','SRV176396397201047607',NULL,1,'2026-11-15 22:33:21','2026-11-13 13:20:28','2026-11-16 04:03:21'),(8,'589a22ce-30c4-49db-887a-b4c1233fa94b',1,'KB/REQ/26-27/0007',2,2,NULL,'high','approved','SRV176396397201047607',NULL,1,'2026-11-15 22:33:19','2026-11-13 13:20:29','2026-11-16 04:03:19'),(9,'c1b877d4-05bc-4f5b-afe5-57b6dfdf93b5',1,'KB/REQ/26-27/0008',2,2,NULL,'high','approved','SRV176396397201047607',NULL,1,'2026-11-15 22:33:19','2026-11-13 13:20:29','2026-11-16 04:03:19'),(10,'33973c30-f814-4116-ae6d-336b33b4c908',1,'KB/REQ/26-27/0009',2,2,NULL,'high','approved','SRV176396397201047607',NULL,1,'2026-11-15 22:33:20','2026-11-13 13:20:29','2026-11-16 04:03:20'),(11,'1b870181-549c-4a9f-bdd9-b57eea4f83af',1,'KB/REQ/26-27/0010',2,2,NULL,'high','approved','SRV176396397201047607',NULL,1,'2026-11-15 22:33:18','2026-11-13 13:20:30','2026-11-16 04:03:18');
/*!40000 ALTER TABLE `material_indents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_issue_items`
--

DROP TABLE IF EXISTS `material_issue_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material_issue_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `issue_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_id` bigint(20) NOT NULL,
  `unit_rate` decimal(12,2) NOT NULL,
  `total_value` decimal(14,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `issue_item_idx` (`issue_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_issue_items`
--

LOCK TABLES `material_issue_items` WRITE;
/*!40000 ALTER TABLE `material_issue_items` DISABLE KEYS */;
INSERT INTO `material_issue_items` VALUES (1,1,3,3.000,2,58500.00,175500.00,'Cutting & bending bar yard dispatch'),(2,1,4,4.000,2,58500.00,234000.00,'Cutting & bending bar yard dispatch');
/*!40000 ALTER TABLE `material_issue_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_issues`
--

DROP TABLE IF EXISTS `material_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `material_issues` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `issue_number` varchar(50) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `warehouse_id` bigint(20) NOT NULL,
  `contractor_id` bigint(20) DEFAULT NULL,
  `issued_to_name` varchar(100) NOT NULL,
  `purpose` text NOT NULL,
  `issue_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('issued','cancelled') NOT NULL DEFAULT 'issued',
  `total_value` decimal(14,2) NOT NULL DEFAULT 0.00,
  `issued_by_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `material_issues_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_issue_no_idx` (`tenant_id`,`issue_number`),
  KEY `issue_tenant_idx` (`tenant_id`),
  KEY `issue_site_idx` (`site_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_issues`
--

LOCK TABLES `material_issues` WRITE;
/*!40000 ALTER TABLE `material_issues` DISABLE KEYS */;
INSERT INTO `material_issues` VALUES (1,'b55db757-4cae-45bf-ad03-e9e37dbc9544',1,'KB/ISS/26-27/0001',2,3,1,'Omprakash Sharma (RCC Contractor Foreman)','Column & Beam Rebar fabrication for B-Wing 5th floor slab casting','2026-11-13 07:06:26','issued',409500.00,3,'2026-11-13 12:36:26','2026-11-13 12:36:26');
/*!40000 ALTER TABLE `material_issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `measurement_sheets`
--

DROP TABLE IF EXISTS `measurement_sheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `measurement_sheets` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ra_bill_id` bigint(20) NOT NULL,
  `wo_item_id` bigint(20) NOT NULL,
  `location_ref` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `number_of_units` decimal(10,2) NOT NULL DEFAULT 1.00,
  `length` decimal(10,3) DEFAULT NULL,
  `breadth` decimal(10,3) DEFAULT NULL,
  `depth` decimal(10,3) DEFAULT NULL,
  `total_qty` decimal(12,3) NOT NULL,
  `rate` decimal(12,2) NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mb_ra_bill_idx` (`ra_bill_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `measurement_sheets`
--

LOCK TABLES `measurement_sheets` WRITE;
/*!40000 ALTER TABLE `measurement_sheets` DISABLE KEYS */;
INSERT INTO `measurement_sheets` VALUES (1,1,4,'Royal Palm Tower B, 5th Floor Slab Grid A1-D6','RCC M25 concrete casting in suspended slab and secondary beams',1.00,20.000,8.000,0.500,80.000,1500.00,120000.00),(2,1,5,'Royal Palm Tower B, 5th Floor Formwork','Shuttering plywood with steel props and acrow spans',1.00,100.000,10.000,1.000,1000.000,120.00,120000.00),(3,1,6,'Royal Palm Tower B, 5th Floor Rebar Tying','Fabrication & binding of 12mm & 16mm Fe 550D bars in column & beam grid',1.00,7.000,1.000,1.000,7.000,6000.00,42000.00);
/*!40000 ALTER TABLE `measurement_sheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `role_code` varchar(50) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` text DEFAULT NULL,
  `channel` varchar(50) NOT NULL DEFAULT 'IN_APP',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `notif_tenant_idx` (`tenant_id`),
  KEY `notif_user_idx` (`user_id`),
  KEY `notif_tenant_read_idx` (`tenant_id`,`is_read`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'1a5e9275-bd5f-4b52-9ea5-ec086c5ed1a3',1,NULL,'boss','PO_APPROVAL','PO Authorization Required: KB/PO/26-27/0002','Purchase Order KB/PO/26-27/0002 for Jindal TMT FE550D Steel (₹3,20,000.00) awaits director sign-off for Kings Sapphire Heights.','{\"docType\":\"PO\",\"docNumber\":\"KB/PO/26-27/0002\",\"link\":\"/procurement/pos\",\"amount\":320000}','ALL',0,NULL,'2026-11-16 04:49:14'),(2,'5bf1d8b5-eb1e-448a-90d8-adb3dd922070',1,NULL,'store','PO_SENT','Inward Expected: Gujarat Ambuja Cement Dispatch','Vendor has dispatched 500 bags of OPC 53 Grade Cement against PO KB/PO/26-27/0001. Vehicle MH-04-AB-1234 en route to Emerald Plaza.','{\"docType\":\"PO\",\"docNumber\":\"KB/PO/26-27/0001\",\"link\":\"/inventory/grn\",\"vendor\":\"Gujarat Ambuja Cements\"}','ALL',0,NULL,'2026-11-16 04:19:14'),(3,'e5d47f12-dfc1-4bf1-88b0-3d1c4f782c9d',1,NULL,'purchase','LOW_STOCK','Safety Reorder Alert: Structural Binding Wire','Stock level for SKU-STL-003 has dropped to 8.00 Kgs (Safety threshold: 50.00 Kgs). Immediate indent required for Central Yard.','{\"docType\":\"STOCK\",\"itemCode\":\"SKU-STL-003\",\"link\":\"/procurement/indents\",\"currentQty\":8,\"reorderLevel\":50}','ALL',0,NULL,'2026-11-16 03:04:14'),(4,'932500ae-9b9a-49de-97dd-a1058616d3cb',1,NULL,'purchase','GRN_DONE','GRN Inward Verified: KB/GRN/26-27/0001','Goods Receipt Note KB/GRN/26-27/0001 completed at Kings Palm Grove. 300 Bags OPC 53 accepted with zero rejections.','{\"docType\":\"GRN\",\"docNumber\":\"KB/GRN/26-27/0001\",\"link\":\"/inventory/grn\",\"itemsCount\":1}','ALL',1,'2026-11-16 02:04:14','2026-11-16 01:04:14'),(5,'3fffb61b-db28-47c2-ab61-6d298677efcb',1,NULL,'boss','RA_BILL_CERTIFIED','RA Bill Certified: RA-01 Shreeram RCC Works','Site Engineer certified RA Bill #RA-01 for ₹12,50,000.00 gross work. Retention ₹62,500 held and TDS ₹12,500 deducted under 194C.','{\"docType\":\"RA_BILL\",\"docNumber\":\"KB/RA/26-27/0001\",\"link\":\"/contractors/ra-bills\",\"netPayable\":1175000}','ALL',1,'2026-11-16 00:04:14','2026-11-15 23:04:14');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'po.view','po','view','Permission for po.view'),(2,'po.create','po','create','Permission for po.create'),(3,'po.edit','po','edit','Permission for po.edit'),(4,'po.delete','po','delete','Permission for po.delete'),(5,'po.approve','po','approve','Permission for po.approve'),(6,'po.reject','po','reject','Permission for po.reject'),(7,'po.cancel','po','cancel','Permission for po.cancel'),(8,'po.export','po','export','Permission for po.export'),(9,'po.print','po','print','Permission for po.print'),(10,'grn.view','grn','view','Permission for grn.view'),(11,'grn.create','grn','create','Permission for grn.create'),(12,'grn.edit','grn','edit','Permission for grn.edit'),(13,'grn.delete','grn','delete','Permission for grn.delete'),(14,'grn.approve','grn','approve','Permission for grn.approve'),(15,'grn.export','grn','export','Permission for grn.export'),(16,'stock.view','stock','view','Permission for stock.view'),(17,'stock.adjust','stock','adjust','Permission for stock.adjust'),(18,'stock.transfer','stock','transfer','Permission for stock.transfer'),(19,'stock.export','stock','export','Permission for stock.export'),(20,'stock.valuation.view','stock','valuation','Permission for stock.valuation.view'),(21,'item.view','item','view','Permission for item.view'),(22,'item.create','item','create','Permission for item.create'),(23,'item.edit','item','edit','Permission for item.edit'),(24,'item.delete','item','delete','Permission for item.delete'),(25,'supplier.view','supplier','view','Permission for supplier.view'),(26,'supplier.create','supplier','create','Permission for supplier.create'),(27,'supplier.edit','supplier','edit','Permission for supplier.edit'),(28,'supplier.delete','supplier','delete','Permission for supplier.delete'),(29,'invoice.view','invoice','view','Permission for invoice.view'),(30,'invoice.create','invoice','create','Permission for invoice.create'),(31,'invoice.edit','invoice','edit','Permission for invoice.edit'),(32,'invoice.delete','invoice','delete','Permission for invoice.delete'),(33,'invoice.approve','invoice','approve','Permission for invoice.approve'),(34,'invoice.export','invoice','export','Permission for invoice.export'),(35,'payment.view','payment','view','Permission for payment.view'),(36,'payment.create','payment','create','Permission for payment.create'),(37,'payment.approve','payment','approve','Permission for payment.approve'),(38,'payment.export','payment','export','Permission for payment.export'),(39,'warehouse.view','warehouse','view','Permission for warehouse.view'),(40,'warehouse.create','warehouse','create','Permission for warehouse.create'),(41,'warehouse.edit','warehouse','edit','Permission for warehouse.edit'),(42,'warehouse.delete','warehouse','delete','Permission for warehouse.delete'),(43,'report.view','report','view','Permission for report.view'),(44,'report.export','report','export','Permission for report.export'),(45,'report.purchase.analysis','report','purchase','Permission for report.purchase.analysis'),(46,'report.inventory.analysis','report','inventory','Permission for report.inventory.analysis'),(47,'report.supplier.ledger','report','supplier','Permission for report.supplier.ledger'),(48,'report.gst.input','report','gst','Permission for report.gst.input'),(49,'user.view','user','view','Permission for user.view'),(50,'user.create','user','create','Permission for user.create'),(51,'user.edit','user','edit','Permission for user.edit'),(52,'user.delete','user','delete','Permission for user.delete'),(53,'user.assign_role','user','assign_role','Permission for user.assign_role'),(54,'role.view','role','view','Permission for role.view'),(55,'role.create','role','create','Permission for role.create'),(56,'role.edit','role','edit','Permission for role.edit'),(57,'role.delete','role','delete','Permission for role.delete'),(58,'settings.view','settings','view','Permission for settings.view'),(59,'settings.edit','settings','edit','Permission for settings.edit'),(60,'audit_log.view','audit_log','view','Permission for audit_log.view'),(61,'audit_log.export','audit_log','export','Permission for audit_log.export');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `po_items`
--

DROP TABLE IF EXISTS `po_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `po_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `po_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_id` bigint(20) NOT NULL,
  `unit_rate` decimal(12,2) NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(14,2) NOT NULL,
  `gst_rate` varchar(10) NOT NULL,
  `cgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(14,2) NOT NULL,
  `received_quantity` decimal(12,3) NOT NULL DEFAULT 0.000,
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `po_item_idx` (`po_id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `po_items`
--

LOCK TABLES `po_items` WRITE;
/*!40000 ALTER TABLE `po_items` DISABLE KEYS */;
INSERT INTO `po_items` VALUES (49,5,19,5.000,5,650.00,0.00,3250.00,'18',292.50,292.50,0.00,3835.00,5.000,'As per GCS.pdf standard price list'),(50,5,20,5.000,5,650.00,0.00,3250.00,'18',292.50,292.50,0.00,3835.00,5.000,'As per GCS.pdf standard price list'),(51,5,21,5.000,5,120.00,0.00,600.00,'18',54.00,54.00,0.00,708.00,5.000,'As per GCS.pdf standard price list'),(52,5,22,5.000,5,180.00,0.00,900.00,'18',81.00,81.00,0.00,1062.00,5.000,'As per GCS.pdf standard price list'),(53,5,23,5.000,5,400.00,0.00,2000.00,'18',180.00,180.00,0.00,2360.00,5.000,'As per GCS.pdf standard price list'),(54,5,24,20.000,5,10.00,0.00,200.00,'5',5.00,5.00,0.00,210.00,20.000,'As per GCS.pdf standard price list'),(55,5,25,10.000,5,80.00,0.00,800.00,'18',72.00,72.00,0.00,944.00,10.000,'As per GCS.pdf standard price list'),(56,5,26,5.000,5,145.00,0.00,725.00,'18',65.25,65.25,0.00,855.50,5.000,'As per GCS.pdf standard price list'),(57,5,27,5.000,5,130.00,0.00,650.00,'Exempt',0.00,0.00,0.00,650.00,5.000,'As per GCS.pdf standard price list'),(58,5,28,5.000,5,50.00,0.00,250.00,'Exempt',0.00,0.00,0.00,250.00,5.000,'As per GCS.pdf standard price list'),(59,5,29,10.000,5,75.00,0.00,750.00,'18',67.50,67.50,0.00,885.00,10.000,'As per GCS.pdf standard price list'),(60,5,30,5.000,5,120.00,0.00,600.00,'18',54.00,54.00,0.00,708.00,5.000,'As per GCS.pdf standard price list'),(61,5,31,5.000,5,50.00,0.00,250.00,'18',22.50,22.50,0.00,295.00,5.000,'As per GCS.pdf standard price list'),(62,5,32,10.000,5,10.00,0.00,100.00,'18',9.00,9.00,0.00,118.00,10.000,'As per GCS.pdf standard price list'),(63,5,33,5.000,5,280.00,0.00,1400.00,'18',126.00,126.00,0.00,1652.00,5.000,'As per GCS.pdf standard price list'),(64,5,34,10.000,5,10.00,0.00,100.00,'18',9.00,9.00,0.00,118.00,10.000,'As per GCS.pdf standard price list'),(65,5,35,5.000,5,120.00,0.00,600.00,'18',54.00,54.00,0.00,708.00,5.000,'As per GCS.pdf standard price list'),(66,5,36,10.000,5,120.00,0.00,1200.00,'18',108.00,108.00,0.00,1416.00,10.000,'As per GCS.pdf standard price list'),(67,5,37,5.000,5,20.00,0.00,100.00,'18',9.00,9.00,0.00,118.00,5.000,'As per GCS.pdf standard price list'),(68,5,38,10.000,5,55.00,0.00,550.00,'18',49.50,49.50,0.00,649.00,10.000,'As per GCS.pdf standard price list'),(69,5,39,100.000,5,12.00,0.00,1200.00,'18',108.00,108.00,0.00,1416.00,100.000,'As per GCS.pdf standard price list'),(70,5,40,34.000,5,15.00,0.00,510.00,'5',12.75,12.75,0.00,535.50,34.000,'As per GCS.pdf standard price list'),(71,6,3,10.000,2,58500.00,0.00,585000.00,'18',0.00,0.00,105300.00,690300.00,10.000,'Direct dispatch from Vadodara plant'),(72,6,4,10.000,2,58500.00,0.00,585000.00,'18',0.00,0.00,105300.00,690300.00,10.000,'Direct dispatch from Vadodara plant');
/*!40000 ALTER TABLE `po_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `po_number` varchar(50) NOT NULL,
  `indent_id` bigint(20) DEFAULT NULL,
  `rfq_id` bigint(20) DEFAULT NULL,
  `quotation_id` bigint(20) DEFAULT NULL,
  `vendor_id` bigint(20) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `warehouse_id` bigint(20) DEFAULT NULL,
  `po_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `delivery_date` timestamp NULL DEFAULT NULL,
  `payment_terms` varchar(255) DEFAULT NULL,
  `status` enum('draft','pending_approval','approved','issued','partially_received','completed','cancelled') NOT NULL DEFAULT 'draft',
  `is_inter_state` tinyint(1) NOT NULL DEFAULT 0,
  `subtotal` decimal(14,2) NOT NULL,
  `discount_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(14,2) NOT NULL,
  `cgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `round_off` decimal(6,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(14,2) NOT NULL,
  `amount_in_words` text DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `terms_and_conditions` text DEFAULT NULL,
  `idempotency_key` varchar(100) DEFAULT NULL,
  `created_by_id` bigint(20) NOT NULL,
  `approved_by_id` bigint(20) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_orders_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_po_no_idx` (`tenant_id`,`po_number`),
  KEY `po_tenant_idx` (`tenant_id`),
  KEY `po_vendor_idx` (`vendor_id`),
  KEY `po_site_idx` (`site_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (5,'21c5cf4d-9967-444e-9f5f-e3e9b660db7a',1,'KB/PO/26-27/0001',NULL,NULL,NULL,1,1,2,'2026-11-13 06:03:03','2026-11-18 06:03:03','30 Days Net from date of GRN inspection','completed',0,23328.00,0.00,19985.00,1671.50,1671.50,0.00,0.00,23328.00,'Rupees Twenty Three Thousand Three Hundred Twenty Eight Only','Kings Builders & Developers, Kings Tower, Off S.V. Road, Andheri West, Mumbai, Maharashtra 400058','Kings Heights Tower A & B, Plot 42, Lokhandwala Complex, Andheri West, Mumbai - 400053','1. Materials must be supplied in genuine manufacturer sealed packings.\n2. Invoices must quote PO Number and Site Delivery Address.\n3. Defective or expired batches will be rejected at supplier cost.\n4. Payment will be released within 30 days upon Store Inward GRN approval.',NULL,4,1,'2026-11-13 06:03:03','2026-11-13 11:33:03','2026-11-13 12:36:26'),(6,'a5fe5636-4966-44b1-83f6-35ea133a5483',1,'KB/PO/26-27/0002',NULL,NULL,NULL,8,2,3,'2026-11-13 06:03:03','2026-11-20 06:03:03','45 Days LC / Bank Guarantee','completed',1,1380600.00,0.00,1170000.00,0.00,0.00,210600.00,0.00,1380600.00,'Rupees Thirteen Lakh Eighty Thousand Six Hundred Only','Kings Builders & Developers, Kings Tower, Off S.V. Road, Andheri West, Mumbai, Maharashtra 400058','Royal Palm Luxury Residences, Near Gokuldham, Goregaon East, Mumbai - 400063','1. Test certificates (MTC) for Fe 550D must accompany vehicle dispatch.\n2. Weighbridge receipt at Site and Mill weight will be reconciled.\n3. Interstate E-Way bill must be generated by supplier before truck transit.\n4. Unloading at site by buyer crane.',NULL,4,1,'2026-11-13 06:03:03','2026-11-13 11:33:03','2026-11-13 12:36:26');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ra_bills`
--

DROP TABLE IF EXISTS `ra_bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ra_bills` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `bill_number` varchar(50) NOT NULL,
  `ra_number` int(11) NOT NULL,
  `wo_id` bigint(20) NOT NULL,
  `contractor_id` bigint(20) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `bill_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `period_start` timestamp NULL DEFAULT NULL,
  `period_end` timestamp NULL DEFAULT NULL,
  `gross_amount` decimal(14,2) NOT NULL,
  `retention_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `tds_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `material_deduction` decimal(14,2) NOT NULL DEFAULT 0.00,
  `other_deductions` decimal(14,2) NOT NULL DEFAULT 0.00,
  `net_payable` decimal(14,2) NOT NULL,
  `amount_in_words` text DEFAULT NULL,
  `status` enum('draft','certified','approved','paid') NOT NULL DEFAULT 'certified',
  `certified_by_id` bigint(20) DEFAULT NULL,
  `approved_by_id` bigint(20) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ra_bills_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_ra_no_idx` (`tenant_id`,`bill_number`),
  KEY `ra_tenant_idx` (`tenant_id`),
  KEY `ra_wo_idx` (`wo_id`),
  KEY `ra_contractor_idx` (`contractor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ra_bills`
--

LOCK TABLES `ra_bills` WRITE;
/*!40000 ALTER TABLE `ra_bills` DISABLE KEYS */;
INSERT INTO `ra_bills` VALUES (1,'ba234659-c42a-44df-b115-417ddb9efa3a',1,'KB/RA/26-27/0001',1,2,1,2,'2026-11-13 07:17:50','2026-10-19 07:17:50','2026-11-13 07:17:50',282000.00,14100.00,2820.00,15000.00,0.00,250080.00,'Rupees Two Lakh Fifty Thousand Eighty Only','approved',5,1,'Measurements cross-verified on site by Project Engineer. Rebar consumption reconciled against GRN inward.','2026-11-13 12:47:50','2026-11-13 12:47:50');
/*!40000 ALTER TABLE `ra_bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `refresh_user_idx` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,1,'$2b$08$4ZcXVKKizznUHZtnT5gGhuY5956t2oOnMi/yWdidzUXmbrEtc29l6','2026-11-20 05:01:46',NULL,'2026-11-13 10:31:46'),(2,1,'$2b$08$SHeZr1SE81XoTaHAw3oCBuXSH.r5NGG9I1a56WTiIRr.2PjbsZhi.','2026-11-20 05:01:58',NULL,'2026-11-13 10:31:58'),(3,2,'$2b$08$0iGTemzbrlrWCNriPxUYuOuYT9XrszYmqrZ0HfkI/aH81YPAtC.xC','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 10:33:59'),(4,3,'$2b$08$OBDJUEz27.Q2yf96/nnrnOdjnk9rj6XPcNSC.hIzgpEQCZy0nVNtG','2026-11-20 05:03:59',NULL,'2026-11-13 10:33:59'),(5,4,'$2b$08$wSmQ.g/EAmLLr2xrguXuDusVfr388YwKC39tkDMJReH7woPp3hlfS','2026-11-20 05:03:59',NULL,'2026-11-13 10:33:59'),(6,5,'$2b$08$YFq4rt6tgyu5l59h3.zKFuOhp2fUpu65QcGIqQfziQ76HGYc6UK5O','2026-11-20 05:03:59',NULL,'2026-11-13 10:33:59'),(7,1,'$2b$08$Gapn9FJUmG5d8V31W1M.F.CqPMV/NFYcmLU0//hn8.ZkLe3XPSNfO','2026-11-20 05:04:19',NULL,'2026-11-13 10:34:19'),(8,1,'$2b$08$E2rmO2ipfJlouBPBI/XacevoWvzO.9SDTSPfn8lRDdVNx5t9B1pju','2026-11-20 05:06:56',NULL,'2026-11-13 10:36:56'),(9,4,'$2b$08$p7I9mSlre09qaL1PWjkAvuxmx5k6XwGthBXVs6ZFtnQVgO2jTQTX6','2026-11-20 05:07:25',NULL,'2026-11-13 10:37:25'),(10,4,'$2b$08$7BTXGCOMKhTWLuTlrlDE..mqBV8c8lrQyd5j5tzhUjK11yfmUwHHS','2026-11-20 05:13:53',NULL,'2026-11-13 10:43:53'),(11,1,'$2b$08$lH5MSYHGFaRGiGfn0WCO5eLprm5ray5CRgAqgKLShhob4ViZS7Cu.','2026-11-20 05:17:10',NULL,'2026-11-13 10:47:10'),(12,3,'$2b$08$0Vnq3kwpcuPR1rI6h5LaOu.wsglhzGrgopsHX8yjkR303rpdFsCZy','2026-11-20 05:24:19',NULL,'2026-11-13 10:54:19'),(13,1,'$2b$08$LmSMZ9CKo.f5CuRhWKtuJ..sFJzpvrhLJq/M8u555oU5dLrY1tAMq','2026-11-20 05:29:34',NULL,'2026-11-13 10:59:34'),(14,2,'$2b$08$8jHsTziUNxpjLPioBeWUiu2ZIalYYGnmZuYRTvrvoetA/Sunqk7Ca','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 11:02:33'),(15,2,'$2b$08$mD8nwoePNLps4pAKUUADzOG/4Wwc0taobOmSJNuB/lW3WCEPsDKMi','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 11:02:59'),(16,1,'$2b$08$AvqRFRPwGe0FM.nMiM7zxunJ5pGRQjahUaqHN.VBUgLqoL3zQdBbG','2026-11-20 05:41:56',NULL,'2026-11-13 11:11:56'),(17,3,'$2b$08$yldpDdMYnhv7A4jNXMw9VuregcTkYcOciEv6yTMHN0J1fA9pYL3fe','2026-11-20 05:42:05',NULL,'2026-11-13 11:12:05'),(18,4,'$2b$08$ll3KVVAQZY1Rjl8EOz97t.ozTEQfStGO4R7mrwCx.StCNjfEJdYIK','2026-11-20 05:42:14',NULL,'2026-11-13 11:12:14'),(19,2,'$2b$08$IlmjQIT8ljVoBv5aKpVpkeBRM..OrU6J/ixeLLNZ0HqKyH.DtiPoq','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 11:23:56'),(20,2,'$2b$08$5PMkzpA8snCCEoZQ0NmzxurVLed2JG1uZNCBC01rtZ09G8xGbLf/W','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 11:40:08'),(21,3,'$2b$08$t.TWTF6mXgJ4VY0wQ3SFzO.HDHh.YQDbCyrzW1FZ1X48feZAgYTVC','2026-11-20 06:38:23',NULL,'2026-11-13 12:08:23'),(22,1,'$2b$08$7FXdt.TRyQlkpLiYbQc9KuHG9p2Kfgb2Kform1810JRatyBt/Gw0K','2026-11-20 06:43:50',NULL,'2026-11-13 12:13:50'),(23,2,'$2b$08$IQURjtUE45EnLmVV5mAd5.3bGzErcV8O9nL3O8rPWjgC3wTqJQ1AO','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 12:24:57'),(24,2,'$2b$08$uN5.6TL.LLSACqIKh1a1TempqNxP9JQU0NswHYGivYKLwk8AKezWe','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 12:26:42'),(25,3,'$2b$08$17ySA7wo2xJ/fR8Gm/6JCelkrdsevgh4WFpKUytVtzQrNmJ2hBuPG','2026-11-20 07:04:18',NULL,'2026-11-13 12:34:18'),(26,4,'$2b$08$TlddaUNsoNOJ0BfTCDt04O4n92v7V0sYfAL6AqDLNbgm/jRbrBbPm','2026-11-20 07:06:17',NULL,'2026-11-13 12:36:17'),(27,5,'$2b$08$4Rt6YasHT6ugcXD8ga41mu5isCqVCAKU2RgenORsUGzbiC08YBU5m','2026-11-20 07:13:12',NULL,'2026-11-13 12:43:12'),(28,1,'$2b$08$BwVvuDheni4MS/RtfHp69OTi0qyDSkVm./600J5jaV6B33Eo0hNLG','2026-11-20 07:13:15',NULL,'2026-11-13 12:43:15'),(29,2,'$2b$08$a0Z13wYL2StQKxEje6NEm.yvYG8gXbZ2Y62JIVJ/PjGIdOS5VbLc6','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 12:43:29'),(30,1,'$2b$08$J1OJ0ifDIDrxN8uYcccS7.Gf/06TlO7d4cMXFTQZWq5vNSDqoJ0MO','2026-11-20 07:14:12',NULL,'2026-11-13 12:44:12'),(31,1,'$2b$08$hNSksJvw6UJ0a78wJyRXOO9iquqDrRXiviDZctuhEEPnNslO8SP0m','2026-11-20 07:28:22',NULL,'2026-11-13 12:58:22'),(32,2,'$2b$08$PhqTdEE57GEBq4SajEFiIObzKFfbGT1rrg0IWpY.uN4HB7J0P/V.G','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 13:10:25'),(33,1,'$2b$08$eGI3m3RkDyXJM87QKaMCi.09b8b.2Vz4tcOOY8O.hF9me5KQRviuC','2026-11-20 07:42:47',NULL,'2026-11-13 13:12:47'),(34,2,'$2b$08$KwOA18MEiRdgu1VK.TcbdeHtfB8Gwri4wRDA8S/2U5zilq0.PZjt.','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-13 13:13:03'),(35,1,'$2b$08$BkeDBrVOfbNPMTcNkoA61.L4Z5gsOhk4Al/.B.kIn.D6Aer/4C7CO','2026-11-20 07:43:56',NULL,'2026-11-13 13:13:56'),(36,1,'$2b$08$2XVDjCeOfmMs7ZHRFXghdOqSwd3Bp211XpIopCd8itwWiIfNNFkRi','2026-11-20 07:44:04',NULL,'2026-11-13 13:14:04'),(37,1,'$2b$08$nH1JBu3lAky5HRJ1lgolmuylsADuI90gmh5W5ugYvThZipEddFSdS','2026-11-20 07:47:56',NULL,'2026-11-13 13:17:56'),(38,1,'$2b$08$YPv6xdVaYslXNE8H2bK4ZuLDdB6ZBw58ecHPoo9H/wlW3NUQcIBUy','2026-11-21 03:00:14',NULL,'2026-11-14 08:30:14'),(39,1,'$2b$08$a6KGyTGwdNP/OQD5U1Cmfe2yDz/GrBukUkkBPsDQVtpl5MMttiSyu','2026-11-21 03:18:53',NULL,'2026-11-14 08:48:53'),(40,1,'$2b$08$.hE5iucHxoMUpC6qgDiev.r4CZU0oMBFMQpji.R5MEjh4Oc4gFdvi','2026-11-21 03:19:00',NULL,'2026-11-14 08:49:00'),(41,2,'$2b$08$ucoaocWoDeS1No9b75SBaeneAwDKTPvaisayvA3aj6X2aceRnOlG.','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-14 08:57:37'),(42,2,'$2b$08$Eb6U3YIYnaxDT9W8ilr8S.dKyP1rDAnsPoHvQxYCP/YJiD7iZyM/m','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-14 08:58:13'),(43,2,'$2b$08$Ldg/aucjYlYx7xEYAiGhsuTafT9Jfhys2W4d.ny66y4JU.R0gntaq','2026-11-16 04:02:17','2026-11-15 22:32:17','2026-11-16 04:01:57'),(44,1,'$2b$08$./SNVI2yzDtBaW5C0EInnuoCgp/xDcadvNygTyTnebZobbtYS8Ft2','2026-11-22 22:32:19',NULL,'2026-11-16 04:02:19'),(45,2,'$2b$08$qjqQPQzoXgdoj5.iU5.KDO5paHCt8YeEujOdoia/Gg5srhmOW9ahu','2026-11-22 23:14:55',NULL,'2026-11-16 04:44:55'),(46,2,'$2b$08$u4zckgw.PfFjkwo4vxeUfOI2YyWCDdgcy1g12uTZqEYX.0eKPW/UO','2026-11-22 23:34:33',NULL,'2026-11-16 05:04:33'),(47,2,'$2b$08$E.OUWBowK3dGVeePGhv34efno4t/AgSPLjivAXZwRMo3e695EdrRS','2026-11-22 23:34:39',NULL,'2026-11-16 05:04:39'),(48,2,'$2b$08$qulV47LAT/2MYaHuo8Z5HObu32Qpmo0yE8n9Xtyd6N7aGy1xrhkdW','2026-11-22 23:34:44',NULL,'2026-11-16 05:04:44');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rfq_items`
--

DROP TABLE IF EXISTS `rfq_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rfq_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `rfq_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_id` bigint(20) NOT NULL,
  `target_rate` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rfq_item_idx` (`rfq_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rfq_items`
--

LOCK TABLES `rfq_items` WRITE;
/*!40000 ALTER TABLE `rfq_items` DISABLE KEYS */;
INSERT INTO `rfq_items` VALUES (1,1,1,200.000,1,380.00),(2,1,3,5.000,2,58000.00);
/*!40000 ALTER TABLE `rfq_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rfq_quotation_items`
--

DROP TABLE IF EXISTS `rfq_quotation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rfq_quotation_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `quotation_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_rate` decimal(12,2) NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `taxable_amount` decimal(14,2) NOT NULL,
  `gst_rate` varchar(10) NOT NULL,
  `cgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `sgst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `igst_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `quote_item_idx` (`quotation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rfq_quotation_items`
--

LOCK TABLES `rfq_quotation_items` WRITE;
/*!40000 ALTER TABLE `rfq_quotation_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `rfq_quotation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rfq_quotations`
--

DROP TABLE IF EXISTS `rfq_quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rfq_quotations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `rfq_id` bigint(20) NOT NULL,
  `vendor_id` bigint(20) NOT NULL,
  `quotation_ref` varchar(100) DEFAULT NULL,
  `quotation_date` timestamp NULL DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `payment_terms` varchar(255) DEFAULT NULL,
  `delivery_lead_time_days` int(11) DEFAULT NULL,
  `is_lowest` tinyint(1) NOT NULL DEFAULT 0,
  `is_awarded` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('received','accepted','rejected') NOT NULL DEFAULT 'received',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rfq_quotations_uuid_unique` (`uuid`),
  KEY `rfq_quote_idx` (`rfq_id`),
  KEY `rfq_quote_vendor_idx` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rfq_quotations`
--

LOCK TABLES `rfq_quotations` WRITE;
/*!40000 ALTER TABLE `rfq_quotations` DISABLE KEYS */;
INSERT INTO `rfq_quotations` VALUES (1,'04622d29-98f4-453d-9aad-0582d28279d6',1,1,'KT/QTN/2026/0442','2026-11-13 05:52:59',364500.00,73710.00,438210.00,'30 Days Net',2,1,1,'accepted','L1 Lowest bidder. Verified BIS batch test certificates attached.','2026-11-13 11:22:59'),(2,'13b5bd23-cdea-4128-a6b3-3342865eab97',1,3,'AMB/MUM/8821','2026-11-13 05:52:59',372000.00,75480.00,447480.00,'15 Days Net',4,0,0,'received','Higher quote by ₹9,270.00.','2026-11-13 11:22:59');
/*!40000 ALTER TABLE `rfq_quotations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rfqs`
--

DROP TABLE IF EXISTS `rfqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rfqs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `rfq_number` varchar(50) NOT NULL,
  `indent_id` bigint(20) DEFAULT NULL,
  `site_id` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `deadline_date` timestamp NULL DEFAULT NULL,
  `status` enum('draft','sent','quotations_received','evaluated','po_created','closed') NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `rfqs_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_rfq_no_idx` (`tenant_id`,`rfq_number`),
  KEY `rfq_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rfqs`
--

LOCK TABLES `rfqs` WRITE;
/*!40000 ALTER TABLE `rfqs` DISABLE KEYS */;
INSERT INTO `rfqs` VALUES (1,'46ae7124-d52e-46a4-ac33-786ee74f96ca',1,'KB/RFQ/26-27/0001',1,1,'RFQ for OPC 53 Grade Cement & TMT Rebar Fe550D - Kings Heights',NULL,'evaluated','Payment terms 30 days credit. Lowest rate (L1) with verified BIS certification will be awarded.','2026-11-13 11:22:59','2026-11-13 11:22:59');
/*!40000 ALTER TABLE `rfqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint(20) NOT NULL,
  `permission_id` bigint(20) NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),(1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27),(1,28),(1,29),(1,30),(1,31),(1,32),(1,33),(1,34),(1,35),(1,36),(1,37),(1,38),(1,39),(1,40),(1,41),(1,42),(1,43),(1,44),(1,45),(1,46),(1,47),(1,48),(1,49),(1,50),(1,51),(1,52),(1,53),(1,54),(1,55),(1,56),(1,57),(1,58),(1,59),(1,60),(1,61),(2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),(2,11),(2,12),(2,13),(2,14),(2,15),(2,16),(2,17),(2,18),(2,19),(2,20),(2,21),(2,22),(2,23),(2,24),(2,25),(2,26),(2,27),(2,28),(2,29),(2,30),(2,31),(2,32),(2,33),(2,34),(2,35),(2,36),(2,37),(2,38),(2,39),(2,40),(2,41),(2,42),(2,43),(2,44),(2,45),(2,46),(2,47),(2,48),(2,49),(2,50),(2,51),(2,52),(2,53),(2,54),(2,55),(2,56),(2,57),(2,58),(2,59),(2,60),(2,61),(3,10),(3,11),(3,12),(3,13),(3,14),(3,15),(3,16),(3,17),(3,18),(3,19),(3,20),(3,21),(3,22),(3,23),(3,24),(3,39),(3,40),(3,41),(3,42),(4,1),(4,2),(4,3),(4,4),(4,5),(4,6),(4,7),(4,8),(4,9),(4,21),(4,22),(4,23),(4,24),(4,25),(4,26),(4,27),(4,28),(4,43),(5,1),(5,10),(5,16);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_role_code_idx` (`tenant_id`,`code`),
  KEY `role_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'c5c32679-d1ee-4a98-8d29-4b3166f0bbde',1,'Owner / Boss','boss','Complete executive control, final approvals, audit and all reports',1,'2026-11-13 10:21:40','2026-11-13 10:21:40'),(2,'10b332dd-b90f-410e-9241-b329f60e14e0',1,'Administrator','admin','Tenant management, users, roles, masters, and configuration',1,'2026-11-13 10:21:40','2026-11-13 10:21:40'),(3,'e06462a1-f459-416d-a2e7-6d408f5644fe',1,'Store Keeper','store','GRN inspection, inventory management, material issues and transfers',1,'2026-11-13 10:21:40','2026-11-13 10:21:40'),(4,'395eee4b-b6d5-4fc6-91a8-2dc2bb18797e',1,'Purchase Officer','purchase','Indents, RFQs, vendor quotations, and Purchase Orders',1,'2026-11-13 10:21:40','2026-11-13 10:21:40'),(5,'cde10221-82c7-4c1b-a9fe-d10ca42c7c91',1,'Site Manager','sitemgr','Site indents, material receipt at site, site-level consumption',1,'2026-11-13 10:21:40','2026-11-13 10:21:40');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sites`
--

DROP TABLE IF EXISTS `sites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sites` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `client_name` varchar(255) DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) DEFAULT 'Mumbai',
  `state_code` varchar(2) DEFAULT '27',
  `pincode` varchar(10) DEFAULT NULL,
  `status` enum('planning','active','on_hold','completed') NOT NULL DEFAULT 'active',
  `start_date` timestamp NULL DEFAULT NULL,
  `target_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sites_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_site_code_idx` (`tenant_id`,`code`),
  KEY `site_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sites`
--

LOCK TABLES `sites` WRITE;
/*!40000 ALTER TABLE `sites` DISABLE KEYS */;
INSERT INTO `sites` VALUES (1,'51c97714-dcec-4132-b1fb-87d0303f4a2c',1,'SITE-KH','Kings Heights Tower A & B','Kings Real Estate LLP','Plot 42, Lokhandwala Complex, Andheri West','Mumbai','27','400053','active',NULL,NULL,'2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(2,'371bc854-b363-4bc4-9576-273d08641f72',1,'SITE-RP','Royal Palm Luxury Residences','Kings Developers Ltd','Near Gokuldham, Goregaon East','Mumbai','27','400063','active',NULL,NULL,'2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(3,'50ccafd1-c5b1-4e4a-b288-42f1362015f2',1,'SITE-KC','Kings Crown Villa Estate','Private HNI Clients','Tungarli Hills, Old Mumbai-Pune Road','Lonavala','27','410401','active',NULL,NULL,'2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(4,'16495ebd-ecca-4df4-aa10-92b2bfb84075',1,'SITE-PR','Palm Residency Heights','Kings Infratech','Ghopdeo Road, Majiwada Junction','Thane West','27','400601','active',NULL,NULL,'2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(5,'1c55441d-fa48-43e4-b847-df53453c78bd',1,'SITE-CH','Kings Commercial Hub','Kings Corporate Park','G Block, Bandra Kurla Complex (BKC)','Mumbai','27','400051','active',NULL,NULL,'2026-11-13 10:56:57','2026-11-13 10:56:57',NULL);
/*!40000 ALTER TABLE `sites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_balances`
--

DROP TABLE IF EXISTS `stock_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_balances` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) NOT NULL,
  `warehouse_id` bigint(20) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `quantity` decimal(12,3) NOT NULL DEFAULT 0.000,
  `weighted_avg_rate` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_value` decimal(14,2) NOT NULL DEFAULT 0.00,
  `last_movement_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `wh_item_unique_idx` (`warehouse_id`,`item_id`),
  KEY `stock_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_balances`
--

LOCK TABLES `stock_balances` WRITE;
/*!40000 ALTER TABLE `stock_balances` DISABLE KEYS */;
INSERT INTO `stock_balances` VALUES (1,1,2,1,19,5.000,650.00,3250.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(2,1,2,1,20,5.000,650.00,3250.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(3,1,2,1,21,5.000,120.00,600.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(4,1,2,1,22,5.000,180.00,900.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(5,1,2,1,23,5.000,400.00,2000.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(6,1,2,1,24,20.000,10.00,200.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(7,1,2,1,25,10.000,80.00,800.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(8,1,2,1,26,5.000,145.00,725.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(9,1,2,1,27,5.000,130.00,650.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(10,1,2,1,28,5.000,50.00,250.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(11,1,2,1,29,10.000,75.00,750.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(12,1,2,1,30,5.000,120.00,600.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(13,1,2,1,31,5.000,50.00,250.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(14,1,2,1,32,10.000,10.00,100.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(15,1,2,1,33,5.000,280.00,1400.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(16,1,2,1,34,10.000,10.00,100.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(17,1,2,1,35,5.000,120.00,600.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(18,1,2,1,36,10.000,120.00,1200.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(19,1,2,1,37,5.000,20.00,100.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(20,1,2,1,38,10.000,55.00,550.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(21,1,2,1,39,100.000,12.00,1200.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(22,1,2,1,40,34.000,15.00,510.00,'2026-11-13 12:36:26','2026-11-13 12:36:26'),(23,1,3,2,3,7.000,58500.00,409500.00,'2026-11-13 12:36:26','2026-11-13 12:36:27'),(24,1,3,2,4,6.000,58500.00,351000.00,'2026-11-13 12:36:26','2026-11-13 12:36:27');
/*!40000 ALTER TABLE `stock_balances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_ledger`
--

DROP TABLE IF EXISTS `stock_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_ledger` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) NOT NULL,
  `warehouse_id` bigint(20) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `item_id` bigint(20) NOT NULL,
  `movement_type` enum('grn_inward','site_issue','transfer_out','transfer_in','return_in','scrap_out','stock_adjust') NOT NULL,
  `reference_type` varchar(50) NOT NULL,
  `reference_id` bigint(20) NOT NULL,
  `reference_number` varchar(50) NOT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `balance_after` decimal(12,3) NOT NULL,
  `unit_rate` decimal(12,2) NOT NULL,
  `total_value` decimal(14,2) NOT NULL,
  `performed_by_id` bigint(20) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ledger_tenant_idx` (`tenant_id`),
  KEY `ledger_wh_item_idx` (`warehouse_id`,`item_id`),
  KEY `ledger_ref_idx` (`reference_type`,`reference_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_ledger`
--

LOCK TABLES `stock_ledger` WRITE;
/*!40000 ALTER TABLE `stock_ledger` DISABLE KEYS */;
INSERT INTO `stock_ledger` VALUES (1,1,2,1,19,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,650.00,3250.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(2,1,2,1,20,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,650.00,3250.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(3,1,2,1,21,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,120.00,600.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(4,1,2,1,22,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,180.00,900.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(5,1,2,1,23,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,400.00,2000.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(6,1,2,1,24,'grn_inward','GRN',1,'KB/GRN/26-27/0001',20.000,20.000,10.00,200.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(7,1,2,1,25,'grn_inward','GRN',1,'KB/GRN/26-27/0001',10.000,10.000,80.00,800.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(8,1,2,1,26,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,145.00,725.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(9,1,2,1,27,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,130.00,650.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(10,1,2,1,28,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,50.00,250.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(11,1,2,1,29,'grn_inward','GRN',1,'KB/GRN/26-27/0001',10.000,10.000,75.00,750.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(12,1,2,1,30,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,120.00,600.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(13,1,2,1,31,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,50.00,250.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(14,1,2,1,32,'grn_inward','GRN',1,'KB/GRN/26-27/0001',10.000,10.000,10.00,100.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(15,1,2,1,33,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,280.00,1400.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(16,1,2,1,34,'grn_inward','GRN',1,'KB/GRN/26-27/0001',10.000,10.000,10.00,100.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(17,1,2,1,35,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,120.00,600.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(18,1,2,1,36,'grn_inward','GRN',1,'KB/GRN/26-27/0001',10.000,10.000,120.00,1200.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(19,1,2,1,37,'grn_inward','GRN',1,'KB/GRN/26-27/0001',5.000,5.000,20.00,100.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(20,1,2,1,38,'grn_inward','GRN',1,'KB/GRN/26-27/0001',10.000,10.000,55.00,550.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(21,1,2,1,39,'grn_inward','GRN',1,'KB/GRN/26-27/0001',100.000,100.000,12.00,1200.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(22,1,2,1,40,'grn_inward','GRN',1,'KB/GRN/26-27/0001',34.000,34.000,15.00,510.00,3,'Store inward against PO KB/PO/26-27/0001 & Challan CH-KT-2026-9041','2026-11-13 12:36:26'),(23,1,3,2,3,'grn_inward','GRN',2,'KB/GRN/26-27/0002',10.000,10.000,58500.00,585000.00,3,'TMT Rebar delivery against PO KB/PO/26-27/0002 & Truck GJ-06-AX-8912','2026-11-13 12:36:26'),(24,1,3,2,4,'grn_inward','GRN',2,'KB/GRN/26-27/0002',10.000,10.000,58500.00,585000.00,3,'TMT Rebar delivery against PO KB/PO/26-27/0002 & Truck GJ-06-AX-8912','2026-11-13 12:36:26'),(25,1,3,2,3,'site_issue','ISSUE',1,'KB/ISS/26-27/0001',-3.000,7.000,58500.00,175500.00,3,'Issued to Sharma Civil Construction & RCC Works for 5th floor slab','2026-11-13 12:36:27'),(26,1,3,2,4,'site_issue','ISSUE',1,'KB/ISS/26-27/0001',-4.000,6.000,58500.00,234000.00,3,'Issued to Sharma Civil Construction & RCC Works for 5th floor slab','2026-11-13 12:36:27');
/*!40000 ALTER TABLE `stock_ledger` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenants` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `status` enum('trial','active','suspended','cancelled') NOT NULL DEFAULT 'active',
  `plan` varchar(50) NOT NULL DEFAULT 'enterprise',
  `gstin` varchar(15) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `state_code` varchar(2) DEFAULT '27',
  `address` text DEFAULT NULL,
  `logo_url` text DEFAULT NULL,
  `primary_color` varchar(20) DEFAULT '#c5a04e',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `tagline` varchar(255) DEFAULT 'Builders & Developers',
  `mfa_enabled` tinyint(1) DEFAULT 0,
  `branding` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenants_uuid_unique` (`uuid`),
  UNIQUE KEY `tenants_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'a04614ff-bc84-4c74-84f0-2fa79148b6cd','Kings Builders & Developers','kings','active','enterprise','27AABCK1234F1Z5','AABCK1234F','27','Kings Tower, Off S.V. Road, Andheri West, Mumbai, Maharashtra 400058','/assets/kings-logo.svg','#c5a04e','2026-11-13 10:21:40','2026-11-13 10:21:40',NULL,'Builders & Developers',0,NULL);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `units` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `code` varchar(20) NOT NULL,
  `symbol` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `units_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_unit_code_idx` (`tenant_id`,`code`),
  KEY `unit_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'f15aa5f0-628a-4140-89b0-4a0c39276807',1,'Bags','BAG','bag','2026-11-13 10:56:57','2026-11-13 10:56:57'),(2,'14ccf3f7-73e0-48af-a544-985a356a247b',1,'Metric Ton','MT','mt','2026-11-13 10:56:57','2026-11-13 10:56:57'),(3,'b0c07201-9855-4a26-912f-6ea3004197d1',1,'Kilograms','KG','kg','2026-11-13 10:56:57','2026-11-13 10:56:57'),(4,'b5527d3d-a376-43c6-89be-62f550c8dbc9',1,'Litres','LTR','ltr','2026-11-13 10:56:57','2026-11-13 10:56:57'),(5,'87253257-2a17-46fe-b214-d396e973c5ac',1,'Pieces','PCS','pcs','2026-11-13 10:56:57','2026-11-13 10:56:57'),(6,'d22c9cd2-a7e7-4df9-80de-7848340cbd77',1,'Square Feet','SQFT','sq.ft','2026-11-13 10:56:57','2026-11-13 10:56:57'),(7,'d403408b-ac14-4e7d-9bec-548278fe7b06',1,'Running Feet','RFT','rft','2026-11-13 10:56:57','2026-11-13 10:56:57'),(8,'4ff89d12-9f97-4fab-aff8-e52db9248b4f',1,'Brass / Trip','TRIP','brass','2026-11-13 10:56:57','2026-11-13 10:56:57');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sites`
--

DROP TABLE IF EXISTS `user_sites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_sites` (
  `user_id` bigint(20) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  PRIMARY KEY (`user_id`,`site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sites`
--

LOCK TABLES `user_sites` WRITE;
/*!40000 ALTER TABLE `user_sites` DISABLE KEYS */;
INSERT INTO `user_sites` VALUES (5,1),(5,2),(5,3),(5,4),(5,5);
/*!40000 ALTER TABLE `user_sites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) DEFAULT NULL,
  `role_id` bigint(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive','locked') NOT NULL DEFAULT 'active',
  `avatar_url` text DEFAULT NULL,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `totp_secret` varchar(128) DEFAULT NULL,
  `totp_enabled` tinyint(1) DEFAULT 0,
  `backup_codes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_username_idx` (`tenant_id`,`username`),
  UNIQUE KEY `tenant_email_idx` (`tenant_id`,`email`),
  KEY `user_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'231afdac-95f4-47dc-ab00-e80e73144816',1,1,'vikram.singh@kingsbuilders.in','boss','$2b$10$weobwRy5TMP.Z3fIUyBYyuAT6JhMZ0LaBRmU2hTTBC5OKTq5wwRwy','Vikram Singh','+91 98200 11111','active',NULL,0,NULL,'2026-11-15 22:32:19','2026-11-13 10:21:40','2026-11-16 04:02:19',NULL,NULL,0,NULL),(2,'ed38372e-91db-4d7d-855d-01bbf0407c91',1,2,'rajesh.sharma@kingsbuilders.in','admin','$2b$10$qLpoaq7J2mIByOW9tjBZt.g5bnx.ro/Ig.g8PvMmN67mpZz5JZevy','Rajesh Sharma','+91 98200 22222','active',NULL,0,NULL,'2026-11-15 23:34:44','2026-11-13 10:21:40','2026-11-16 05:04:44',NULL,NULL,0,NULL),(3,'17eb2f9f-159c-4873-8ee1-33aa1241415c',1,3,'suresh.patel@kingsbuilders.in','store','$2b$10$ynTmz7ZR1NveKpeBMmH30uWBKbcFodeUFLc7lFWbQKaAxwF0xK7ki','Suresh Patel','+91 98200 33333','active',NULL,0,NULL,'2026-11-13 07:04:18','2026-11-13 10:21:40','2026-11-13 12:34:18',NULL,NULL,0,NULL),(4,'c2e2c39c-eb20-459e-9b75-ddbd41fadaf9',1,4,'priya.verma@kingsbuilders.in','purchase','$2b$10$t0C.STQIL5UCl4HovYOzTu.BsZUX8wZrwZusyrxXILHBDCQBEI2.q','Priya Verma','+91 98200 44444','active',NULL,0,NULL,'2026-11-13 07:06:17','2026-11-13 10:21:40','2026-11-13 12:36:17',NULL,NULL,0,NULL),(5,'a4668658-22ea-414b-b294-970147c8e40a',1,5,'amit.kumar@kingsbuilders.in','sitemgr','$2b$10$bIN.sVdt/QiIrsoq5aFGze2JsOAEWPtRHvBG9eL/zU.YIClqQHa0q','Amit Kumar','+91 98200 55555','active',NULL,0,NULL,'2026-11-13 07:13:12','2026-11-13 10:21:41','2026-11-13 12:43:12',NULL,NULL,0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendors` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `state_code` varchar(2) NOT NULL DEFAULT '27',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `bank_account_no` varchar(50) DEFAULT NULL,
  `bank_ifsc` varchar(20) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT '30 Days Credit',
  `rating` decimal(3,2) DEFAULT 5.00,
  `status` enum('active','inactive','blacklisted') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendors_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_vendor_code_idx` (`tenant_id`,`code`),
  KEY `vendor_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (1,'5141eb3e-3414-443b-8bdc-ba2fa2cb85f0',1,'VEN-KHETESHWAR','KHETESHWAR TRADING','Mr. Kheteshwar','kheteshwertrading1008@gmail.com','9967641843','27ADWPR7846J1ZF','ADWPR7846J','27','Plot NO. A - 21, Janta Market Sector - 23, Turbhe Navi Mumbai 400 705','Mumbai',NULL,'G.P.PARSIK BANK LTD (BRANCH: SANPADA)','013013600000022','PJSB0000014','30 Days Credit',4.80,'active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(2,'4dd84b03-44c7-4670-a0b3-282db04261c9',1,'VEN-ULTRATECH','UltraTech Cement Limited','Karan Mehra','sales.mumbai@ultratechcement.com','+91 98201 55501','27AAACU3456K1Z9','AAACU3456K','27','Ahura Centre, Mahakali Caves Road, Andheri East, Mumbai 400093','Mumbai',NULL,'HDFC Bank Ltd','50200011223344','HDFC0000123','30 Days Credit',4.80,'active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(3,'004b9437-9c9c-4741-9650-86d0b3dd96c4',1,'VEN-TATATISCON','Tata Tiscon Steel Distributors','Ramesh Gupta','orders@tatasurajsteel.com','+91 98202 66602','27AABCT2345H1Z3','AABCT2345H','27','Steel Market Yard, Kalamboli, Navi Mumbai 410218','Mumbai',NULL,'State Bank of India','30998877665','SBIN0004567','30 Days Credit',4.80,'active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(4,'1fd1034f-01e8-4e17-9003-5e044f84e916',1,'VEN-MAHALAXMI','Mahalaxmi Sand & Aggregate Suppliers','Mahesh Jadhav','mahalaxmi.aggregates@gmail.com','+91 98203 77703','27AAHPM9876C1Z1','AAHPM9876C','27','Old Panvel Naka, Panvel, Navi Mumbai 410206','Mumbai',NULL,'Bank of Baroda','04560100012345','BARB0PANVEL','30 Days Credit',4.80,'active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(5,'e869e5c4-da6e-45a6-9697-a79c48b04481',1,'VEN-SUPREME','Supreme Industries Plumbing Division','Sunil Shinde','pipes.west@supreme.co.in','+91 98204 88804','27AAACS1234D1Z8','AAACS1234D','27','1161 Solitaire Corporate Park, Andheri-Ghatkopar Link Road, Mumbai','Mumbai',NULL,'ICICI Bank','001105012345','ICIC0000011','30 Days Credit',4.80,'active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(6,'c2139a76-6531-4d09-b0f3-c0b43e2bbba7',1,'VEN-POLYCAB','Polycab Electricals & Cables Ltd','Deepak Shah','commercial@polycabcables.com','+91 98205 99905','27AAACP5678B1Z6','AAACP5678B','27','Polycab House, 771 Mogul Lane, Mahim, Mumbai 400016','Mumbai',NULL,'Axis Bank','912020034567890','UTIB0000045','30 Days Credit',4.80,'active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(7,'5ae36e81-8dde-430e-8720-6decd7c506db',1,'VEN-ASIANPAINTS','Asian Paints Commercial Projects','Sameer Kulkarni','mumbai.projectsales@asianpaints.com','+91 98206 11106','27AAACA1111A1Z2','AAACA1111A','27','6A Shantinagar, Santacruz East, Mumbai 400055','Mumbai',NULL,'Kotak Mahindra Bank','09876543210','KKBK0000123','30 Days Credit',4.80,'active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL),(8,'99b2b806-5c15-44f2-9aa0-02f4b248c6fe',1,'VEN-INTERSTATE-STEEL','Jindal Steel & Power Ltd (Inter-State)','Pradeep Goyal','gujarat.sales@jindalsteel.com','+91 98207 22207','24AAACJ5678Q1Z4','AAACJ5678Q','24','GIDC Industrial Estate, Vadodara, Gujarat 390010','Mumbai',NULL,'Punjab National Bank','1234002100054321','PUNB0123400','30 Days Credit',4.80,'active','2026-11-13 10:56:57','2026-11-13 10:56:57',NULL);
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `warehouses` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `site_id` bigint(20) DEFAULT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` text DEFAULT NULL,
  `is_central` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `warehouses_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_wh_code_idx` (`tenant_id`,`code`),
  KEY `wh_tenant_idx` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,'e2502c93-a11e-4bc3-9b56-9f2334e7273e',1,NULL,'WH-CENTRAL','Central Warehouse & Logistics Hub','Plot 18, MIDC Industrial Area, Andheri East, Mumbai',1,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(2,'1c595cf3-f324-4a43-a2d8-8a6a1e0c78b2',1,1,'WH-KH','Kings Heights Site Store','Kings Heights Site Basement 1, Andheri West',0,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(3,'5c6337b6-ab7c-4e66-bda7-eb5371a2fd19',1,2,'WH-RP','Royal Palm Site Store','Royal Palm Compound, Goregaon East',0,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(4,'f5924b6b-4c6c-408e-a557-8ccc58cf267f',1,3,'WH-KC','Kings Crown Villa Store','Villa Site Gate No. 2, Lonavala',0,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(5,'e721d41b-68e0-4fe7-aefc-f730520628f5',1,4,'WH-PR','Palm Residency Site Store','Palm Residency Gate 1, Majiwada Thane',0,'active','2026-11-13 10:56:57','2026-11-13 10:56:57'),(6,'1a373f1e-9bf9-4747-9095-68ba7bb1a6b7',1,5,'WH-CH','Commercial Hub Store','Commercial Hub Basement 2, BKC Mumbai',0,'active','2026-11-13 10:56:57','2026-11-13 10:56:57');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wo_items`
--

DROP TABLE IF EXISTS `wo_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wo_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `wo_id` bigint(20) NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `unit_code` varchar(20) NOT NULL,
  `estimated_qty` decimal(12,3) NOT NULL,
  `executed_qty` decimal(12,3) NOT NULL DEFAULT 0.000,
  `rate` decimal(12,2) NOT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `wo_item_idx` (`wo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wo_items`
--

LOCK TABLES `wo_items` WRITE;
/*!40000 ALTER TABLE `wo_items` DISABLE KEYS */;
INSERT INTO `wo_items` VALUES (4,2,'RCC-M25-SLAB','M25 grade machine mixed concrete placement in slab & beams','CUM',1200.000,80.000,1500.00,1800000.00),(5,2,'SHUTTERING-PLY','Plywood shuttering & staging with steel props for slab & columns','SQFT',15000.000,1000.000,120.00,1800000.00),(6,2,'STEEL-BINDING','Cutting, bending, shifting & tying of Fe 550D TMT rebar','MT',150.000,7.000,6000.00,900000.00);
/*!40000 ALTER TABLE `wo_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `tenant_id` bigint(20) NOT NULL,
  `wo_number` varchar(50) NOT NULL,
  `contractor_id` bigint(20) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `contract_type` enum('item_rate','lump_sum') NOT NULL DEFAULT 'item_rate',
  `start_date` timestamp NULL DEFAULT NULL,
  `completion_date` timestamp NULL DEFAULT NULL,
  `contract_value` decimal(14,2) NOT NULL,
  `retention_percent` decimal(5,2) NOT NULL DEFAULT 5.00,
  `tds_percent` decimal(5,2) NOT NULL DEFAULT 1.00,
  `status` enum('draft','active','completed','terminated') NOT NULL DEFAULT 'active',
  `scope_of_work` text DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `created_by_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_orders_uuid_unique` (`uuid`),
  UNIQUE KEY `tenant_wo_no_idx` (`tenant_id`,`wo_number`),
  KEY `wo_tenant_idx` (`tenant_id`),
  KEY `wo_contractor_idx` (`contractor_id`),
  KEY `wo_site_idx` (`site_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_orders`
--

LOCK TABLES `work_orders` WRITE;
/*!40000 ALTER TABLE `work_orders` DISABLE KEYS */;
INSERT INTO `work_orders` VALUES (2,'0fd3abd9-58fe-4bc9-8998-d70cbfa222c3',1,'KB/WO/26-27/0001',1,2,'RCC Structure & Framing Package for Tower B (G+18 Floors)','item_rate','2026-11-13 07:17:50','2027-05-12 07:17:50',4500000.00,5.00,1.00,'active','Complete civil RCC framework execution including column casting, shuttering, rebar fabrication and concrete placement.','1. Retention 5% deductible from all RA bills and released 6 months after snagging.\n2. TDS 1% deducted under Section 194C.\n3. Steel & Cement supplied free of cost by developer with 2% permissible wastage.\n4. Bi-weekly RA bill cycle.',1,'2026-11-13 12:47:50','2026-11-13 12:47:50');
/*!40000 ALTER TABLE `work_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'builderp'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-16 10:41:05
