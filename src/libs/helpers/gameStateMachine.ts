import { createDeck, sortCards, type Card } from "@chiubaca/big-two-utils";
import {
  createActor,
  setup,
  type MachineSnapshot,
  type SnapshotFrom,
} from "xstate";
import { dealArray, shuffleArray } from "./deck";

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
  | { type: "PLAY_CARDS"; cards: Card[]; playerId: string }
  | { type: "PASS_TURN"; playerId: string }
  | { type: "PLAYER_LEFT"; playerId: string };

type Player = {
  name: string;
  id: string;
  hand: Card[];
};

export type GameStatus =
  | "WAITING_FOR_PLAYERS"
  | "GAME_STARTING"
  | "ROUND_FIRST_MOVE"
  | "PLAYER_TURN"
  | "ROUND_END"
  | "GAME_END";

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
      playCards: ({ context, event }) => {
        // Implementation here
      },
      setRoundMode: ({ context, event }) => {
        // Implementation here
      },
    },
    guards: {
      hasMaxPlayers: ({ context }) => context.players.length !== 4,
      // isValidFirstMove: ({ context, event }) => {
      //   // this should check if the player has a 3 diamond card
      //   return true;
      // },
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
            target: "GAME_STARTING",
          },
        },
      },
      GAME_STARTING: {
        entry: ["dealCards"],
        always: {
          target: "ROUND_FIRST_MOVE",
        },
      },
      ROUND_FIRST_MOVE: {
        on: {
          PLAY_CARDS: {
            target: "PLAYER_TURN",
            // guard: "isValidFirstMove",
            actions: ["playCards", "setRoundMode"],
          },
        },
      },
      PLAYER_TURN: {
        // Add player turn state logic here
      },
    },
  });
