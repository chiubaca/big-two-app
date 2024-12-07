import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createActor } from "xstate";

import pbAdmin from "~libs/pocketbase/pocketbase-admin";
import {
  makeBigTwoGameMachine,
  type BigTwoGameMachineSnapshot,
  type RoomSchema as RoomSchemaV2,
} from "~libs/helpers/gameStateMachine";

import type { RoomSchema } from "~libs/schemas/rooms";
import type { Card } from "@chiubaca/big-two-utils";

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

  playTurnV2: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
      cards: z.array(z.custom<Card>()),
    }),
    handler: async (input, context) => {
      try {
        const pb = context.locals.pb;
        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchemaV2>(input.roomId);
        const serverGameState = roomRecord.gameState;
        const currentGameState = roomRecord.gameState;
        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: serverGameState,
        }).start();

        if (currentGameState.value === "ROUND_FIRST_MOVE") {
          console.log("🟢 Playing round first move");
          gameStateMachineActor.send({
            type: "PLAY_FIRST_MOVE",
            cards: input.cards,
          });

          const gameStateSnapshot =
            gameStateMachineActor.getPersistedSnapshot();
          console.log("🚀 ~ handler: ~ gameStateSnapshot:", gameStateSnapshot);
          const record = await pb.collection("rooms").update(input.roomId, {
            gameState: gameStateSnapshot,
          });

          return record;
        }

        if (currentGameState.value === "PLAY_NEW_ROUND") {
          console.log("🟢 Playing new round first move");
          gameStateMachineActor.send({
            type: "PLAY_NEW_ROUND_FIRST_MOVE",
            cards: input.cards,
          });

          const gameStateSnapshot =
            gameStateMachineActor.getPersistedSnapshot();

          const record = await pb.collection("rooms").update(input.roomId, {
            gameState: gameStateSnapshot,
          });

          return record;
        }

        console.log("🟢 Playing next player cards");
        gameStateMachineActor.send({
          type: "PLAY_CARDS",
          cards: input.cards,
        });

        const gameStateSnapshot = gameStateMachineActor.getPersistedSnapshot();

        const record = await pb.collection("rooms").update(input.roomId, {
          gameState: gameStateSnapshot,
        });

        return record;
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

  resetGame: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input, context) => {
      try {
        const pb = context.locals.pb;
        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchemaV2>(input.roomId);
        const serverGameState = roomRecord.gameState;
        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: serverGameState,
        }).start();

        console.log("🟢 resetting game");
        gameStateMachineActor.send({
          type: "RESET_GAME",
        });

        const gameStateSnapshot = gameStateMachineActor.getPersistedSnapshot();

        const record = await pb.collection("rooms").update(input.roomId, {
          gameState: gameStateSnapshot,
        });

        return record;
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
  passTurnV2: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input, context) => {
      try {
        const pb = context.locals.pb;
        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchemaV2>(input.roomId);
        const serverGameState = roomRecord.gameState;
        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: serverGameState,
        }).start();

        console.log("🟢 Player passing turn");
        gameStateMachineActor.send({
          type: "PASS_TURN",
          playerId: context.locals.pb.authStore.model?.id,
        });

        const gameStateSnapshot = gameStateMachineActor.getPersistedSnapshot();

        const record = await pb.collection("rooms").update(input.roomId, {
          gameState: gameStateSnapshot,
        });

        return record;
      } catch (e) {
        console.log("Server Error", JSON.stringify(e));
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error during pass turn",
          stack: JSON.stringify(e),
        });
      }
    },
  }),
};
