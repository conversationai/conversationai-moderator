-- MySQL dump 10.13  Distrib 8.0.22, for Linux (x86_64)
--
-- Host: localhost    Database: os_moderator_schema_test_migrations
-- ------------------------------------------------------
-- Server version	8.0.22-0ubuntu0.20.04.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `SequelizeMeta_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `articles`
--

DROP TABLE IF EXISTS `articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sourceId` char(255) NOT NULL,
  `title` char(255) NOT NULL,
  `text` longtext NOT NULL,
  `isAutoModerated` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `url` char(255) NOT NULL,
  `extra` json DEFAULT NULL,
  `categoryId` int unsigned DEFAULT NULL,
  `unprocessedCount` int unsigned NOT NULL DEFAULT '0',
  `unmoderatedCount` int unsigned NOT NULL DEFAULT '0',
  `moderatedCount` int unsigned NOT NULL DEFAULT '0',
  `sourceCreatedAt` datetime DEFAULT NULL,
  `highlightedCount` int unsigned NOT NULL DEFAULT '0',
  `approvedCount` int unsigned NOT NULL DEFAULT '0',
  `rejectedCount` int unsigned NOT NULL DEFAULT '0',
  `deferredCount` int unsigned NOT NULL DEFAULT '0',
  `flaggedCount` int unsigned NOT NULL DEFAULT '0',
  `batchedCount` int unsigned NOT NULL DEFAULT '0',
  `allCount` int unsigned NOT NULL DEFAULT '0',
  `ownerId` int unsigned DEFAULT NULL,
  `lastModeratedAt` datetime DEFAULT NULL,
  `isCommentingEnabled` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sourceId_index` (`sourceId`),
  KEY `categoryId` (`categoryId`),
  KEY `ownerId` (`ownerId`),
  CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `articles_ibfk_2` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
/*!40000 ALTER TABLE `articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` char(255) NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `extra` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unprocessedCount` int unsigned NOT NULL DEFAULT '0',
  `unmoderatedCount` int unsigned NOT NULL DEFAULT '0',
  `moderatedCount` int unsigned NOT NULL DEFAULT '0',
  `highlightedCount` int unsigned NOT NULL DEFAULT '0',
  `approvedCount` int unsigned NOT NULL DEFAULT '0',
  `rejectedCount` int unsigned NOT NULL DEFAULT '0',
  `deferredCount` int unsigned NOT NULL DEFAULT '0',
  `flaggedCount` int unsigned NOT NULL DEFAULT '0',
  `batchedCount` int unsigned NOT NULL DEFAULT '0',
  `sourceId` char(255) DEFAULT NULL,
  `allCount` int unsigned NOT NULL DEFAULT '0',
  `ownerId` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label_index` (`label`),
  KEY `ownerId` (`ownerId`),
  CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_flags`
--

DROP TABLE IF EXISTS `comment_flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_flags` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sourceId` char(255) DEFAULT NULL,
  `extra` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `commentId` int unsigned DEFAULT NULL,
  `label` char(80) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `authorSourceId` char(255) DEFAULT NULL,
  `isResolved` tinyint(1) DEFAULT '0',
  `isRecommendation` tinyint(1) DEFAULT '0',
  `resolvedById` int unsigned DEFAULT NULL,
  `resolvedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comment_flags_commentId_foreign_idx` (`commentId`),
  KEY `comment_flags_resolvedById_foreign_idx` (`resolvedById`),
  CONSTRAINT `comment_flags_commentId_foreign_idx` FOREIGN KEY (`commentId`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comment_flags_resolvedById_foreign_idx` FOREIGN KEY (`resolvedById`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_flags`
--

LOCK TABLES `comment_flags` WRITE;
/*!40000 ALTER TABLE `comment_flags` DISABLE KEYS */;
/*!40000 ALTER TABLE `comment_flags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_score_requests`
--

DROP TABLE IF EXISTS `comment_score_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_score_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `commentId` int unsigned DEFAULT NULL,
  `sentAt` datetime NOT NULL,
  `doneAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `userId` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commentId` (`commentId`),
  KEY `userId_foreign_idx` (`userId`),
  CONSTRAINT `comment_score_requests_ibfk_1` FOREIGN KEY (`commentId`) REFERENCES `comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `userId_foreign_idx` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_score_requests`
--

LOCK TABLES `comment_score_requests` WRITE;
/*!40000 ALTER TABLE `comment_score_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `comment_score_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_scores`
--

DROP TABLE IF EXISTS `comment_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_scores` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `commentId` int unsigned DEFAULT NULL,
  `sourceType` enum('User','Moderator','Machine') NOT NULL,
  `sourceId` char(255) DEFAULT NULL,
  `commentScoreRequestId` int unsigned DEFAULT NULL,
  `score` float unsigned NOT NULL,
  `annotationStart` int unsigned DEFAULT NULL,
  `annotationEnd` int unsigned DEFAULT NULL,
  `extra` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tagId` int unsigned DEFAULT NULL,
  `isConfirmed` tinyint(1) DEFAULT NULL,
  `confirmedUserId` int unsigned DEFAULT NULL,
  `userId` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commentScoreRequestId` (`commentScoreRequestId`),
  KEY `commentId_index` (`commentId`),
  KEY `tagId_foreign_idx` (`tagId`),
  KEY `comment_scores_confirmed_user_id_foreign_idx` (`confirmedUserId`),
  KEY `comment_scores_user_id_foreign_idx` (`userId`),
  KEY `commentId_score_index` (`commentId`,`score`),
  KEY `commentId_score_tagId_index` (`commentId`,`score`,`tagId`),
  CONSTRAINT `comment_scores_confirmed_user_id_foreign_idx` FOREIGN KEY (`confirmedUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comment_scores_ibfk_1` FOREIGN KEY (`commentId`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comment_scores_ibfk_2` FOREIGN KEY (`commentScoreRequestId`) REFERENCES `comment_score_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comment_scores_user_id_foreign_idx` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tagId_foreign_idx` FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_scores`
--

LOCK TABLES `comment_scores` WRITE;
/*!40000 ALTER TABLE `comment_scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `comment_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_sizes`
--

DROP TABLE IF EXISTS `comment_sizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_sizes` (
  `commentId` int unsigned NOT NULL,
  `width` int unsigned NOT NULL,
  `height` int unsigned NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`commentId`),
  UNIQUE KEY `commentId_width_index` (`commentId`,`width`),
  CONSTRAINT `comment_sizes_ibfk_1` FOREIGN KEY (`commentId`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_sizes`
--

LOCK TABLES `comment_sizes` WRITE;
/*!40000 ALTER TABLE `comment_sizes` DISABLE KEYS */;
/*!40000 ALTER TABLE `comment_sizes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_summary_scores`
--

DROP TABLE IF EXISTS `comment_summary_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_summary_scores` (
  `commentId` int unsigned NOT NULL,
  `tagId` int unsigned NOT NULL,
  `score` float unsigned NOT NULL,
  `isConfirmed` tinyint(1) DEFAULT NULL,
  `confirmedUserId` int unsigned DEFAULT NULL,
  PRIMARY KEY (`commentId`,`tagId`),
  UNIQUE KEY `commentId_tagId_index` (`commentId`,`tagId`),
  KEY `tagId` (`tagId`),
  KEY `comment_summary_scores_confirmed_user_id_foreign_idx` (`confirmedUserId`),
  CONSTRAINT `comment_summary_scores_confirmed_user_id_foreign_idx` FOREIGN KEY (`confirmedUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comment_summary_scores_ibfk_1` FOREIGN KEY (`commentId`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comment_summary_scores_ibfk_2` FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_summary_scores`
--

LOCK TABLES `comment_summary_scores` WRITE;
/*!40000 ALTER TABLE `comment_summary_scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `comment_summary_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_top_scores`
--

DROP TABLE IF EXISTS `comment_top_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_top_scores` (
  `commentId` int unsigned NOT NULL,
  `tagId` int unsigned NOT NULL,
  `commentScoreId` int unsigned DEFAULT NULL,
  PRIMARY KEY (`commentId`,`tagId`),
  UNIQUE KEY `commentId_tagId_index` (`commentId`,`tagId`),
  KEY `tagId` (`tagId`),
  KEY `commentScoreId` (`commentScoreId`),
  CONSTRAINT `comment_top_scores_ibfk_1` FOREIGN KEY (`commentId`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comment_top_scores_ibfk_2` FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comment_top_scores_ibfk_3` FOREIGN KEY (`commentScoreId`) REFERENCES `comment_scores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_top_scores`
--

LOCK TABLES `comment_top_scores` WRITE;
/*!40000 ALTER TABLE `comment_top_scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `comment_top_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sourceId` char(255) NOT NULL,
  `articleId` int unsigned DEFAULT NULL,
  `replyToSourceId` char(255) DEFAULT NULL,
  `authorSourceId` char(255) NOT NULL,
  `text` longtext NOT NULL,
  `author` json NOT NULL,
  `isScored` tinyint(1) NOT NULL DEFAULT '0',
  `isAccepted` tinyint(1) DEFAULT NULL,
  `isDeferred` tinyint(1) DEFAULT '0',
  `isHighlighted` tinyint(1) DEFAULT '0',
  `isBatchResolved` tinyint(1) DEFAULT '0',
  `isAutoResolved` tinyint(1) DEFAULT '0',
  `sourceCreatedAt` datetime DEFAULT NULL,
  `sentForScoring` datetime DEFAULT NULL,
  `extra` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sentBackToPublisher` datetime DEFAULT NULL,
  `isModerated` tinyint(1) NOT NULL DEFAULT '0',
  `replyId` int unsigned DEFAULT NULL,
  `maxSummaryScore` float unsigned DEFAULT NULL,
  `maxSummaryScoreTagId` int unsigned DEFAULT NULL,
  `ownerId` int unsigned DEFAULT NULL,
  `unresolvedFlagsCount` int unsigned NOT NULL DEFAULT '0',
  `flagsSummary` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `authorSourceId_index` (`authorSourceId`),
  KEY `replyToSourceId_index` (`replyToSourceId`),
  KEY `isAccepted_index` (`isAccepted`),
  KEY `isDeferred_index` (`isDeferred`),
  KEY `isHighlighted_index` (`isHighlighted`),
  KEY `isBatchResolved_index` (`isBatchResolved`),
  KEY `isAutoResolved_index` (`isAutoResolved`),
  KEY `sentForScoring_index` (`sentForScoring`),
  KEY `sentBackToPublisher_index` (`sentBackToPublisher`),
  KEY `replyId_index` (`replyId`),
  KEY `maxSummaryScore_index` (`maxSummaryScore`),
  KEY `maxSummaryScoreTagId_index` (`maxSummaryScoreTagId`),
  KEY `articleId` (`articleId`),
  KEY `ownerId` (`ownerId`),
  FULLTEXT KEY `comments_text` (`text`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`articleId`) REFERENCES `articles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`replyId`) REFERENCES `comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`ownerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuration_items`
--

DROP TABLE IF EXISTS `configuration_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuration_items` (
  `id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `data` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuration_items`
--

LOCK TABLES `configuration_items` WRITE;
/*!40000 ALTER TABLE `configuration_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `configuration_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csrfs`
--

DROP TABLE IF EXISTS `csrfs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `csrfs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `clientCSRF` char(255) NOT NULL,
  `serverCSRF` char(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `referrer` char(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csrfs`
--

LOCK TABLES `csrfs` WRITE;
/*!40000 ALTER TABLE `csrfs` DISABLE KEYS */;
/*!40000 ALTER TABLE `csrfs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `decisions`
--

DROP TABLE IF EXISTS `decisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `decisions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `commentId` int unsigned DEFAULT NULL,
  `userId` int unsigned DEFAULT NULL,
  `moderationRuleId` int unsigned DEFAULT NULL,
  `status` enum('Accept','Reject','Defer') NOT NULL,
  `source` enum('User','Rule') NOT NULL,
  `isCurrentDecision` tinyint(1) NOT NULL DEFAULT '1',
  `sentBackToPublisher` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `commentId` (`commentId`),
  KEY `userId` (`userId`),
  KEY `moderationRuleId` (`moderationRuleId`),
  CONSTRAINT `decisions_ibfk_1` FOREIGN KEY (`commentId`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `decisions_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `decisions_ibfk_3` FOREIGN KEY (`moderationRuleId`) REFERENCES `moderation_rules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `decisions`
--

LOCK TABLES `decisions` WRITE;
/*!40000 ALTER TABLE `decisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `decisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `last_updates`
--

DROP TABLE IF EXISTS `last_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `last_updates` (
  `id` int unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `lastUpdate` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `last_updates`
--

LOCK TABLES `last_updates` WRITE;
/*!40000 ALTER TABLE `last_updates` DISABLE KEYS */;
/*!40000 ALTER TABLE `last_updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `moderation_rules`
--

DROP TABLE IF EXISTS `moderation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `moderation_rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdBy` int unsigned DEFAULT NULL,
  `categoryId` int unsigned DEFAULT NULL,
  `lowerThreshold` float unsigned NOT NULL,
  `upperThreshold` float unsigned NOT NULL,
  `action` enum('Accept','Reject','Defer','Highlight') NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tagId` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  KEY `tagId` (`tagId`),
  CONSTRAINT `moderation_rules_ibfk_1` FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `moderation_rules_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `moderation_rules`
--

LOCK TABLES `moderation_rules` WRITE;
/*!40000 ALTER TABLE `moderation_rules` DISABLE KEYS */;
INSERT INTO `moderation_rules` VALUES (1,NULL,NULL,0.9,1,'Reject','2017-06-14 17:25:53','2017-06-14 17:25:53',8);
/*!40000 ALTER TABLE `moderation_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `moderator_assignments`
--

DROP TABLE IF EXISTS `moderator_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `moderator_assignments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` int unsigned NOT NULL,
  `articleId` int unsigned NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_assignment_index` (`userId`,`articleId`),
  KEY `articleId` (`articleId`),
  KEY `userId_index` (`userId`),
  CONSTRAINT `moderator_assignments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `moderator_assignments_ibfk_2` FOREIGN KEY (`articleId`) REFERENCES `articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `moderator_assignments`
--

LOCK TABLES `moderator_assignments` WRITE;
/*!40000 ALTER TABLE `moderator_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `moderator_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preselects`
--

DROP TABLE IF EXISTS `preselects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preselects` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdBy` int unsigned DEFAULT NULL,
  `categoryId` int unsigned DEFAULT NULL,
  `tagId` int unsigned DEFAULT NULL,
  `lowerThreshold` float unsigned DEFAULT NULL,
  `upperThreshold` float unsigned DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  KEY `categoryId` (`categoryId`),
  KEY `tagId` (`tagId`),
  CONSTRAINT `preselects_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `preselects_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `preselects_ibfk_3` FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preselects`
--

LOCK TABLES `preselects` WRITE;
/*!40000 ALTER TABLE `preselects` DISABLE KEYS */;
INSERT INTO `preselects` VALUES (1,NULL,NULL,NULL,0,0.2,'2017-06-14 17:25:54','2017-06-14 17:25:54');
/*!40000 ALTER TABLE `preselects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tagging_sensitivities`
--

DROP TABLE IF EXISTS `tagging_sensitivities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tagging_sensitivities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `createdBy` int unsigned DEFAULT NULL,
  `categoryId` int unsigned DEFAULT NULL,
  `tagId` int unsigned DEFAULT NULL,
  `lowerThreshold` float unsigned DEFAULT NULL,
  `upperThreshold` float unsigned DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`),
  KEY `categoryId` (`categoryId`),
  KEY `tagId` (`tagId`),
  CONSTRAINT `tagging_sensitivities_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `tagging_sensitivities_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tagging_sensitivities_ibfk_3` FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tagging_sensitivities`
--

LOCK TABLES `tagging_sensitivities` WRITE;
/*!40000 ALTER TABLE `tagging_sensitivities` DISABLE KEYS */;
INSERT INTO `tagging_sensitivities` VALUES (1,NULL,NULL,NULL,0.65,1,'2017-06-14 17:25:54','2017-06-14 17:25:54');
/*!40000 ALTER TABLE `tagging_sensitivities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` char(255) NOT NULL,
  `color` char(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `key` char(255) NOT NULL,
  `description` char(255) DEFAULT NULL,
  `isInBatchView` tinyint(1) NOT NULL DEFAULT '0',
  `inSummaryScore` tinyint(1) NOT NULL DEFAULT '0',
  `isTaggable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tags_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,'Summary Score','#cccccc','2017-06-14 17:25:56','2017-06-14 17:25:56','SUMMARY_SCORE',NULL,1,0,0),(2,'Attack on Author','#01828f','2017-06-14 17:25:53','2017-06-14 17:25:53','ATTACK_ON_AUTHOR',NULL,1,1,0),(3,'Attack on Commenter','#01828f','2017-06-14 17:25:53','2017-06-14 17:25:53','ATTACK_ON_COMMENTER',NULL,1,1,0),(4,'Incoherent','#9c28b1','2017-06-14 17:25:53','2017-06-14 17:25:53','INCOHERENT',NULL,1,1,0),(5,'Inflammatory','#1976d3','2017-06-14 17:25:53','2017-06-14 17:25:53','INFLAMMATORY',NULL,1,1,0),(6,'Obscene','#d71b60','2017-06-14 17:25:53','2017-06-14 17:25:53','OBSCENE',NULL,1,1,0),(7,'Off Topic','#3f51b5','2017-06-14 17:25:53','2017-06-14 17:25:53','OFF_TOPIC',NULL,1,1,0),(8,'Spam','#673bb8','2017-06-14 17:25:53','2017-06-14 17:25:53','SPAM',NULL,1,1,0),(9,'Unsubstantial','#3d5afe','2017-06-14 17:25:53','2017-06-14 17:25:53','UNSUBSTANTIAL',NULL,1,1,0),(10,'Likely to be rejected','#D32F2E','2017-06-14 17:25:53','2017-06-14 17:25:53','LIKELY_TO_REJECT',NULL,1,1,0),(11,'Toxicity','#cccccc','2017-06-14 17:25:56','2017-06-14 17:25:56','TOXICITY',NULL,1,1,0);
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_category_assignments`
--

DROP TABLE IF EXISTS `user_category_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_category_assignments` (
  `userId` int unsigned NOT NULL,
  `categoryId` int unsigned NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`,`categoryId`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `user_category_assignments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_category_assignments_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_category_assignments`
--

LOCK TABLES `user_category_assignments` WRITE;
/*!40000 ALTER TABLE `user_category_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_category_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_social_auths`
--

DROP TABLE IF EXISTS `user_social_auths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_social_auths` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` int unsigned NOT NULL,
  `socialId` char(255) NOT NULL,
  `provider` char(150) NOT NULL,
  `extra` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_provider_index` (`provider`,`userId`),
  UNIQUE KEY `unique_provider_user_index` (`provider`,`socialId`),
  KEY `userId` (`userId`),
  CONSTRAINT `user_social_auths_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_social_auths`
--

LOCK TABLES `user_social_auths` WRITE;
/*!40000 ALTER TABLE `user_social_auths` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_social_auths` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `group` enum('general','admin','service','moderator','youtube') NOT NULL,
  `name` char(255) NOT NULL,
  `email` char(255) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '0',
  `extra` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `avatarURL` char(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_group` (`email`,`group`),
  KEY `group_index` (`group`),
  KEY `isActive_index` (`isActive`),
  KEY `users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-12-02 11:42:31
