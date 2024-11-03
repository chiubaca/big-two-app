import { useContext } from "react";
import {
  GameRoomContext,
  GameRoomProvider,
  type GameRoomContextType,
} from "./GameRoom/GameRoom.context";
import pbClient from "../libs/pocketbase-client";

interface GameRoomProps extends GameRoomContextType {}

export const GameRoom = ({ currentUserId, roomId, players }: GameRoomProps) => {
  return (
    <GameRoomProvider
      roomId={roomId}
      players={players}
      currentUserId={currentUserId}
    >
      <Player />
      <JoinLeaveRoom />
    </GameRoomProvider>
  );
};

const Player = () => {
  const { players } = useContext(GameRoomContext);
  console.log("🚀 ~ GameRoom ~ players:", players);

  return <> Players in this room: {JSON.stringify(players)}</>;
};

const JoinLeaveRoom = () => {
  const { currentUserId, players, roomId } = useContext(GameRoomContext);

  const handleLeaveRoom = async () => {
    const updatedPlayersList = players.filter((p) => p !== currentUserId);
    console.log("🚀 ~ JoinLeaveRoom ~ updatedPlayersList:", updatedPlayersList);
    await pbClient
      .collection("rooms")
      .update(roomId, { players: updatedPlayersList });
  };

  const handleJoinRoom = async () => {
    const updatedPlayersList = [...players, currentUserId];
    console.log("🚀 ~ JoinLeaveRoom ~ updatedPlayersList:", updatedPlayersList);
    await pbClient
      .collection("rooms")
      .update(roomId, { players: updatedPlayersList });
  };

  if (players.includes(currentUserId)) {
    return (
      <button type="button" onClick={handleLeaveRoom}>
        Leave room
      </button>
    );
  }

  return (
    <button type="button" onClick={handleJoinRoom}>
      Join room
    </button>
  );
};
