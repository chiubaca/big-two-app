/*
 * We can run @better-auth/cli@latest generate or npm run auth:generate to generate out auth related tables.
 * - https://www.better-auth.com/docs/installation
 * - https://www.better-auth.com/docs/concepts/cli
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, session, user, verification } from "db/schemas/auth-schema";
import { db } from "~libs/drizzle-orm/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    // Comment out schema object if generate doesn't work
    schema: {
      user: user,
      session: session,
      account: account,
      verification: verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
});
