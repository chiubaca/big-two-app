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
  const { handleStartGame, gameState, currentUserId } =
    useContext(GameRoomContext);

  const currentPlayerIdTurn =
    gameState.players[gameState.currentPlayerIndex].id;

  const isCurrentPlayerTurn = currentPlayerIdTurn === currentUserId;

  return (
    <div>
      <button type="button" onClick={() => handleStartGame()}>
        Start Game
      </button>

      <code>{JSON.stringify(gameState)}</code>

      <div>
        <button type="button">
          {isCurrentPlayerTurn ? "play your turn" : "its not your turn"}
        </button>
      </div>
    </div>
  );
};
