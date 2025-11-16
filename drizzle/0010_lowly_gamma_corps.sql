CREATE TABLE `whatsappSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` text NOT NULL,
	`phoneId` varchar(64) NOT NULL,
	`apiUrl` varchar(255) NOT NULL DEFAULT 'https://graph.facebook.com/v18.0',
	`fromNumber` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `whatsappSettings` ADD CONSTRAINT `whatsappSettings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;