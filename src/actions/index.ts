import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { produce } from "immer";
import { createActor } from "xstate";

import {
  type GameState,
  cardSchema,
  detectHandType,
  isPlayedHandBigger,
  rotatePlayerIndex,
  updatePlayersHands,
} from "~libs/helpers/gameState";
import pbAdmin from "~libs/pocketbase/pocketbase-admin";
import {
  makeBigTwoGameMachine,
  type BigTwoGameMachineSnapshot,
  type RoomSchema as RoomSchemaV2,
} from "~libs/helpers/gameStateMachine";

import type { RoomSchema } from "~libs/schemas/rooms";

export const server = {
  signUp: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
    }),
    handler: async (input, context) => {
      try {
        const { email, name, password } = input;

        const record = await context.locals.pb.collection("users").create({
          username: name,
          email: email,
          emailVisibility: true,
          password: password,
          passwordConfirm: password,
          name,
        });
        console.log("🚀 ~ record ~ record:", record);

        return record;
      } catch (e) {
        console.log("Server Error", JSON.stringify(e));
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error trying to create user record",
          stack: JSON.stringify(e),
        });
      }
    },
  }),
  createRoomV2: defineAction({
    accept: "form",
    input: z.object({
      roomName: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🚀 Create a room action v2", input);
      const currentUserId = context.locals.pb.authStore.model?.id;
      const currentPlayerName = context.locals.pb.authStore.model?.name;

      try {
        if (!context.locals.pb.authStore.isValid) {
          console.log("user must be logged in to create a room v2");
          return null;
        }

        const bigTwoGameMachine = makeBigTwoGameMachine();

        const gameStateMachineActor = createActor(bigTwoGameMachine).start();
        gameStateMachineActor.send({
          type: "JOIN_GAME",
          playerId: currentUserId,
          playerName: currentPlayerName,
        });
        const gameStateSnapshot =
          gameStateMachineActor.getPersistedSnapshot() as BigTwoGameMachineSnapshot;
        console.log("🚀 ~ handler: ~ gameStateSnapshot:", gameStateSnapshot);

        const roomRecord = {
          admin: currentUserId,
          players: [currentUserId],
          roomName: input.roomName,
          gameState: gameStateSnapshot,
        } satisfies RoomSchemaV2;

        const record = await pbAdmin.collection("rooms").create(roomRecord);

        return record;
      } catch (e) {
        console.log("Server Error", JSON.stringify(e));
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error trying to create a room",
          stack: JSON.stringify(e),
        });
      }
    },
  }),

  startGameV2: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🟢 New game started...");
      const pb = context.locals.pb;
      const roomRecord = await pb
        .collection("rooms")
        .getOne<RoomSchemaV2>(input.roomId);

      const bigTwoGameMachine = makeBigTwoGameMachine();
      const serverGameState = roomRecord.gameState;
      const gameStateMachineActor = createActor(bigTwoGameMachine, {
        snapshot: serverGameState,
      }).start();

      gameStateMachineActor.send({ type: "START_GAME" });
      const gameStateSnapshot = gameStateMachineActor.getPersistedSnapshot();

      const record = await pb.collection("rooms").update(input.roomId, {
        gameState: gameStateSnapshot,
      });

      return record;
    },
  }),
  joinGameV2: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🚀 ~ join game v2....");
      try {
        const pb = context.locals.pb;
        const currentPlayerId = context.locals.pb.authStore.model?.id;
        const currentPlayerName = context.locals.pb.authStore.model?.name;

        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchemaV2>(input.roomId);

        if (roomRecord.players.includes(currentPlayerId)) {
          return "you're already in this room";
        }

        const serverGameState = roomRecord.gameState;

        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: serverGameState,
          inspect: (inspectorEvent) => {
            console.dir(
              {
                "🔍 Inspector Event:": inspectorEvent,
              },
              { depth: null }
            );
          },
        }).start();

        gameStateMachineActor.send({
          type: "JOIN_GAME",
          playerId: currentPlayerId,
          playerName: currentPlayerName,
        });
        const gameStateSnapshot = gameStateMachineActor.getPersistedSnapshot();

        const record = await pb.collection("rooms").update(input.roomId, {
          players: [...roomRecord.players, currentPlayerId],
          gameState: gameStateSnapshot,
        });

        return record;
      } catch (e) {
        console.log("Server Error", JSON.stringify(e));
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error  join game room",
          stack: JSON.stringify(e),
        });
      }
    },
  }),

  playTurn: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
      cards: z.array(cardSchema),
    }),
    handler: async (input, context) => {
      try {
        const pb = context.locals.pb;
        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchema>(input.roomId);

        const currentGameState = roomRecord.gameState;

        const updatedPlayerIndex = rotatePlayerIndex({
          currentPlayerIndex: currentGameState.currentPlayerIndex,
          totalPlayers: currentGameState.players.length - 1, // start from 0
        });

        const updatedPlayerHands = updatePlayersHands({
          currentHand:
            currentGameState.players[currentGameState.currentPlayerIndex].hand,
          cardsToRemove: input.cards,
        });

        const playedHandType = detectHandType(input.cards);
        if (playedHandType === null) {
          throw new Error("invalid hand was played");
        }

        // This first move of the game bypasses the round mode check
        if (currentGameState.event === "round-first-move") {
          // check there is a 3 Diamond in the first play...
          // return

          const updatedGameState = produce(currentGameState, (newGameState) => {
            newGameState.currentPlayerIndex = updatedPlayerIndex;
            newGameState.players[currentGameState.currentPlayerIndex].hand =
              updatedPlayerHands;
            newGameState.roundMode = playedHandType;
            newGameState.roundNumber = newGameState.roundNumber += 1;
            newGameState.event = "player-played";
            newGameState.cardPile.push(input.cards);
            newGameState.consecutivePasses = 0;
          });

          const updatedRecord = await pb
            .collection("rooms")
            .update<RoomSchema>(input.roomId, {
              gameState: updatedGameState,
            });

          return updatedRecord;
        }

        if (currentGameState.event === "round-new") {
          const updatedGameState = produce(currentGameState, (newGameState) => {
            newGameState.currentPlayerIndex = updatedPlayerIndex;
            newGameState.players[currentGameState.currentPlayerIndex].hand =
              updatedPlayerHands;
            newGameState.roundMode = playedHandType;
            newGameState.roundNumber = newGameState.roundNumber += 1;
            newGameState.event = "player-played";
            newGameState.cardPile.push(input.cards);
            newGameState.consecutivePasses = 0;
          });

          const updatedRecord = await pb
            .collection("rooms")
            .update<RoomSchema>(input.roomId, {
              gameState: updatedGameState,
            });

          return updatedRecord;
        }

        // We must check that the played hands going forward is the same combo type
        // as the current round, unless the event has been won?

        if (playedHandType !== currentGameState.roundMode) {
          console.error("player did not play the right type of hand");
          return; //TODO return a common resp here
        }

        const cardsToBeat = currentGameState.cardPile.at(-1);
        if (!cardsToBeat) {
          throw new Error("Could not get last hand played on cardPile");
        }

        if (
          !isPlayedHandBigger({
            playedCards: input.cards,
            cardsToBeat,
            handType: currentGameState.roundMode,
          })
        ) {
          console.log("not enough to beat the current hand");
          return;
        }

        // Enter win state, when the player has no cards left.
        if (updatedPlayerHands.length === 0) {
          const updatedGameState = produce(currentGameState, (newGameState) => {
            newGameState.players[currentGameState.currentPlayerIndex].hand =
              updatedPlayerHands;
            newGameState.event = "game-ended";
            newGameState.cardPile.push(input.cards);
            newGameState.consecutivePasses = 0;
          });

          const updatedRecord = await pb
            .collection("rooms")
            .update<RoomSchema>(input.roomId, {
              gameState: updatedGameState,
            });

          return updatedRecord;
        }

        const updatedGameState = produce(currentGameState, (newGameState) => {
          newGameState.currentPlayerIndex = updatedPlayerIndex;
          newGameState.players[currentGameState.currentPlayerIndex].hand =
            updatedPlayerHands;
          newGameState.roundNumber = newGameState.roundNumber += 1;
          newGameState.event = "player-played";
          newGameState.cardPile.push(input.cards);
          newGameState.consecutivePasses = 0;
        });

        const updatedRecord = await pb
          .collection("rooms")
          .update<RoomSchema>(input.roomId, {
            gameState: updatedGameState,
          });

        return updatedRecord;
      } catch (e) {
        console.log("Server Error", JSON.stringify(e));
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error during play turn",
          stack: JSON.stringify(e),
        });
      }
    },
  }),
  passTurn: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input, context) => {
      try {
        const pb = context.locals.pb;
        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchema>(input.roomId);

        const currentGameState = roomRecord.gameState;

        if (currentGameState.event === "round-first-move") {
          throw new Error("Cant pass on the first move");
        }
        if (currentGameState.event === "round-new") {
          throw new Error("Cant pass on a new round");
        }

        const nextPlayerIndex = rotatePlayerIndex({
          currentPlayerIndex: currentGameState.currentPlayerIndex,
          totalPlayers: currentGameState.players.length - 1, // start from 0
        });
        const numberConsecutivePassesNeededToWinRound =
          roomRecord.players.length - 1; // 2 because we normalise player length to 0 and one more less from that;
        const updatedConsecutivePasses = currentGameState.consecutivePasses + 1;
        console.log(
          "🚀 ~ handler: ~ numberConsecutivePassesNeededToWinRound:",
          numberConsecutivePassesNeededToWinRound
        );

        // Handle when all players have passed
        if (
          updatedConsecutivePasses >= numberConsecutivePassesNeededToWinRound
        ) {
          console.log(
            "round was won by",
            currentGameState.players[nextPlayerIndex].name
          );
          const updatedGameState = produce(currentGameState, (newGameState) => {
            newGameState.consecutivePasses = 0;
            newGameState.event = "round-new";
            newGameState.currentPlayerIndex = nextPlayerIndex;
          });
          const updatedRecord = await pb
            .collection("rooms")
            .update<RoomSchema>(input.roomId, {
              gameState: updatedGameState,
            });

          return updatedRecord;
        }

        // Handle a player passing mid-round
        const updatedGameState: GameState = produce(
          currentGameState,
          (newGameState) => {
            newGameState.consecutivePasses =
              newGameState.consecutivePasses += 1;
            newGameState.event = "player-passed";
            newGameState.currentPlayerIndex = nextPlayerIndex;
          }
        );

        const updatedRecord = await pb
          .collection("rooms")
          .update<RoomSchema>(input.roomId, {
            gameState: updatedGameState,
          });

        return updatedRecord;
      } catch (e) {
        console.error("🚀 Pass turn error", e);
      }
    },
  }),
};
