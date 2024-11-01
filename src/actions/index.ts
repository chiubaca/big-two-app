import PocketBase from "pocketbase";
const pb = new PocketBase("http://127.0.0.1:8090");

import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { AstroError } from "astro/errors";

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

        const record = await pb.collection("users").create({
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
};
