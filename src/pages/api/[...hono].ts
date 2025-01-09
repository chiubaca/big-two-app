import { Hono, type MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import type { APIContext, APIRoute } from "astro";
import { streamSSE } from "hono/streaming";
import { EventEmitter } from "node:events";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  makeBigTwoGameMachine,
  type BigTwoGameMachineSnapshot,
} from "~libs/helpers/gameStateMachine";
import { createActor, type Snapshot } from "xstate";
import { db } from "~libs/drizzle-orm/db";
import { gameRoom } from "db/schemas/schema";
import { eq } from "drizzle-orm";

declare module "hono" {
  interface ContextVariableMap {
    locals: APIContext["locals"];
  }
}

const emitter = new EventEmitter();

const astroLocalsMiddleware = (
  astroLocals: APIContext["locals"]
): MiddlewareHandler => {
  return async (c, next) => {
    c.set("locals", astroLocals);
    await next();
  };
};

const authMiddleware = createMiddleware(async (c, next) => {
  const { session } = c.get("locals");

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    await next();
  } catch (error) {
    return c.json({ error: "Invalid session" }, 401);
  }
});

// Create a factory function that returns the configured app
const createHonoApp = (astroLocals: APIContext["locals"]) => {
  const app = new Hono()
    .basePath("/api/")
    .use("*", astroLocalsMiddleware(astroLocals))
    .get("/test", authMiddleware, async (c) => {
      return c.json(["'you're in!"]);
    })
    .get("/sse2", async (c) => {
      return streamSSE(c, async (stream) => {
        console.log("client connected!");
        let running = true;

        // stream.writeSSE({
        //   event: "gameStateUpdated",
        //   data: "sse stream started..",
        // });

        const userInsertedListener = (gameState: any) => {
          console.log("🚀 ~ userInsertedListener ~ user:", gameState);
          stream.writeSSE({
            event: "gameStateUpdated",
            data: JSON.stringify(gameState),
          });
        };

        stream.onAbort(() => {
          running = false;
          emitter.off("userInserted", userInsertedListener); // Clean up listener
        });

        emitter.on("userInserted", userInsertedListener);

        while (running) {
          await new Promise((resolve) => {
            console.log("keep alive...");
            setTimeout(resolve, 10000);
          });
        }

        console.log("disconnected");
      });
    })
    .post(
      "createRoom",
      zValidator("form", z.object({ roomName: z.string() })),
      async (c) => {
        const { roomName } = c.req.valid("form");
        const { user } = c.get("locals");

        if (!user) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine).start();
        gameStateMachineActor.send({
          type: "JOIN_GAME",
          playerId: user.id,
          playerName: user.name,
        });
        const gameStateSnapshot =
          gameStateMachineActor.getPersistedSnapshot() as BigTwoGameMachineSnapshot;

        await db.insert(gameRoom).values({
          roomName,
          creatorId: user.id,
          gameState: gameStateSnapshot,
        });

        return c.text("room created");
      }
    )
    .post(
      "createUser",
      zValidator(
        "form",
        z.object({
          name: z.string(),
        })
      ),
      async (c) => {
        const validated = c.req.valid("form");
        emitter.emit("userInserted", validated.name);
        c.header("Content-Type", "text/plain");
        return c.text("works!", 201);
      }
    )
    .post(
      "startGame",
      zValidator(
        "json",
        z.object({
          roomId: z.string(),
        })
      ),
      async (c) => {
        const { roomId } = c.req.valid("json");
        const { user } = c.get("locals");
        const { gameState } = (
          await db
            .select()
            .from(gameRoom)
            .where(eq(gameRoom.id, Number(roomId)))
        )[0];

        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: gameState as BigTwoGameMachineSnapshot,
        }).start();

        gameStateMachineActor.send({ type: "START_GAME" });
        const gameStateSnapshot = gameStateMachineActor.getPersistedSnapshot();

        await db
          .update(gameRoom)
          .set({ gameState: gameStateSnapshot })
          .where(eq(gameRoom.id, Number(roomId)));

        emitter.emit("gameStateUpdated", gameStateSnapshot);
      }
    );

  return app;
};

export const ALL: APIRoute = (context) => {
  const app = createHonoApp(context.locals);
  return app.fetch(context.request);
};

export type AppType = ReturnType<typeof createHonoApp>;
