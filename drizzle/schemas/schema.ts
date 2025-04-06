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

export const pushSubscription = sqliteTable("push_subscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId())
    .notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  subscriptionJSON: blob("subscription_json", { mode: "json" })
    .$type<PushSubscriptionJSON>()
    .notNull(),
});
