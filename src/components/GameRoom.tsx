import { useContext } from "react";
import {
  GameRoomContext,
  GameRoomProvider,
  type InitialGameRoomContextProps,
} from "./GameRoom/GameRoom.context";
import pbClient from "../libs/pocketbase-client";

interface GameRoomProps extends InitialGameRoomContextProps {}

export const GameRoom = ({
  currentUserId,
  roomId,
  players,
  gameState,
}: GameRoomProps) => {
  return (
    <GameRoomProvider
      roomId={roomId}
      gameState={gameState}
      players={players}
      currentUserId={currentUserId}
    >
      <Player />
      <Game />
      <JoinLeaveRoom />
    </GameRoomProvider>
  );
};

const Player = () => {
  const { players } = useContext(GameRoomContext);

  return (
    <>
      <div>Players in this room: {JSON.stringify(players)}</div>
    </>
  );
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

const Game = () => {
  const { handleStartGame, gameState } = useContext(GameRoomContext);
  console.log("🚀 ~ Game ~ gameState:", gameState);

  return (
    <div>
      <button type="button" onClick={() => handleStartGame()}>
        Start Game
      </button>

      <code>{JSON.stringify(gameState)}</code>
    </div>
  );
};
