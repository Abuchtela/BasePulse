CREATE TABLE `near_intent_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`idempotencyKey` varchar(128) NOT NULL,
	`intentHash` varchar(71) NOT NULL,
	`status` enum('rejected','quoted','deposit_submitted','processing','success','refunded','failed') NOT NULL,
	`executionMode` enum('simulation','live') NOT NULL,
	`estimatedAmountUSD` decimal(20,2) NOT NULL,
	`intent` json NOT NULL,
	`quote` json,
	`receipt` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `near_intent_executions_id` PRIMARY KEY(`id`),
	CONSTRAINT `near_intent_executions_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
