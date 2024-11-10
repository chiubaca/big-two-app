import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createDeck, sortCards } from "@chiubaca/big-two-utils";

import { dealArray, shuffleArray } from "~libs/helpers/deck";
import { type GameState, baseGameState } from "~libs/helpers/gameState";
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

      try {
        const { roomName } = input;

        if (!context.locals.pb.authStore.isValid) {
          console.log("user must be logged in to post");
          return null;
        }

        const data = {
          admin: context.locals.pb.authStore.model?.id,
          players: [context.locals.pb.authStore.model?.id],
          roomName,
          gameState: {
            ...baseGameState,
            players: [{ hand: [], id: context.locals.pb.authStore.model?.id }],
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

        const shuffledDeck = shuffleArray(newDeck);
        const dealtCards = dealArray(shuffledDeck, roomRecord.players.length);

        const updatedGameState = {
          players: roomRecord.players.map((playerId, index) => {
            return {
              id: playerId,
              hand: sortCards(dealtCards[index]),
            };
          }),
          currentPlayerIndex: 0,
          roundMode: "single",
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
};
