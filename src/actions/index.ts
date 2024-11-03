// import PocketBase from "pocketbase";
// const pb = new PocketBase("http://127.0.0.1:8090");

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import pbAdmin from "../libs/pocketbase-admin";
import { createDeck } from "@chiubaca/big-two-utils";
import { baseGameState, type GameState } from "../helpers/gameState";

export const server = {
  signUp: defineAction({
    accept: "form",
    input: z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🚀 ~ handler: ~ input:", input);
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

        console.log("Ready to post...");

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
        // const newDeck = createDeck();

        const roomRecord = await pb.collection("rooms").getOne(input.roomId);

        const record = await pb.collection("rooms").update(input.roomId, {
          gameState: {
            players: roomRecord.players.map((playerId) => {
              return {
                id: playerId,
                hand: [],
              };
            }),
            currentPlayerIndex: 0,
            roundMode: "single",
          } satisfies GameState,
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
