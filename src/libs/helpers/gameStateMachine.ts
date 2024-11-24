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
  | { type: "PLAY_NEW_ROUND_FIRST_MOVE"; cards: Card[] }
  | { type: "PLAY_CARDS"; cards: Card[] }
  | { type: "PASS_TURN"; playerId: string }
  | { type: "RESET_GAME" };

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

        context.players.forEach((player, index) => {
          context.players[index].hand = sortCards(dealtCards[index]);
        });

        console.log("✅ Cards dealt:", context);
      },
      playFirstMove: ({ context, event }) => {
        if (event.type !== "PLAY_FIRST_MOVE") {
          throw new Error("attempted playFirstMove on incorrect state");
        }
        const cardsPlayed = event.cards;

        // update the current player's hand
        const updatedPlayerHands = updatePlayersHands({
          currentHand: context.players[context.currentPlayerIndex].hand,
          cardsToRemove: cardsPlayed,
        });
        context.players[context.currentPlayerIndex].hand = updatedPlayerHands;

        // update the current player index
        const updatedCurrentPlayerIndex = rotatePlayerIndex({
          currentPlayerIndex: context.currentPlayerIndex,
          totalPlayers: context.players.length - 1,
        });

        const handType = detectHandType(cardsPlayed);
        context.roundMode = handType;
        context.currentPlayerIndex = updatedCurrentPlayerIndex;
        context.cardPile.push(cardsPlayed);
      },
      playCards: ({ context, event }) => {
        if (event.type !== "PLAY_CARDS") {
          console.warn("🚨 attempted playCards action on incorrect state");
          return;
        }
        const cardsPlayed = event.cards;
        const updatedPlayerHands = updatePlayersHands({
          currentHand: context.players[context.currentPlayerIndex].hand,
          cardsToRemove: event.cards,
        });
        context.players[context.currentPlayerIndex].hand = updatedPlayerHands;

        const updatedPlayerIndex = rotatePlayerIndex({
          currentPlayerIndex: context.currentPlayerIndex,
          totalPlayers: context.players.length - 1,
        });

        context.consecutivePasses = 0;
        context.currentPlayerIndex = updatedPlayerIndex;
        context.cardPile.push(cardsPlayed);
      },
      resetGame: ({ context }) => {
        context.players = context.players.map((player) => {
          return {
            hand: [],
            id: player.id,
            name: player.name,
          };
        });
        context.currentPlayerIndex = 0;
        context.roundMode = null;
        context.cardPile = [];
        context.consecutivePasses = 0;
      },
      passTurn: ({ context, event }) => {
        if (event.type !== "PASS_TURN") {
          console.warn("🚨 attempted passTurn action on incorrect state");
          return;
        }

        const updatedPlayerIndex = rotatePlayerIndex({
          currentPlayerIndex: context.currentPlayerIndex,
          totalPlayers: context.players.length - 1, // start from 0
        });

        context.consecutivePasses += 1;
        context.currentPlayerIndex = updatedPlayerIndex;
      },
      playNewRoundFirstMove: ({ context, event }) => {
        if (event.type !== "PLAY_NEW_ROUND_FIRST_MOVE") {
          throw new Error("attempted playFirstMove on incorrect state");
        }

        const cardsPlayed = event.cards;
        const handType = detectHandType(cardsPlayed);

        const updatedPlayerHands = updatePlayersHands({
          currentHand: context.players[context.currentPlayerIndex].hand,
          cardsToRemove: cardsPlayed,
        });
        context.players[context.currentPlayerIndex].hand = updatedPlayerHands;

        const updatedPlayerIndex = rotatePlayerIndex({
          currentPlayerIndex: context.currentPlayerIndex,
          totalPlayers: context.players.length - 1,
        });

        context.roundMode = handType;
        context.currentPlayerIndex = updatedPlayerIndex;
        context.cardPile.push(cardsPlayed);
      },
      startNewRound: ({ context }) => {
        context.consecutivePasses = 0;
        context.roundMode = null;
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
      isValidNewRoundFirstMove: ({ context, event }) => {
        if (event.type !== "PLAY_NEW_ROUND_FIRST_MOVE") {
          console.warn(
            "🚨 attempted PLAY_NEW_ROUND_FIRST_MOVE on incorrect state"
          );
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
      hasEveryonePassedExceptLastPlayer: ({ context }) => {
        const playerCount = context.players.length - 1; //normalise to index 0

        // when all players pass in a row, minus the last player, that player has won the round.
        const numberConsecutivePassesNeededToWinRound = playerCount - 1;
        return (
          context.consecutivePasses >= numberConsecutivePassesNeededToWinRound
        );
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
          RESET_GAME: {
            actions: ["resetGame"],
            target: "WAITING_FOR_PLAYERS",
          },
        },
      },
      NEXT_PLAYER_TURN: {
        on: {
          PLAY_CARDS: {
            actions: ["playCards"],
            guard: "isPlayedHandValid",
          },
          //**
          //* In XState, when you group transitions in an array like this, it creates
          // an ordered list of potential transitions that will be evaluated from top to bottom.
          // this is known as "guard prioritization" or "ordered transitions."
          //*
          PASS_TURN: [
            // check if everyone has passed except the last player
            {
              guard: "hasEveryonePassedExceptLastPlayer",
              target: "PLAY_NEW_ROUND",
              actions: ["passTurn"],
            },
            {
              actions: ["passTurn"],
            },
            // Second transition fallback if first guard fails
          ],
          RESET_GAME: {
            actions: ["resetGame"],
            target: "WAITING_FOR_PLAYERS",
          },
        },
      },
      PLAY_NEW_ROUND: {
        entry: ["startNewRound"],
        on: {
          PLAY_NEW_ROUND_FIRST_MOVE: {
            actions: ["playNewRoundFirstMove"],
            target: "NEXT_PLAYER_TURN",
            guard: "isValidNewRoundFirstMove",
          },
          RESET_GAME: {
            actions: ["resetGame"],
            target: "WAITING_FOR_PLAYERS",
          },
        },
      },
    },
  });
