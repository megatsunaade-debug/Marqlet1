CREATE TABLE `publications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`source` varchar(50) NOT NULL,
	`movementCode` int,
	`movementName` varchar(500) NOT NULL,
	`content` text,
	`publishedAt` timestamp NOT NULL,
	`externalId` varchar(255),
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publications_id` PRIMARY KEY(`id`),
	CONSTRAINT `publications_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
ALTER TABLE `publications` ADD CONSTRAINT `publications_caseId_cases_id_fk` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE no action ON UPDATE no action;