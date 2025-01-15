import { integer, text, blob, sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";
import type { BigTwoGameMachineSnapshot } from "~libs/helpers/gameStateMachine";
import { init } from "@paralleldrive/cuid2";

const createId = init({
  length: 5,
});

export const gameRoom = sqliteTable("game_room", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId())
    .notNull(),
  roomName: text("room_name").notNull(),
  gameState: blob("game_state", { mode: "json" })
    .$type<BigTwoGameMachineSnapshot>()
    .notNull(),
  creatorId: text("creator_id")
    .references(() => user.id)
    .notNull(),
});

// export type User = typeof users.$inferSelect;
// export type NewUser = typeof users.$inferInsert;

// export type Idea = typeof ideas.$inferSelect;
// export type NewIdea = typeof ideas.$inferInsert;
