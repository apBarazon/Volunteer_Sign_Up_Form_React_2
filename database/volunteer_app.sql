-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: volunteer_app
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
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'e2e-1790494064037@example.com','$2b$12$o9.0CvaZnHcPcDMQKb6v..w2luiiG3PqlbYN/upG4jAyXfC29pNBS','2026-09-27 07:27:45'),(2,'e2e-1790494173791@example.com','$2b$12$obwMt6c7DvUPeY.h0G5nKubR0EUMNfSEPJ5M5qWznikeCr6pspaka','2026-09-27 07:29:34'),(3,'e2e-1790494338647@example.com','$2b$12$2G73c5RFrznOjL3lyGmQa.uYP5Q/gGB4fllXUyF3tkiOYkM0i8SlG','2026-09-27 07:32:19'),(4,'e2e-1790494387683@example.com','$2b$12$RkYI26oDGoAU/OAHp5/JbOngY.oSUM8DiboUMzG6tNUGuVlpvFeEO','2026-09-27 07:33:08'),(5,'e2e-1790494431843@example.com','$2b$12$uQlGOggODS8gU3S938D1AOQOxvqXhTmVcQlBiy20uj2pOnhdbFtCG','2026-09-27 07:33:53'),(6,'e2e-1790494472715@example.com','$2b$12$AGT5vqGm200FNE3Dzq9wvuEVq7IASnfJSYm55Qik6Du6N15uysAEC','2026-09-27 07:34:33'),(7,'e2e-1790494522734@example.com','$2b$12$BxCIfA.jkimVGPeXQwfLH.lXWqBpO4wuXXzAwV1qC1eB0RQExOl06','2026-09-27 07:35:24'),(8,'e2e-1790494603750@example.com','$2b$12$EEX2cYjXD0CSkjKYYVz0s.ZaTmL53G.XMGsCY887zZmOGjyd/qgRm','2026-09-27 07:36:45'),(9,'e2e-1790495024427@example.com','$2b$12$elX4s0zPi2pcJrZV146taO9GGD90xQYZDDV9TQetG.cOvRX7laYOa','2026-09-27 07:43:46');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `location` varchar(150) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Community Beach & Park Cleanup','Help clean up trash, plastic, and debris along the shoreline.','2026-10-15','Baywalk Seaside Promenade',25,'2026-09-27 07:09:49'),(2,'Community Food Pantry Distribution','Sorting, packing, and handing out grocery bags to local families in need.','2026-10-22','Central Community Hall',15,'2026-09-27 07:09:49'),(3,'Senior Center Digital Literacy Workshop','Assist elderly community members with smartphones, video calling, and computers.','2026-10-29','Public Library Tech Lab',10,'2026-09-27 07:09:49'),(4,'Community Beach & Park Cleanup','Help clean up trash, plastic, and debris along the shoreline.','2026-10-15','Baywalk Seaside Promenade',25,'2026-09-27 07:09:49'),(5,'Community Food Pantry Distribution','Sorting, packing, and handing out grocery bags to local families in need.','2026-10-22','Central Community Hall',15,'2026-09-27 07:09:49'),(6,'Senior Center Digital Literacy Workshop','Assist elderly community members with smartphones, video calling, and computers.','2026-10-29','Public Library Tech Lab',10,'2026-09-27 07:09:49');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `signups`
--

DROP TABLE IF EXISTS `signups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `signups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `volunteer_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  `signed_up_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `signups_volunteer_id_event_id` (`volunteer_id`,`event_id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `signups_ibfk_1` FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `signups_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `signups`
--

LOCK TABLES `signups` WRITE;
/*!40000 ALTER TABLE `signups` DISABLE KEYS */;
/*!40000 ALTER TABLE `signups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `volunteer_id` int(11) DEFAULT NULL,
  `account_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `availability` text NOT NULL,
  `experience` text DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `heard_about` varchar(100) DEFAULT NULL,
  `agree_terms` tinyint(1) NOT NULL DEFAULT 0,
  `submitted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `volunteer_id` (`volunteer_id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`volunteer_id`) REFERENCES `volunteers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,3,'Automation','Tester','e2e-1790494338647@example.com','55512345678',25,'Springfield','[\"Mon-Morning\"]','Automated end-to-end test submission.','[]','School / University',1,'2026-09-27 07:32:20'),(2,1,4,'Automation','Tester','e2e-1790494387683@example.com','55512345678',25,'Springfield','[\"Mon-Morning\"]','Automated end-to-end test submission.','[]','School / University',1,'2026-09-27 07:33:09'),(3,1,5,'Automation','Tester','e2e-1790494431843@example.com','55512345678',25,'Springfield','[\"Mon-Morning\"]','Automated end-to-end test submission.','[]','School / University',1,'2026-09-27 07:33:53'),(4,1,6,'Automation','Tester','e2e-1790494472715@example.com','55512345678',25,'Springfield','[\"Mon-Morning\"]','Automated end-to-end test submission.','[]','School / University',1,'2026-09-27 07:34:34'),(5,1,7,'Automation','Tester','e2e-1790494522734@example.com','55512345678',25,'Springfield','[\"Mon-Morning\"]','Automated end-to-end test submission.','[]','School / University',1,'2026-09-27 07:35:24'),(6,1,8,'Automation','Tester','e2e-1790494603750@example.com','55512345678',25,'Springfield','[\"Mon-Morning\"]','Automated end-to-end test submission.','[]','School / University',1,'2026-09-27 07:36:45'),(7,1,9,'Automation','Tester','e2e-1790495024427@example.com','55512345678',25,'Springfield','[\"Mon-Morning\"]','Automated end-to-end test submission.','[]','School / University',1,'2026-09-27 07:43:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `volunteers`
--

DROP TABLE IF EXISTS `volunteers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `volunteers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `spots_left` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `volunteers`
--

LOCK TABLES `volunteers` WRITE;
/*!40000 ALTER TABLE `volunteers` DISABLE KEYS */;
INSERT INTO `volunteers` VALUES (1,'Community Tutor','Education','Assist children and teens with after-school reading, mathematics, and general study support.',5,'2026-09-27 07:09:49'),(2,'Tree Planting & Clean-up','Environment','Join weekend local reforestation and neighborhood waste-reduction campaigns.',25,'2026-09-27 07:09:49'),(3,'Food Drive Logistics','Outreach','Help organize, pack, and distribute care packages and meals to families in need.',8,'2026-09-27 07:09:49');
/*!40000 ALTER TABLE `volunteers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'volunteer_app'
--

--
-- Dumping routines for database 'volunteer_app'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-27 15:47:09
