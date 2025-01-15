PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_game_room` (
	`id` text PRIMARY KEY NOT NULL,
	`room_name` text NOT NULL,
	`game_state` blob NOT NULL,
	`creator_id` text NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_game_room`("id", "room_name", "game_state", "creator_id") SELECT "id", "room_name", "game_state", "creator_id" FROM `game_room`;--> statement-breakpoint
DROP TABLE `game_room`;--> statement-breakpoint
ALTER TABLE `__new_game_room` RENAME TO `game_room`;--> statement-breakpoint
PRAGMA foreign_keys=ON;