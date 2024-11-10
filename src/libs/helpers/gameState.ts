import type { Card } from "@chiubaca/big-two-utils";

import { z } from "zod";

const cardSchema = z.custom<Card>();

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
  currentPlayerIndex: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
  ]),
  roundMode: roundModeSchema,
});

export type GameState = z.infer<typeof gameStateSchema>;

export const baseGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  roundMode: "single",
};
