import { integer, text, blob, sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";
import type { BigTwoGameMachineSnapshot } from "~libs/helpers/gameStateMachine";

export const gameRoom = sqliteTable("game_room", {
  id: integer("id", { mode: "number" })
    .primaryKey({ autoIncrement: true })
    .notNull(),
  roomName: text("room_name").notNull(),
  gameState: blob("game_state", { mode: "json" })
    .$type<BigTwoGameMachineSnapshot>()
    .notNull(), //.$type<{ foo: string }>()
  creatorId: text("creator_id")
    .references(() => user.id)
    .notNull(),
});

// export type User = typeof users.$inferSelect;
// export type NewUser = typeof users.$inferInsert;

// export type Idea = typeof ideas.$inferSelect;
// export type NewIdea = typeof ideas.$inferInsert;
