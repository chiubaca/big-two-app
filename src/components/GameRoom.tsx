import type { Card } from "@chiubaca/big-two-utils";
import { useContext } from "react";
import pbClient from "~libs/pocketbase/pocketbase-client";
import {
  GameRoomContext,
  GameRoomProvider,
  type InitialGameRoomContextProps,
} from "./GameRoom/GameRoom.context";

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
      <div className="m-3 text-lg">
        Players in this room: {JSON.stringify(players)}
      </div>
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

    await pbClient
      .collection("rooms")
      .update(roomId, { players: updatedPlayersList });
  };

  if (players.includes(currentUserId)) {
    return (
      <button
        className="btn btn-warning m-3"
        type="button"
        onClick={handleLeaveRoom}
      >
        Leave room
      </button>
    );
  }

  return (
    <button
      className="btn btn-primary m-3"
      type="button"
      onClick={handleJoinRoom}
    >
      Join room
    </button>
  );
};

const suitIconMapper = (suit: Card["suit"]) => {
  const mapper: Record<Card["suit"], string> = {
    DIAMOND: "♦️",
    CLUB: "️♣️",
    HEART: "♥️",
    SPADE: "♠️",
  };
  return mapper[suit];
};

const cardColourMapper = (suit: Card["suit"]) => {
  return suit === "HEART" || suit === "DIAMOND" ? "text-red-500" : "text-black";
};

const Game = () => {
  const { handleStartGame, gameState, currentUserId } =
    useContext(GameRoomContext);

  const currentPlayerIdTurn =
    gameState.players[gameState.currentPlayerIndex].id;

  const isCurrentPlayerTurn = currentPlayerIdTurn === currentUserId;

  return (
    <div>
      <button className="btn" type="button" onClick={() => handleStartGame()}>
        Start Game
      </button>

      <div>
        <div className="flex flex-col gap-5">
          {gameState.players.map((player, idx) => {
            return (
              <div key={player.id}>
                {player.id}:
                <div className="flex flex-wrap gap-2">
                  {player.hand.map((card) => {
                    return (
                      <div
                        key={card.value + card.suit}
                        className={`card card-bordered shadow-sm  p-4 ${cardColourMapper(card.suit)}`}
                      >
                        {suitIconMapper(card.suit)} {card.value}
                      </div>
                    );
                  })}{" "}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <button type="button">
          {isCurrentPlayerTurn ? "play your turn" : "its not your turn"}
        </button>
      </div>
    </div>
  );
};
