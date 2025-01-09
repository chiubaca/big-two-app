import { type SafeResult, actions } from "astro:actions";
// import type { RecordModel } from "pocketbase";
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
  const { players, gameState } = useSubscribeToPlayers({
    roomId,
    // initialPlayers,
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
  // initialPlayers,
  initialGameState,
}: {
  roomId: string;
  // initialPlayers: string[];
  initialGameState: Room["gameState"];
}) => {
  // const [players, setPlayers] = useState<string[]>(initialPlayers);

  const [gameState, setGameState] = useState(initialGameState);

  // const handleUpdatePlayers = async (record: RecordModel) => {
  //   // TODO: later will need to lookup each player to get names
  //   setPlayers(record.players);
  // };

  // const handleNewGameState = (record: RecordModel) => {
  //   setGameState(record.gameState);
  // };

  useEffect(() => {
    console.log("yo clientside!", honoClient.api.sse2.$url().toString());

    const evtSource = new EventSource(honoClient.api.sse2.$url().toString());

    evtSource.addEventListener("gameStateUpdated", (event) => {
      const gameContext = JSON.parse(event.data);
      console.log("🚀 ~ app.get ~ event:", gameContext);
      // setGameState(gameContext);
    });
  });

  return { gameState };
};
