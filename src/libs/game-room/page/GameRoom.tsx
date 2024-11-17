import { actions } from "astro:actions";
import type { Card } from "@chiubaca/big-two-utils";
import { useContext, useState } from "react";
import {
  GameRoomContext,
  GameRoomProvider,
  type InitialGameRoomContextProps,
} from "./GameRoom.context";

import "../../../base.css";
import { PlayingCard } from "../components/PlayingCard";
import { detectHandType } from "~libs/helpers/gameState";

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
  const { gameState, currentUserId } = useContext(GameRoomContext);

  return (
    <>
      <div className="m-3 text-lg">
        Players in this room:
        <ol>
          {gameState.players.map((player) => (
            <li key={player.id}>
              {player.name} (<code>{player.id}</code>)
              {player.id === currentUserId && "(you)"}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
};

const JoinLeaveRoom = () => {
  const { currentUserId, players, roomId } = useContext(GameRoomContext);

  const handleLeaveRoom = async () => {
    await actions.leaveGame({ roomId });
  };

  const handleJoinRoom = async () => {
    await actions.joinGame({
      roomId,
    });
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

const Game = () => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const isValidPlay = detectHandType(selectedCards);

  const { handleStartGame, gameState, currentUserId, roomId } =
    useContext(GameRoomContext);

  const currentPlayerIdTurn =
    gameState.players[gameState.currentPlayerIndex].id;

  const isCurrentPlayerTurn = currentPlayerIdTurn === currentUserId;

  const thisPlayerIndex = gameState.players.findIndex(
    (player) => player.id === currentUserId
  );

  const lastHandPlayed = gameState.cardPile.at(-1);

  const toggleSelectedCard = (card: Card) => {
    const isCardSelected = selectedCards.some(
      (selectedCard) =>
        selectedCard.suit === card.suit && selectedCard.value === card.value
    );
    if (isCardSelected) {
      setSelectedCards(
        selectedCards.filter(
          (selectedCard) =>
            selectedCard.suit !== card.suit || selectedCard.value !== card.value
        )
      );
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  return (
    <div className="p-5">
      <div className="p-5 font-semibold text-center">
        <p>
          round mode: <code>{gameState.roundMode}</code>
        </p>
        <p>
          game event: <code>{gameState.event}</code>
        </p>
      </div>

      <button className="btn" type="button" onClick={() => handleStartGame()}>
        Start Game
      </button>

      {/* DEBUGGING STUFF */}
      <details className="flex flex-col gap-5 py-10 border border-dashed p-5 my-5 border-gray-400">
        <h1> Everyones cards for debugging!</h1>
        {gameState.players.map((player, idx) => {
          return (
            <div key={player.id}>
              {player.name}'s cards:
              <div className="flex flex-wrap gap-2">
                {player.hand.map((card) => {
                  return (
                    <PlayingCard key={card.suit + card.value} card={card} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </details>

      <div>
        <div className="pt-5 font-bold">
          Round number: {gameState.roundNumber}
        </div>

        <div className="flex flex-col gap-5 py-10 border p-5 my-5 border-gray-400">
          <p className="font-bold text-center"> Cards </p>

          {lastHandPlayed && (
            <div className="flex justify-center">
              {lastHandPlayed.map((card) => {
                return (
                  <PlayingCard key={`${card.suit}${card.value}`} card={card} />
                );
              })}
            </div>
          )}
        </div>

        <div>
          {gameState.players[thisPlayerIndex] && (
            <div className="flex flex-col gap-5 py-10 border border-dashed p-5 my-5 border-orange-400">
              Your hand (You are player {thisPlayerIndex + 1})
              <div className="flex flex-wrap gap-2">
                {gameState.players[thisPlayerIndex].hand.map((card) => {
                  return (
                    <PlayingCard
                      key={card.suit + card.value}
                      card={card}
                      onSelect={() => toggleSelectedCard(card)}
                      selected={selectedCards.some(
                        (selectedCard) =>
                          selectedCard.suit === card.suit &&
                          selectedCard.value === card.value
                      )}
                    />
                  );
                })}
              </div>
              <div>{isValidPlay ? isValidPlay : "invalid play"}</div>
            </div>
          )}
        </div>
      </div>

      <button
        className={`btn ${isCurrentPlayerTurn ? "btn-primary" : "btn-disabled"}`}
        type="button"
        disabled={!isCurrentPlayerTurn}
        onClick={async () => {
          const resp = await actions.playTurn({
            cards: selectedCards,
            roomId,
          });
          setSelectedCards([]);
        }}
      >
        {isCurrentPlayerTurn ? "Play your turn" : "Its not your turn"}
      </button>

      <button
        disabled={!isCurrentPlayerTurn}
        type="button"
        className={`ml-2 btn btn-secondary ${isCurrentPlayerTurn ? "btn-secondary" : "btn-disabled"}`}
        onClick={() => actions.passTurn({ roomId })}
      >
        Pass
      </button>
    </div>
  );
};
