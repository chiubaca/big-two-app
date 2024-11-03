import type { Card } from "@chiubaca/big-two-utils";

type RoundMode = "single" | "pairs" | "combo";

type Player = {
  id: string;
  hand: Card[];
};

export type GameState = {
  players: Player[];
  currentPlayerIndex: 0 | 1 | 2 | 3;
  roundMode: RoundMode;
  // lastPlayedCards: Card[];
  // lastPlayedBy: string | null;
  // selectedCards: Card[];
  // message: string;
  // consecutivePasses: number;
};

export const baseGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  roundMode: "single",
};
