import { Hono } from "hono";
import { createMiddleware } from "hono/factory";

import type { APIRoute } from "astro";
import { streamSSE } from "hono/streaming";
import { EventEmitter } from "node:events";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "~auth";

const emitter = new EventEmitter();

const app = new Hono().basePath("/api/");

// Auth middleware remains the same
const authMiddleware = createMiddleware(async (c, next) => {
  const sessionToken = c.req.header("better-auth.session_token");
  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const session = await auth.api.getSession({
      headers: new Headers({
        "better-auth.session_token": sessionToken,
      }),
    });
    c.set("session", session);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid session" }, 401);
  }
});

app.post(
  "createUser",
  zValidator(
    "form",
    z.object({
      name: z.string(),
    })
  ),
  async (c) => {
    const validated = c.req.valid("form");
    // const user = await db
    //   .insert(users)
    //   .values({ name: validated.name })
    //   .returning({
    //     id: users.id,
    //     name: users.name,
    //   });

    emitter.emit("userInserted", validated.name);

    c.header("Content-Type", "text/plain");
    return c.text("works!", 201);
  }
);

app.get("/sse2", async (c) => {
  return streamSSE(c, async (stream) => {
    console.log("client connected!");
    let running = true;

    stream.writeSSE({
      event: "userInserted",
      data: "sse stream started..",
    });

    // Listen for user insertion events
    const userInsertedListener = (user: any) => {
      console.log("🚀 ~ userInsertedListener ~ user:", user);
      stream.writeSSE({
        event: "userInserted",
        data: JSON.stringify(user),
      });
    };

    stream.onAbort(() => {
      running = false;
    }); // Handle disconnection

    emitter.on("userInserted", userInsertedListener);

    while (running) {
      // Keep SSE connection alive; actual event listening is done via emitter
      await new Promise((resolve) => {
        console.log("keep alive...");
        setTimeout(resolve, 10000);
      }); // Keep connection alive with periodic pings if needed
    }

    console.log("disconneted");
    // // Cleanup listener when client disconnects
    // emitter.off("userInserted", userInsertedListener);
  });
});

app.get("/test", authMiddleware, async (c) => {
  return c.json(["'you're in!"]);
});

export const ALL: APIRoute = (context) => {
  console.log("🚀 ~ context:", context.locals.user);
  return app.fetch(context.request);
};
