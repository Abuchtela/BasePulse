CREATE TABLE `agent_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` varchar(100) NOT NULL,
	`value` decimal(20,8) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	CONSTRAINT `agent_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deployed_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenAddress` varchar(42) NOT NULL,
	`name` varchar(255) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`description` text,
	`imageUrl` varchar(512),
	`trendTheme` varchar(255) NOT NULL,
	`sentimentScore` decimal(5,2),
	`deploymentTxHash` varchar(66) NOT NULL,
	`deploymentBlockNumber` int,
	`initialLiquidity` decimal(20,8),
	`currentMarketCap` decimal(20,8),
	`totalVolume24h` decimal(20,8),
	`holders` int,
	`status` enum('pending','deployed','active','inactive') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployed_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `deployed_tokens_tokenAddress_unique` UNIQUE(`tokenAddress`)
);
--> statement-breakpoint
CREATE TABLE `social_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('twitter','farcaster') NOT NULL,
	`postId` varchar(255) NOT NULL,
	`postContent` text,
	`sentiment` enum('positive','neutral','negative'),
	`engagementCount` int,
	`mentionedTokenId` int,
	`agentResponse` text,
	`responsePostId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `treasury_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('fee_collection','reinvestment','deployment_cost','reward') NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`amountUSD` decimal(20,2),
	`tokenAddress` varchar(42),
	`txHash` varchar(66),
	`description` text,
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `treasury_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trend_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`theme` varchar(255) NOT NULL,
	`sentimentScore` decimal(5,2) NOT NULL,
	`mentionCount` int NOT NULL,
	`onChainVolume` decimal(20,8),
	`onChainVolumeUSD` decimal(20,2),
	`deploymentTriggered` boolean DEFAULT false,
	`deployedTokenId` int,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trend_analysis_id` PRIMARY KEY(`id`)
);
