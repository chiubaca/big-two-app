import {
  type FC,
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";
import { honoClient } from "~libs/hono-actions";
// import pbClient from "~libs/pocketbase/pocketbase-client";
import type { Room } from "~libs/types/Room";

type GameRoomContextType = {
  roomId: string;
  // players: string[];
  currentUserId: string;
  gameState: Room["gameState"];
};

export type InitialGameRoomContextProps = Pick<
  GameRoomContextType,
  "roomId" | "currentUserId" | "gameState"
>;

export const GameRoomContext = createContext<GameRoomContextType>({
  roomId: "",
  // players: [],
  currentUserId: "",
  gameState: {} as Room["gameState"],
});

export const GameRoomProvider = ({
  currentUserId,
  // players: initialPlayers,
  roomId,
  children,
  gameState: initialGameState,
}: PropsWithChildren<InitialGameRoomContextProps>) => {
  const { gameState } = useSubscribeToPlayers({
    roomId,

    initialGameState,
  });

  return (
    <GameRoomContext.Provider
      value={{
        roomId,
        // players,
        currentUserId,
        gameState,
      }}
    >
      {children}
    </GameRoomContext.Provider>
  );
};

const useSubscribeToPlayers = ({
  roomId,
  initialGameState,
}: {
  roomId: string;
  initialGameState: Room["gameState"];
}) => {
  const [gameState, setGameState] = useState(initialGameState);

  useEffect(() => {
    const evtSource = new EventSource(
      honoClient.api.realtime.gamestate[":roomId"]
        .$url({ param: { roomId } })
        .toString()
    );

    const gameStateUpdatedListener = (event: MessageEvent) => {
      const gameContext = JSON.parse(event.data);
      console.log("🚀 ~ app.get ~ event:", gameContext);
      setGameState(gameContext);
    };

    evtSource.addEventListener(
      `gameStateUpdated:${roomId}`,
      gameStateUpdatedListener
    );

    return () => {
      evtSource.removeEventListener(
        `gameStateUpdated:${roomId}`,
        gameStateUpdatedListener
      );
      evtSource.close(); // Clean up the EventSource
    };
  }, [roomId]); // Add roomId as a dependency

  return { gameState };
};
