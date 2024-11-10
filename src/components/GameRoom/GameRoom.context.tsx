import {
  createContext,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import type { RecordModel } from "pocketbase";
import pbClient from "~libs/pocketbase/pocketbase-client";
import { actions, type SafeResult } from "astro:actions";
import { baseGameState, type GameState } from "../../helpers/gameState";

type GameRoomContextType = {
  roomId: string;
  players: string[];
  currentUserId: string;
  gameState: GameState;
  handleStartGame: () => Promise<
    SafeResult<
      {
        roomId: string;
      },
      RecordModel
    >
  >;
};

export type InitialGameRoomContextProps = Pick<
  GameRoomContextType,
  "roomId" | "players" | "currentUserId" | "gameState"
>;

export const GameRoomContext = createContext<GameRoomContextType>({
  roomId: "",
  players: [],
  currentUserId: "",
  gameState: baseGameState,
  handleStartGame: () => {
    throw new Error("used outside of provider");
  },
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

  const handleStartGame = async () => await actions.startGame({ roomId });

  return (
    <GameRoomContext.Provider
      value={{
        roomId,
        players,
        currentUserId,
        gameState,
        handleStartGame,
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
  initialGameState: GameState;
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
