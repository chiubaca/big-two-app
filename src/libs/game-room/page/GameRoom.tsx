import type { Card } from "@chiubaca/big-two-utils";
import { useContext, useState } from "react";
import {
  GameRoomContext,
  GameRoomProvider,
  type InitialGameRoomContextProps,
} from "./GameRoom.context";

import "../../../base.css";
import { PlayingCard } from "../components/PlayingCard";
import { detectHandType } from "~libs/helpers/gameStateMachine";
import { honoClient } from "~libs/hono-actions";
import { makePlayerOrder } from "../helpers/makePlayerOrder";
interface GameRoomProps extends InitialGameRoomContextProps {
  roomName: string;
}

export const GameRoom = ({
  currentUserId,
  roomId,
  gameState,
  roomName,
}: GameRoomProps) => {
  return (
    <GameRoomProvider
      roomId={roomId}
      gameState={gameState}
      currentUserId={currentUserId}
    >
      <Game roomName={roomName} />
    </GameRoomProvider>
  );
};

const JoinRoom = () => {
  const { roomId } = useContext(GameRoomContext);

  const handleJoinRoom = async () => {
    await honoClient.api.joinGame.$post({
      json: { roomId },
    });
  };

  return (
    <div>
      <button
        className="btn btn-primary m-3"
        type="button"
        onClick={handleJoinRoom}
      >
        Join room
      </button>
      <button
        className="btn btn-warning m-3"
        type="button"
        onClick={() => honoClient.api.resetGame.$post({ json: { roomId } })}
      >
        reset game
      </button>
    </div>
  );
};

const Game = ({ roomName }: { roomName: string }) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const isValidPlay = detectHandType(selectedCards);

  const { gameState, currentUserId, roomId } = useContext(GameRoomContext);

  const currentPlayerIdTurn =
    gameState.context.players[gameState.context.currentPlayerIndex].id;

  const isCurrentPlayerTurn = currentPlayerIdTurn === currentUserId;

  const thisPlayerIndex = gameState.context.players.findIndex(
    (player) => player.id === currentUserId
  );
  const thisPlayerName = gameState.context.players[thisPlayerIndex].name;

  const [, left, top, right] = makePlayerOrder(thisPlayerIndex);

  const lastHandPlayed = gameState.context.cardPile.at(-1);

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
    <>
      <main className="grid self-center items-center bg-green-400 p-2 h-svh">
        <div>
          <a href="/">Back to Home</a>
          <h1 className="m-3 text-2xl">
            Welcome to {roomName}, {thisPlayerName}
          </h1>
        </div>

        <div className="table p-5">
          <div className="table-center scale-75">
            <div className=" ">
              {lastHandPlayed && (
                <div className="flex justify-center gap-1 flex-wrap">
                  {lastHandPlayed.map((card) => {
                    return (
                      <PlayingCard
                        key={`${card.suit}${card.value}`}
                        card={card}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="current-player">
            {gameState.context.players[thisPlayerIndex] && (
              <div className="flex flex-wrap justify-center">
                {gameState.context.players[thisPlayerIndex].hand.map(
                  (card, index) => {
                    return (
                      <PlayingCard
                        key={card.suit + card.value}
                        className="cursor-pointer transition-transform hover:-translate-y-2  mb-2"
                        card={card}
                        onSelect={() => toggleSelectedCard(card)}
                        selected={selectedCards.some(
                          (selectedCard) =>
                            selectedCard.suit === card.suit &&
                            selectedCard.value === card.value
                        )}
                      />
                    );
                  }
                )}
              </div>
            )}
            <div>{isValidPlay ? isValidPlay : "invalid play"}</div>
          </div>
          <div className="player-left">
            {gameState.context.players[left]?.name ? (
              <>
                {gameState.context.players[left].name}
                <div className="flex flex-col">
                  {gameState.context.players[1].hand.map((card, idx) => {
                    return (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={idx}
                        className="pattern h-8 w-10 border-2 rounded-sm -mb-4"
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <>empty seat</>
            )}
          </div>
          <div className="player-top">
            {gameState.context.players[2]?.name ? (
              <>
                {gameState.context.players[top].name}
                <div className="flex">
                  {gameState.context.players[top].hand.map((card, idx) => {
                    return (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={idx}
                        className="pattern w-8 h-10 border-2 rounded-sm -mb-4"
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <>empty seat</>
            )}
          </div>
          <div className="player-right">
            {gameState.context.players[right]?.name ? (
              <>
                {gameState.context.players[right].name}
                <div className="flex flex-col">
                  {gameState.context.players[3].hand.map((card, idx) => {
                    return (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={idx}
                        className="pattern h-8 w-10 border-2 rounded-sm -mb-4"
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <>empty seat</>
            )}{" "}
          </div>
        </div>

        <div className="p-5 border-black border relative">
          <button
            className={`btn ${isCurrentPlayerTurn ? "btn-primary" : "btn-disabled"}`}
            type="button"
            disabled={!isCurrentPlayerTurn}
            onClick={async () => {
              setSelectedCards([]);
              await honoClient.api.playTurn.$post({
                json: {
                  roomId,
                  cards: selectedCards,
                },
              });
            }}
          >
            {isCurrentPlayerTurn ? "Play your turn" : "Its not your turn"}
          </button>

          <button
            disabled={!isCurrentPlayerTurn}
            type="button"
            className={`ml-2 btn btn-secondary ${isCurrentPlayerTurn ? "btn-secondary" : "btn-disabled"}`}
            onClick={() => honoClient.api.passTurn.$post({ json: { roomId } })}
          >
            Pass
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => honoClient.api.startGame.$post({ json: { roomId } })}
          >
            Start Game
          </button>

          <JoinRoom />
        </div>
      </main>

      <details className="flex flex-col gap-5 py-10 border border-dashed p-5 my-5 border-gray-400">
        {/* DEBUGGING STUFF */}
        <h1> Everyones cards for debugging!</h1>
        {gameState.context.players.map((player) => {
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

      <style>{
        /* css */ ` 
      .table { 
        display: grid;
        gap:3rem;
        justify-content: space-around;
        align-items: center;
        background-color: green;
        justify-items: center;
        grid-template-areas: 
            "     .            player-top           .      "
            "player-left      table-center    player-right "
            "current-player  current-player  current-player";
      } 

      .table-center{
        grid-area: table-center;
      }

      .current-player{
        grid-area: current-player; 
      }

      .player-left{
        grid-area: player-left;
      }

      .player-top{
        grid-area: player-top;
      }

      .player-right{
        grid-area: player-right;
      }

      .pattern {
        --s: 80px; /* control the size*/
        --c1: #542437;
        --c2: #c02942;
        
        --_g: 
          #0000 calc(-650%/13) calc(50%/13),var(--c1) 0 calc(100%/13),
          #0000 0 calc(150%/13),var(--c1) 0 calc(200%/13),
          #0000 0 calc(250%/13),var(--c1) 0 calc(300%/13);
        --_g0: repeating-linear-gradient( 45deg,var(--_g));
        --_g1: repeating-linear-gradient(-45deg,var(--_g));
        background:
          var(--_g0),var(--_g0) var(--s) var(--s),
          var(--_g1),var(--_g1) var(--s) var(--s) var(--c2);
        background-size: calc(2*var(--s)) calc(2*var(--s));
      }
      `
      }</style>
    </>
  );
};
