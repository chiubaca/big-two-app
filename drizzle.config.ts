import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: "./db/store.db",
  },
  schema: "./db/schema.ts",
  out: "./drizzle",
});
