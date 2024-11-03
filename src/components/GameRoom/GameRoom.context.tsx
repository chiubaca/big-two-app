import {
  createContext,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import pbClient from "../../libs/pocketbase-client";
import type { RecordModel } from "pocketbase";

export type GameRoomContextType = {
  roomId: string;
  players: string[];
  currentUserId: string;
};
export const GameRoomContext = createContext<GameRoomContextType>({
  roomId: "",
  players: [],
  currentUserId: "",
});

export const GameRoomProvider = ({
  currentUserId,
  players: initialPlayers,
  roomId,
  children,
}: PropsWithChildren<GameRoomContextType>) => {
  const { players } = useSubscribeToPlayers({ roomId, initialPlayers });
  return (
    <GameRoomContext.Provider
      value={{
        roomId,
        players,
        currentUserId,
      }}
    >
      {children}
    </GameRoomContext.Provider>
  );
};

const useSubscribeToPlayers = ({
  roomId,
  initialPlayers,
}: {
  roomId: string;
  initialPlayers: string[];
}) => {
  const [players, setPlayers] = useState<string[]>(initialPlayers);

  const handleUpdatePlayers = async (record: RecordModel) => {
    // TODO: later will need to lookup each player to get names
    setPlayers(record.players);
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
        }

        // Cleanup subscription on component unmount
        return () => {
          pbClient.collection("rooms").unsubscribe();
        };
      },
      []
    );
  });

  return { players };
};
