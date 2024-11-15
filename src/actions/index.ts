import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createDeck, sortCards } from "@chiubaca/big-two-utils";
import { produce } from "immer";

import { dealArray, shuffleArray } from "~libs/helpers/deck";
import {
  type GameState,
  baseGameState,
  cardSchema,
  rotatePlayerIndex,
  updatePlayersHands,
} from "~libs/helpers/gameState";
import pbAdmin from "~libs/pocketbase/pocketbase-admin";
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
  createRoom: defineAction({
    accept: "form",
    input: z.object({
      roomName: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🚀 Create a room action", input);
      const currentUserId = context.locals.pb.authStore.model?.id;
      const currentPlayerName = context.locals.pb.authStore.model?.name;

      try {
        const { roomName } = input;

        if (!context.locals.pb.authStore.isValid) {
          console.log("user must be logged in to post");
          return null;
        }

        const data = {
          admin: currentUserId,
          players: [currentUserId],
          roomName,
          gameState: {
            ...baseGameState,
            players: [{ hand: [], id: currentUserId, name: currentPlayerName }],
          } satisfies GameState,
        };

        const record = await pbAdmin.collection("rooms").create(data);
        console.log("🚀 ~ handler: ~ record:", record);

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

  startGame: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🚀 ~ start game handler");
      try {
        const pb = context.locals.pb;
        const newDeck = createDeck();

        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchema>(input.roomId);

        const playerNames = roomRecord.gameState.players.map((p) => p.name);

        const shuffledDeck = shuffleArray(newDeck);
        const dealtCards = dealArray(shuffledDeck, roomRecord.players.length);

        const updatedGameState = {
          players: roomRecord.players.map((playerId, index) => {
            return {
              id: playerId,
              hand: sortCards(dealtCards[index]),
              name: playerNames[index],
            };
          }),
          currentPlayerIndex: 0,
          roundMode: "single",
          roundNumber: 0,
          status: "started",
        } satisfies GameState;
        console.dir(updatedGameState, { depth: null });

        const record = await pb.collection("rooms").update(input.roomId, {
          gameState: updatedGameState,
        });

        return record;
      } catch (e) {
        console.log("Server Error", JSON.stringify(e));
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error starting game",
          stack: JSON.stringify(e),
        });
      }
    },
  }),
  joinGame: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🚀 ~ join game");
      try {
        const pb = context.locals.pb;
        const currentPlayerId = context.locals.pb.authStore.model?.id;
        const currentPlayerName = context.locals.pb.authStore.model?.name;

        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchema>(input.roomId);

        if (roomRecord.players.includes(currentPlayerId)) {
          return "you're already in this room";
        }
        const updatedPlayers = [...roomRecord.players, currentPlayerId];
        const updatedGameState = {
          ...roomRecord.gameState,
          players: [
            ...roomRecord.gameState.players,
            { id: currentPlayerId, name: currentPlayerName, hand: [] },
          ],
        } satisfies GameState;

        console.dir(roomRecord, { depth: null });

        const record = await pb.collection("rooms").update(input.roomId, {
          players: updatedPlayers,
          gameState: updatedGameState,
        });

        return "record";
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
  leaveGame: defineAction({
    accept: "json",
    input: z.object({
      roomId: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🚀 ~ leave game");
      try {
        const pb = context.locals.pb;
        const currentPlayerId = context.locals.pb.authStore.model?.id;

        const roomRecord = await pb
          .collection("rooms")
          .getOne<RoomSchema>(input.roomId);

        if (roomRecord.admin === currentPlayerId) {
          console.log("you cant leave a room are admin of");
          return "you cant leave a room are admin of";
        }

        // update players array
        const updatedPlayers = roomRecord.players.filter(
          (playerId) => playerId !== currentPlayerId
        );

        // update gameState players
        const updateGameState = {
          ...roomRecord.gameState,
          players: roomRecord.gameState.players.filter(
            (player) => player.id !== currentPlayerId
          ),
        } satisfies GameState;

        const updatedRecord = pb
          .collection("rooms")
          .update<RoomSchema>(input.roomId, {
            players: updatedPlayers,
            gameState: updateGameState,
          });

        return updatedRecord;
      } catch (e) {
        console.log("Server Error", JSON.stringify(e));
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error leaving game room",
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

        const updatedGameState = produce(currentGameState, (newGameState) => {
          newGameState.currentPlayerIndex = updatedPlayerIndex;
          newGameState.players[currentGameState.currentPlayerIndex].hand =
            updatedPlayerHands;
        });

        console.log("🚀 ~ handler: ~ input:", input);
        const updatedRecord = pb
          .collection("rooms")
          .update<RoomSchema>(input.roomId, {
            gameState: updatedGameState,
          });

        return updatedRecord;
      } catch (e) {
        console.log("🚀 ~ handler: ~ e:", e);
      }
    },
  }),
};
