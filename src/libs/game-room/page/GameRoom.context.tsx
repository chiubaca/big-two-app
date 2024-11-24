import { type SafeResult, actions } from "astro:actions";
import type { RecordModel } from "pocketbase";
import {
  type FC,
  type PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from "react";
import type { RoomSchema } from "~libs/helpers/gameStateMachine";
import pbClient from "~libs/pocketbase/pocketbase-client";

type GameRoomContextType = {
  roomId: string;
  players: string[];
  currentUserId: string;
  gameState: RoomSchema["gameState"];
};

export type InitialGameRoomContextProps = Pick<
  GameRoomContextType,
  "roomId" | "players" | "currentUserId" | "gameState"
>;

export const GameRoomContext = createContext<GameRoomContextType>({
  roomId: "",
  players: [],
  currentUserId: "",
  gameState: {} as RoomSchema["gameState"],
});

export const GameRoomProvider = ({
  currentUserId,
  players: initialPlayers,
  roomId,
  children,
  gameState: initialGameState,
}: PropsWithChildren<InitialGameRoomContextProps>) => {
  const { players, gameState } = useSubscribeToPlayers({
    roomId,
    initialPlayers,
    initialGameState,
  });

  return (
    <GameRoomContext.Provider
      value={{
        roomId,
        players,
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
  initialPlayers,
  initialGameState,
}: {
  roomId: string;
  initialPlayers: string[];
  // initialGameState: GameState;
  initialGameState: RoomSchema["gameState"];
}) => {
  const [players, setPlayers] = useState<string[]>(initialPlayers);

  const [gameState, setGameState] = useState(initialGameState);

  const handleUpdatePlayers = async (record: RecordModel) => {
    // TODO: later will need to lookup each player to get names
    setPlayers(record.players);
  };

  const handleNewGameState = (record: RecordModel) => {
    setGameState(record.gameState);
  };

  useEffect(() => {
    console.log(`subscribing to room ${roomId}`, pbClient.authStore);

    // Subscribe to changes in posts collection
    pbClient.collection("rooms").subscribe(
      roomId,
      async (event) => {
        const { action, record } = event;
        console.log({ action, record });

        if (action === "update") {
          await handleUpdatePlayers(record);
          handleNewGameState(record);
        }

        // Cleanup subscription on component unmount
        return () => {
          console.log("cleanup");
          pbClient.collection("rooms").unsubscribe();
        };
      },
      []
    );
  });

  return { players, gameState };
};
