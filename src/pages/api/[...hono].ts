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

import type TypedEmitter from "typed-emitter";
import type { Card } from "@chiubaca/big-two-utils";
declare module "hono" {
  interface ContextVariableMap {
    locals: APIContext["locals"];
  }
}

type MessageEvents = {
  [key: `gameStateUpdated:${string}`]: (
    body: BigTwoGameMachineSnapshot
  ) => void;
};

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

const emitter = new EventEmitter() as TypedEmitter<MessageEvents>;
// Create a factory function that returns the configured app
const createHonoApp = (astroLocals: APIContext["locals"]) => {
  const app = new Hono()
    .basePath("/api/")
    .use("*", astroLocalsMiddleware(astroLocals))
    .get("/test", authMiddleware, async (c) => {
      return c.json(["'you're in!"]);
    })
    .get("/realtime/gamestate/:roomId", async (c) => {
      const roomId = c.req.param("roomId");
      const { user } = c.get("locals");

      return streamSSE(c, async (stream) => {
        console.log(`${user?.name} has connected to room ${roomId}`);
        let running = true;

        const gameStateUpdatedListener = (
          gameState: BigTwoGameMachineSnapshot
        ) => {
          // console.log("🚀 ~ userInsertedListener ~ user:", gameState);
          stream.writeSSE({
            event: `gameStateUpdated:${roomId}`,
            data: JSON.stringify(gameState),
          });
        };

        stream.onAbort(() => {
          running = false;
          console.log("disconnected in abort signal");
          emitter.off(`gameStateUpdated:${roomId}`, gameStateUpdatedListener); // Clean up listener
        });

        emitter.on(`gameStateUpdated:${roomId}`, gameStateUpdatedListener);

        while (running) {
          await new Promise((resolve) => {
            // console.log(`monitoring room ${roomId} for ${user?.name}`);
            setTimeout(resolve, 10000);
          });
        }

        console.log("disconnected after while loop");
      });
    })
    .post(
      "createRoom",
      zValidator("json", z.object({ roomName: z.string() })),
      async (c) => {
        console.log("create room api");

        const { roomName } = c.req.valid("json");
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
          await db.select().from(gameRoom).where(eq(gameRoom.id, roomId))
        )[0];

        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: gameState,
        }).start();

        gameStateMachineActor.send({ type: "START_GAME" });
        const gameStateSnapshot =
          gameStateMachineActor.getPersistedSnapshot() as BigTwoGameMachineSnapshot;

        await db
          .update(gameRoom)
          .set({ gameState: gameStateSnapshot })
          .where(eq(gameRoom.id, roomId));

        emitter.emit(`gameStateUpdated:${roomId}`, gameStateSnapshot);
        return c.text("game state updated");
      }
    )
    .post(
      "joinGame",
      zValidator("json", z.object({ roomId: z.string() })),
      async (c) => {
        const { roomId } = c.req.valid("json");
        const { user } = c.get("locals");

        if (!user) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const { gameState } = (
          await db.select().from(gameRoom).where(eq(gameRoom.id, roomId))
        )[0];

        if (gameState.context.players.map((p) => p.id).includes(user.id)) {
          return c.text("you have already joined this room");
        }

        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: gameState,
        }).start();

        gameStateMachineActor.send({
          type: "JOIN_GAME",
          playerId: user.id,
          playerName: user.name,
        });
        const gameStateSnapshot =
          gameStateMachineActor.getPersistedSnapshot() as BigTwoGameMachineSnapshot;

        await db
          .update(gameRoom)
          .set({ gameState: gameStateSnapshot })
          .where(eq(gameRoom.id, roomId));

        emitter.emit(`gameStateUpdated:${roomId}`, gameStateSnapshot);

        return c.text("joined game");
      }
    )
    .post(
      "resetGame",
      zValidator("json", z.object({ roomId: z.string() })),
      async (c) => {
        const { roomId } = c.req.valid("json");
        const { user } = c.get("locals");

        if (!user) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const { gameState } = (
          await db.select().from(gameRoom).where(eq(gameRoom.id, roomId))
        )[0];

        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: gameState,
        }).start();

        gameStateMachineActor.send({
          type: "RESET_GAME",
        });

        const gameStateSnapshot =
          gameStateMachineActor.getPersistedSnapshot() as BigTwoGameMachineSnapshot;

        await db
          .update(gameRoom)
          .set({ gameState: gameStateSnapshot })
          .where(eq(gameRoom.id, roomId));

        emitter.emit(`gameStateUpdated:${roomId}`, gameStateSnapshot);

        return c.text("game reset");
      }
    )
    .post(
      "playTurn",
      zValidator(
        "json",
        z.object({
          roomId: z.string(),
          cards: z.array(z.custom<Card>()),
        })
      ),
      async (c) => {
        const { roomId, cards } = c.req.valid("json");
        const { user } = c.get("locals");

        if (!user) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const { gameState } = (
          await db.select().from(gameRoom).where(eq(gameRoom.id, roomId))
        )[0];

        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: gameState,
        }).start();

        if (gameState.value === "ROUND_FIRST_MOVE") {
          console.log("🟢 Playing round first move");
          gameStateMachineActor.send({
            type: "PLAY_FIRST_MOVE",
            cards,
          });

          const gameStateSnapshot =
            gameStateMachineActor.getPersistedSnapshot() as BigTwoGameMachineSnapshot;

          await db
            .update(gameRoom)
            .set({ gameState: gameStateSnapshot })
            .where(eq(gameRoom.id, roomId));

          emitter.emit(`gameStateUpdated:${roomId}`, gameStateSnapshot);
          return c.text("player played the first move");
        }

        console.log("🟢 Playing next player cards");
        gameStateMachineActor.send({
          type: "PLAY_CARDS",
          cards,
        });

        const gameStateSnapshot =
          gameStateMachineActor.getPersistedSnapshot() as BigTwoGameMachineSnapshot;

        await db
          .update(gameRoom)
          .set({ gameState: gameStateSnapshot })
          .where(eq(gameRoom.id, roomId));

        emitter.emit(`gameStateUpdated:${roomId}`, gameStateSnapshot);
        return c.text("player played next move");
      }
    )
    .post(
      "passTurn",
      zValidator(
        "json",
        z.object({
          roomId: z.string(),
        })
      ),
      async (c) => {
        const { roomId } = c.req.valid("json");
        const { user } = c.get("locals");

        if (!user) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const { gameState } = (
          await db.select().from(gameRoom).where(eq(gameRoom.id, roomId))
        )[0];

        const bigTwoGameMachine = makeBigTwoGameMachine();
        const gameStateMachineActor = createActor(bigTwoGameMachine, {
          snapshot: gameState,
        }).start();

        console.log("🟢 Player passing turn");
        gameStateMachineActor.send({
          type: "PASS_TURN",
          playerId: user.id,
        });

        await db
          .update(gameRoom)
          .set({ gameState })
          .where(eq(gameRoom.id, roomId));

        emitter.emit(`gameStateUpdated:${roomId}`, gameState);
        return c.text("player passed");
      }
    );

  return app;
};

export const ALL: APIRoute = (context) => {
  const app = createHonoApp(context.locals);
  return app.fetch(context.request);
};

export type AppType = ReturnType<typeof createHonoApp>;
