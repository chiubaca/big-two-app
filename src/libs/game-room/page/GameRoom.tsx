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

import texture from "./noisy-texture.png";
import { twMerge } from "tailwind-merge";
import { Confetti } from "~libs/confetti";

interface GameRoomProps extends InitialGameRoomContextProps {
  roomName: string;
  creatorId: string;
}

export const GameRoom = ({
  currentUserId,
  roomId,
  gameState,
  roomName,
  creatorId,
}: GameRoomProps) => {
  return (
    <GameRoomProvider
      roomId={roomId}
      gameState={gameState}
      currentUserId={currentUserId}
    >
      <Game roomName={roomName} creatorId={creatorId} />
    </GameRoomProvider>
  );
};

const Game = ({
  roomName,
  creatorId,
}: {
  roomName: string;
  creatorId: string;
}) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const isValidPlay = detectHandType(selectedCards);

  const { gameState, currentUserId, roomId } = useContext(GameRoomContext);

  const currentPlayerIdTurn =
    gameState.context.players[gameState.context.currentPlayerIndex].id;

  const isCurrentPlayerTurn = currentPlayerIdTurn === currentUserId;

  const thisPlayerIndex = gameState.context.players.findIndex(
    (player) => player.id === currentUserId
  );
  const isThisPlayerInRoom = gameState.context.players
    .map((p) => p.id)
    .find((id) => id === currentUserId);

  const isThisPlayerTheCreator = creatorId === currentUserId;

  // const thisPlayerName = gameState.context.players[thisPlayerIndex].name;

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

  const hasPlayerWon =
    gameState.value === "GAME_END" &&
    gameState.context.winner?.id === currentUserId;

  return (
    <>
      <main className="wood-floor  flex flex-col justify-between h-svh text-white">
        <nav className="flex items-center justify-between">
          <a className="btn  btn-ghost text-xl" href="/">
            ← 🏠 Home
          </a>
          <div className="flex gap-3 pr-1">
            {!isThisPlayerInRoom && (
              <button
                className="btn btn-primary "
                type="button"
                onClick={async () =>
                  await honoClient.api.joinGame.$post({
                    json: { roomId },
                  })
                }
              >
                Join room
              </button>
            )}
            {isThisPlayerTheCreator && (
              <button
                className="btn btn-sm bg-red-500"
                type="button"
                onClick={() =>
                  honoClient.api.resetGame.$post({ json: { roomId } })
                }
              >
                Reset game
              </button>
            )}
          </div>
        </nav>
        <div className="flex">
          <code className="mx-auto badge badge-sm badge-info border-black p-3">
            {isCurrentPlayerTurn ? (
              "It's your turn!"
            ) : (
              <>
                {
                  gameState.context.players[
                    gameState.context.currentPlayerIndex
                  ].name
                }{" "}
                is playing
                <span className="ml-2 loading loading-dots loading-sm" />
              </>
            )}
          </code>
        </div>
        <div className="p-3">
          <div className="table">
            <div className="played-cards-center">
              {gameState.value === "WAITING_FOR_PLAYERS" && (
                <div>
                  {isThisPlayerTheCreator ? (
                    <button
                      className="btn"
                      type="button"
                      onClick={() =>
                        honoClient.api.startGame.$post({ json: { roomId } })
                      }
                    >
                      ♦️ Deal cards ♠️
                    </button>
                  ) : (
                    <div className="text-2xl flex flex-col items-center text-center p-5">
                      Waiting for new <br /> game to begin
                      <span className="loading loading-dots loading-lg" />
                    </div>
                  )}
                </div>
              )}
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
              )}{" "}
            </div>
            <div className=" top-player-position ">
              <div className="flex">
                {gameState.context.players[top]?.hand.map((card, idx) => {
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={idx}
                      className="pattern w-8 h-10 border-2 rounded-sm -ml-2"
                    />
                  );
                })}
              </div>
            </div>
            <div className="left-player-position">
              <div className="flex flex-col">
                {gameState.context.players[left]?.hand.map((card, idx) => {
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={idx}
                      className="pattern h-8 w-10 border-2 rounded-sm -mb-10"
                    />
                  );
                })}
              </div>
            </div>
            <div className="right-player-position relative">
              <div className="flex flex-col ">
                {gameState.context.players[right]?.hand.map((card, idx) => {
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={idx}
                      className="pattern h-8 w-10 border-2 rounded-sm -mb-10"
                    />
                  );
                })}
              </div>
            </div>
            <div className="bottom-player-position" />
            <div className="current-player mt-10">
              {gameState.context.players[thisPlayerIndex] && (
                <div className="w-full ">
                  <div className="grid grid-rows-2 justify-items-center gap-1  overflow-x-auto p-4">
                    {gameState.context.players[thisPlayerIndex].hand.map(
                      (card, index) => {
                        // Put first half of cards in first row, second half in second row
                        const totalCards =
                          gameState.context.players[thisPlayerIndex].hand
                            .length;
                        const cardsPerRow = Math.ceil(totalCards / 2);
                        const row = index < cardsPerRow ? 0 : 1;
                        return (
                          <PlayingCard
                            key={card.suit + card.value}
                            className={
                              "cursor-pointer transition-transform hover:-translate-y-2 mb-2 shrink-0  "
                            }
                            style={{
                              gridRow: row + 1,
                              gridColumn: "auto",
                            }}
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
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center p-5 ">
          {selectedCards.length > 0 && (
            <div>{isValidPlay ? isValidPlay : "Not a valid hand... 🫤"}</div>
          )}
          <div className="flex justify-center items-center p-5">
            <button
              className={twMerge([
                isCurrentPlayerTurn ? "btn-primary" : "btn-disabled",
                "btn btn-lg",
              ])}
              type="button"
              disabled={!isCurrentPlayerTurn || !isValidPlay}
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
              Play 👍🏼
            </button>
            <button
              disabled={!isCurrentPlayerTurn}
              type="button"
              className={`ml-2 btn btn-secondary ${isCurrentPlayerTurn ? "btn-secondary" : "btn-disabled"}`}
              onClick={() =>
                honoClient.api.passTurn.$post({ json: { roomId } })
              }
            >
              Pass 🫳🏼
            </button>
          </div>
        </div>
      </main>
      {gameState.value === "GAME_END" && (
        <dialog open id="my_modal_1" className="modal">
          <div className="modal-box text-slate-900">
            <div className="flex flex-col justify-center items-center gap-5">
              {hasPlayerWon && <Confetti />}
              <h3 className="font-bold text-5xl">
                {hasPlayerWon ? "You won! 🎉" : "You lost 😭"}
              </h3>
              {!hasPlayerWon && (
                <p className="text-xl">better luck next time!</p>
              )}

              {isThisPlayerTheCreator ? (
                <button
                  className="btn btn-primary btn-lg btn-wide capitalize"
                  type="button"
                  onClick={() =>
                    honoClient.api.resetGame.$post({ json: { roomId } })
                  }
                >
                  start new game
                </button>
              ) : (
                <div className="text-2xl flex flex-col items-center gap-5">
                  Waiting for new game to begin
                  <span className="loading loading-dots loading-lg" />
                  <a className="btn btn-ghost btn-link" href="/">
                    🏠 Home page
                  </a>
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}

      <style>{
        /* css */ ` 

      .wood-floor {
        background-color: #1a0100;
        background-image: url("https://www.transparenttextures.com/patterns/wood-pattern.png");
        height: 100vh;
        overflow: hidden;
      }

      .table { 
        
        max-width: 64rem;
        min-height: 65vh;
        max-width: 800px;
        border: solid 5px black;
        display: grid;
        background-color: green;
        background-image: url(${texture.src});
        background-repeat: repeat;  
        justify-items: center;
        align-items: end;
        margin: 0 auto;
        grid-template-areas: 
            "     .            player-top           .      "
            "player-left      table-center    player-right "
            "current-player  current-player  current-player";
        position: relative;
      } 

      .current-player {
        grid-area: current-player;
        width: 100%;
        overflow: hidden;
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

      .played-cards-center {
        position: absolute;
        border-radius: 10px;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
        min-width: 120px;
        border: white dashed 1px;
        min-height: 120px;
        display: grid;
        align-items: center;
        padding: 2px
      }

      .top-player-position {
        position: absolute;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        width: 40%
      }

      .bottom-player-position {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
      }

      .left-player-position {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
      }

      .right-player-position {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
      }

   
      `
      }</style>
    </>
  );
};
