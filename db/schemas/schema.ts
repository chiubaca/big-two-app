import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const ideas = sqliteTable("ideas", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  text: text("text"),
  status: text("status", { enum: ["approved", "rejected", "pending"] }),
  creator: integer("creator_id").references(() => user.id),
});

// export type User = typeof users.$inferSelect;
// export type NewUser = typeof users.$inferInsert;

// export type Idea = typeof ideas.$inferSelect;
// export type NewIdea = typeof ideas.$inferInsert;
