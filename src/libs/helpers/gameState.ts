import type { Card } from "@chiubaca/big-two-utils";

import { z } from "zod";

export const cardSchema = z.custom<Card>(/** implement card validator */);

const playerSchema = z.object({
  name: z.string(),
  id: z.string(),
  hand: z.array(cardSchema),
});

const roundModeSchema = z.union([
  z.literal("single"),
  z.literal("pairs"),
  z.literal("combo"),
]);
export const gameStateSchema = z.object({
  players: z.array(playerSchema),
  currentPlayerIndex: z.number(),
  roundMode: roundModeSchema,
});

export type GameState = z.infer<typeof gameStateSchema>;

export const baseGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  roundMode: "single",
};

export function rotatePlayerIndex(args: {
  currentPlayerIndex: number;
  totalPlayers: number;
}) {
  const { currentPlayerIndex, totalPlayers } = args;
  const incrementedPlayerIndex = currentPlayerIndex + 1;
  const updatedPlayerIndex =
    incrementedPlayerIndex === totalPlayers + 1 ? 0 : incrementedPlayerIndex;

  if (updatedPlayerIndex > totalPlayers) {
    throw new Error(`max index can only be ${totalPlayers}`);
  }

  return updatedPlayerIndex;
}
