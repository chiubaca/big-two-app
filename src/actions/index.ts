// import PocketBase from "pocketbase";
// const pb = new PocketBase("http://127.0.0.1:8090");

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import pbAdmin from "../libs/pocketbase-admin";

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
  createPost: defineAction({
    accept: "form",
    input: z.object({
      post: z.string(),
    }),
    handler: async (input, context) => {
      console.log("🚀 ~ handler: ~ input:", input);

      try {
        const { post } = input;

        if (!context.locals.pb.authStore.isValid) {
          console.log("user must be logged in to post");
          return null;
        }

        console.log("Ready to post...");

        const data = {
          user: [context.locals.pb.authStore.model?.id],
          content: post,
        };

        const record = await pbAdmin.collection("posts").create(data);
        console.log("🚀 ~ handler: ~ record:", record);

        return "hello";
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
};
