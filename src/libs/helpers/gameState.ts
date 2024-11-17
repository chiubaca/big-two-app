import {
  isComboBigger,
  isPairBigger,
  isPairValid,
  isSingleBigger,
  validateComboType,
  type Card,
} from "@chiubaca/big-two-utils";

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
  roundNumber: z.number(),
  playersPassed: z.array(z.string()),
  event: z.union([
    z.literal("round-first-move"),
    z.literal("round-new"),
    z.literal("player-played"),
    z.literal("player-passed"),
    z.literal("game-waiting-to-start"),
    z.literal("game-ended"), // game ended
  ]),
  cardPile: z.array(z.array(cardSchema)),
  consecutivePasses: z.number(),
});

export type GameState = z.infer<typeof gameStateSchema>;

export const baseGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  roundMode: "single",
  roundNumber: 0,
  event: "game-waiting-to-start",
  playersPassed: [],
  cardPile: [],
  consecutivePasses: 0,
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

export function updatePlayersHands({
  currentHand,
  cardsToRemove,
}: {
  currentHand: Card[];
  cardsToRemove: Card[];
}): Card[] {
  return currentHand.filter(
    (card) =>
      !cardsToRemove.some((c) => c.suit === card.suit && c.value === card.value)
  );
}

export function detectHandType(cards: Card[]): GameState["roundMode"] | null {
  if (cards.length === 1) return "single";

  if (cards.length === 2 && isPairValid([cards[0], cards[1]])) return "pairs";

  if (cards.length === 5 && validateComboType(cards)) {
    return "combo";
  }

  return null;
}

export function isPlayedHandBigger(args: {
  playedCards: Card[];
  cardsToBeat: Card[];
  handType: GameState["roundMode"];
}): boolean {
  const { handType, playedCards, cardsToBeat } = args;

  if (handType === "single") {
    return isSingleBigger(playedCards[0], cardsToBeat[0]);
  }

  if (handType === "pairs") {
    return isPairBigger(
      [playedCards[0], playedCards[1]],
      [cardsToBeat[0], cardsToBeat[1]]
    );
  }

  if (handType === "combo") {
    const validatedPlayedCombo = validateComboType(playedCards);
    const validatedComboToBeat = validateComboType(cardsToBeat);

    if (!validatedPlayedCombo || !validatedComboToBeat) {
      console.warn("combo was not validated correctly");
      return false;
    }

    return isComboBigger(validatedPlayedCombo, validatedComboToBeat);
  }

  return false;
}
