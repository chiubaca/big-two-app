import { z } from "zod";
import { userSchema } from "./user";

export const roomSchema = z.object({
  admin: z.string(),
  collectionId: z.string(),
  collectionName: z.string(),
  created: z.string(),
  gameState: z.any(),
  id: z.string(),
  players: z.array(z.string()),
  roomName: z.string(),
  updated: z.string(),
});

export const roomExpandedSchema = roomSchema.extend({
  expand: z.object({ admin: userSchema }),
});

export type RoomSchema = z.infer<typeof roomSchema>;
export type RoomExpandedSchema = z.infer<typeof roomExpandedSchema>;
