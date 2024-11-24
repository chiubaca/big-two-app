import { createDeck, sortCards, type Card } from "@chiubaca/big-two-utils";
import {
  createActor,
  setup,
  type MachineSnapshot,
  type SnapshotFrom,
} from "xstate";
import { dealArray, shuffleArray } from "./deck";
import {
  detectHandType,
  isPlayedHandBigger,
  rotatePlayerIndex,
  updatePlayersHands,
} from "./gameState";

export type RoomSchema = {
  admin: string;
  players: string[];
  roomName: string;
  gameState: BigTwoGameMachineSnapshot;
};

type BigTwoGameMachine = ReturnType<typeof makeBigTwoGameMachine>;
export type BigTwoGameMachineSnapshot = SnapshotFrom<BigTwoGameMachine>;

export type GameEvent =
  | { type: "JOIN_GAME"; playerId: string; playerName: string }
  | { type: "START_GAME" }
  | { type: "ROUND_FIRST_MOVE" }
  | { type: "PLAY_FIRST_MOVE"; cards: Card[] }
  | { type: "PLAY_CARDS"; cards: Card[] }
  | { type: "PASS_TURN"; playerId: string };

type Player = {
  name: string;
  id: string;
  hand: Card[];
};

type RoundMode = "single" | "pairs" | "combo";

export interface GameContext {
  players: Player[];
  currentPlayerIndex: number;
  roundMode: RoundMode | null;
  cardPile: Card[][];
  consecutivePasses: number;
  winner?: string;
}

export const makeBigTwoGameMachine = () =>
  setup({
    types: {
      context: {} as GameContext,
      events: {} as GameEvent,
    },
    actions: {
      addPlayer: ({ context, event }) => {
        console.log("🚀 ~ context:", context.players);
        if (event.type !== "JOIN_GAME") {
          console.warn("🚨 wrong event type was sent: ", event.type);
          return;
        }
        context.players.push({
          id: event.playerId,
          name: event.playerName,
          hand: [],
        });
      },
      dealCards: ({ context }) => {
        console.log("🎲 Dealing cards...");
        const newDeck = createDeck();
        const shuffledDeck = shuffleArray(newDeck);

        const dealtCards = dealArray(shuffledDeck, context.players.length);
        console.log("🚀 ~ dealtCards:", dealtCards);

        context.players.forEach((player, index) => {
          player.hand = dealtCards[index];
        });
        console.log("✅ Cards dealt:", context);
      },
      playFirstMove: ({ context, event }) => {
        if (event.type !== "PLAY_FIRST_MOVE") {
          throw new Error("attempted playFirstMove on incorrect state");
        }

        const cardsPlayed = event.cards;
        const handType = detectHandType(cardsPlayed);

        const updatedPlayerIndex = rotatePlayerIndex({
          currentPlayerIndex: context.currentPlayerIndex,
          totalPlayers: context.players.length - 1, // start from 0
        });

        const updatedPlayerHands = updatePlayersHands({
          currentHand: context.players[context.currentPlayerIndex].hand,
          cardsToRemove: event.cards,
        });

        context.roundMode = handType;
        context.currentPlayerIndex = updatedPlayerIndex;
        context.cardPile.push(cardsPlayed);
        context.players[context.currentPlayerIndex].hand = updatedPlayerHands;
      },
      playCards: ({ context, event }) => {
        if (event.type !== "PLAY_CARDS") {
          console.warn("🚨 attempted playCards action on incorrect state");
          return;
        }

        const cardsPlayed = event.cards;

        // If all passes, we can continue to the next player
        const updatedPlayerIndex = rotatePlayerIndex({
          currentPlayerIndex: context.currentPlayerIndex,
          totalPlayers: context.players.length - 1, // start from 0
        });
        context.consecutivePasses = 0;
        context.currentPlayerIndex = updatedPlayerIndex;
        context.cardPile.push(cardsPlayed);
      },
    },
    guards: {
      hasMaxPlayers: ({ context }) => context.players.length !== 4,
      isValidFirstMove: ({ context, event }) => {
        if (event.type !== "PLAY_FIRST_MOVE") {
          console.warn("🚨 attempted PLAY_FIRST_MOVE on incorrect state");
          return false;
        }
        const handType = detectHandType(event.cards);

        if (handType === null) {
          console.warn("🚨 invalid hand was played");
          return false;
        }
        return true;
      },
      isPlayedHandValid: ({ context, event }) => {
        if (event.type !== "PLAY_CARDS") {
          console.warn("🚨 attempted PLAY_CARDS on incorrect state");
          return false;
        }
        const handType = detectHandType(event.cards);
        if (handType === null) {
          console.warn("🚨 invalid hand was played");
          return false;
        }

        if (handType !== context.roundMode) {
          console.warn("🚨 hand type does not match round mode");
          return false;
        }

        const cardsToBeat = context.cardPile.at(-1);
        if (!cardsToBeat) {
          console.warn("🚨 could not get last hand played on cardPile");
          return false;
        }

        if (
          !isPlayedHandBigger({
            playedCards: event.cards,
            cardsToBeat,
            handType: context.roundMode,
          })
        ) {
          console.warn("🚨 played hand is not bigger than last cards on pile");
          return false;
        }

        return true;
      },
    },
  }).createMachine({
    id: "bigTwoGame",
    initial: "WAITING_FOR_PLAYERS",
    context: {
      players: [],
      currentPlayerIndex: 0,
      roundMode: null,
      cardPile: [],
      consecutivePasses: 0,
      winner: undefined,
    },
    states: {
      WAITING_FOR_PLAYERS: {
        on: {
          JOIN_GAME: {
            actions: ["addPlayer"],
            guard: "hasMaxPlayers",
          },
          START_GAME: {
            actions: ["dealCards"],
            target: "ROUND_FIRST_MOVE",
          },
        },
      },
      ROUND_FIRST_MOVE: {
        on: {
          PLAY_FIRST_MOVE: {
            actions: ["playFirstMove"],
            guard: "isValidFirstMove",
            target: "NEXT_PLAYER_TURN",
          },
        },
      },
      NEXT_PLAYER_TURN: {
        on: {
          PLAY_CARDS: {
            actions: ["playCards"],
            guard: "isPlayedHandValid",
          },
        },
      },
    },
  });
