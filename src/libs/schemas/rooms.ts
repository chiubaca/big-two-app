import { z } from "zod";

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

export type RoomSchema = z.infer<typeof roomSchema>;
