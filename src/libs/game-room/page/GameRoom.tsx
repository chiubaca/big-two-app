import type { Card } from "@chiubaca/big-two-utils";
import { useContext, useState, useEffect } from "react";
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
import { playSound } from "~libs/audio";

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

const Game = ({ creatorId }: { roomName: string; creatorId: string }) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [guardMessage, setGuardMessage] = useState<
    | {
        key: string;
        message: string;
      }
    | undefined
  >(undefined);

  const handType = detectHandType(selectedCards);
  const isValidPlay = Boolean(handType);
  const selectedCardsToPlayText =
    selectedCards.length > 0
      ? handType
        ? `Play ${handType} 👍🏼`
        : "Not valid 🫤"
      : "Pick some cards";

  const { gameState, currentUserId, roomId } = useContext(GameRoomContext);

  console.log(gameState.value);
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

  const [bottomPlayerIdx, leftPlayerIdx, topPlayerIdx, rightPlayerIdx] =
    makePlayerOrder(thisPlayerIndex);

  const leftPlayer = gameState.context.players[leftPlayerIdx] || null;
  const isLeftPlayerFocused =
    leftPlayerIdx === gameState.context.currentPlayerIndex;

  const topPlayer = gameState.context.players[topPlayerIdx] || null;
  const isTopPlayerFocused =
    topPlayerIdx === gameState.context.currentPlayerIndex;

  const rightPlayer = gameState.context.players[rightPlayerIdx] || null;
  const isRightPlayerFocused =
    rightPlayerIdx === gameState.context.currentPlayerIndex;

  const lastHandPlayed = gameState.context.cardPile.at(-1);

  const isCurrentPlayerFocused =
    gameState.context.currentPlayerIndex === bottomPlayerIdx &&
    (gameState.value === "NEXT_PLAYER_TURN" ||
      gameState.value === "ROUND_FIRST_MOVE" ||
      gameState.value === "PLAY_NEW_ROUND");

  const hasPlayerWon =
    gameState.value === "GAME_END" &&
    gameState.context.winner?.id === currentUserId;

  useEffect(() => {
    if (isCurrentPlayerFocused) {
      playSound("NEXT_TURN");
      if (Notification.permission === "granted") {
        new Notification("It's your turn!");
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("It's your turn!");
          }
        });
      }
    }
    if (hasPlayerWon) {
      playSound("WIN");
    }
  }, [isCurrentPlayerFocused, hasPlayerWon]);

  const toggleSelectedCard = (card: Card) => {
    playSound("SELECT");
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
      <main className="wood-floor flex h-svh flex-col justify-between text-white">
        <nav className="flex items-center justify-between p-3 ">
          <a className="btn btn-ghost text-xl" href="/">
            ← 🏠 Home
          </a>
          <div className="flex items-center gap-3 pr-1">
            {!isThisPlayerInRoom && (
              <button
                className={twMerge([
                  "btn btn-primary",
                  gameState.value !== "WAITING_FOR_PLAYERS" &&
                    "cursor-not-allowed border-black bg-slate-300 text-sm hover:bg-slate-300 active:bg-slate-300",
                ])}
                type="button"
                onClick={async () =>
                  await honoClient.api.joinGame.$post({
                    json: { roomId },
                  })
                }
              >
                {gameState.value === "WAITING_FOR_PLAYERS"
                  ? "Join room"
                  : "Game in progress.."}
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

        <div className="p-3">
          <div className="table">
            <div className="played-cards-center bg-white/10">
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
                    <div className="flex flex-col items-center p-5 text-center text-2xl">
                      Waiting for new <br /> game to begin
                      <span className="loading loading-dots loading-lg" />
                    </div>
                  )}
                </div>
              )}
              {lastHandPlayed && (
                <div className="flex flex-wrap justify-center gap-1">
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

            {/* TOP PLAYER */}
            <div
              className={twMerge([
                "top-player-position min-h-14 rounded-lg p-2",
                isTopPlayerFocused ? "bg-white/40" : "bg-white/10",
              ])}
            >
              <div className="relative ml-2 flex">
                {isTopPlayerFocused && (
                  <div className=" -right-5 -top-5 badge badge-sm badge-info absolute">
                    <span className="loading loading-dots loading-sm" />
                  </div>
                )}
                {topPlayer?.hand.toSpliced(13).map((_card, idx) => {
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={idx}
                      className="pattern -ml-2 h-10 w-8 rounded-sm border-2"
                    />
                  );
                })}
                {topPlayer?.hand.length > 13 && (
                  <span className=" absolute grid h-full w-full items-center justify-center">
                    <span className="badge badge-xs bg-white/10 py-2 text-white/70 text-xs backdrop-blur">
                      {topPlayer.hand.length}
                    </span>
                  </span>
                )}
              </div>
              {topPlayer?.name && (
                <code className="-bottom-5 absolute text-xs opacity-30">
                  {gameState.context.players[topPlayerIdx].name}
                </code>
              )}
            </div>

            {/* LEFT PLAYER */}
            <div
              className={twMerge([
                "left-player-position min-h-36 min-w-12 rounded-lg p-2 pb-8",
                isLeftPlayerFocused ? "bg-white/40" : "bg-white/10",
              ])}
            >
              <div className="relative flex flex-col">
                {isLeftPlayerFocused && (
                  <div className="badge badge-sm badge-info -top-5 -right-5 absolute">
                    <span className=" loading loading-dots loading-sm" />
                  </div>
                )}
                {leftPlayer?.hand.toSpliced(13).map((_card, idx) => {
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={idx}
                      className="pattern -mb-6 h-8 w-10 rounded-sm border-2"
                    />
                  );
                })}
                {leftPlayer?.hand.length > 13 && (
                  <span className=" absolute grid h-full w-full items-center justify-center">
                    <span className="badge badge-xs bg-white/10 py-2 text-white/70 text-xs backdrop-blur">
                      {leftPlayer.hand.length}
                    </span>
                  </span>
                )}
              </div>
              {leftPlayer?.name && (
                <code className="-bottom-4 absolute z-10 pt-28 text-xs opacity-30">
                  {gameState.context.players[leftPlayerIdx].name}
                </code>
              )}
            </div>

            {/* RIGHT PLAYER */}
            <div
              className={twMerge([
                "right-player-position min-h-36 min-w-12 rounded-lg p-2 pb-8",
                isRightPlayerFocused ? "bg-white/40" : "bg-white/10",
              ])}
            >
              <div className="relative flex flex-col">
                {rightPlayerIdx === gameState.context.currentPlayerIndex && (
                  <div className="badge badge-sm badge-info -top-5 -left-5 absolute">
                    <span className=" loading loading-dots loading-sm" />
                  </div>
                )}

                {rightPlayer?.hand.toSpliced(13).map((_card, idx) => {
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={idx}
                      className="pattern -mb-6 h-8 w-10 rounded-sm border-2"
                    />
                  );
                })}
                {rightPlayer?.hand.length > 13 && (
                  <span className=" absolute grid h-full w-full items-center justify-center">
                    <span className="badge badge-xs bg-white/10 py-2 text-white/70 text-xs backdrop-blur">
                      {rightPlayer.hand.length}
                    </span>
                  </span>
                )}
              </div>
              {rightPlayer?.name && (
                <code className="-bottom-4 absolute z-10 pt-28 text-xs opacity-30">
                  {rightPlayer.name}
                </code>
              )}
            </div>

            {/* CURRENT PLAYER */}
            <div className="current-player mt-10 flex flex-col items-center">
              {isCurrentPlayerFocused && (
                <code className="badge badge-info">
                  {gameState.value === "PLAY_NEW_ROUND"
                    ? " You won that round!"
                    : " It's your turn"}
                </code>
              )}
              {gameState.context.players[thisPlayerIndex] ? (
                <div className="w-full ">
                  <div
                    className={twMerge([
                      "m-4 grid min-h-40 grid-rows-2 justify-items-center gap-1 overflow-x-auto rounded-lg p-4",
                      isCurrentPlayerFocused ? "bg-white/40" : "bg-white/10",
                    ])}
                  >
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
                              "hover:-translate-y-2 mb-2 shrink-0 cursor-pointer transition-transform "
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
              ) : (
                <div className="m-4 grid min-h-40 w-11/12 rounded-lg bg-white/10 " />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-t-xl bg-white/30 p-5 backdrop-blur">
          <div className="flex items-center justify-center">
            <button
              className={twMerge([
                isCurrentPlayerTurn ? "btn-primary" : "btn-disabled",
                "btn",
              ])}
              type="button"
              disabled={!isCurrentPlayerTurn || !isValidPlay}
              onClick={async () => {
                setSelectedCards([]);
                const resp = await honoClient.api.playTurn.$post({
                  json: {
                    roomId,
                    cards: selectedCards,
                  },
                });
                const json = await resp.json();

                if (json.message) {
                  setGuardMessage({
                    key: Date.now().toString(),
                    message: json.message || "",
                  });
                }
              }}
            >
              {selectedCardsToPlayText}
            </button>
            <button
              disabled={
                !isCurrentPlayerTurn ||
                gameState.value === "ROUND_FIRST_MOVE" ||
                gameState.value === "PLAY_NEW_ROUND" ||
                gameState.value === "WAITING_FOR_PLAYERS"
              }
              type="button"
              className={`btn btn-secondary btn-sm ml-2 ${isCurrentPlayerTurn ? "btn-secondary" : "btn-disabled"}`}
              onClick={() =>
                honoClient.api.passTurn.$post({ json: { roomId } })
              }
            >
              Pass 🫳🏼
            </button>
          </div>
        </div>
      </main>

      {/* toast notification */}
      {guardMessage && (
        <div
          key={guardMessage.key}
          className=" toast toast-center toast-middle pointer-events-none z-50 animate-fade-out uppercase "
        >
          <div className="alert alert-warn">
            <code>{guardMessage.message}</code>
          </div>
        </div>
      )}

      {gameState.value === "GAME_END" && (
        <dialog open id="my_modal_1" className="modal">
          <div className="modal-box text-slate-900">
            <div className="flex flex-col items-center justify-center gap-5">
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
                <div className="flex flex-col items-center gap-5 text-2xl">
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
        /* max-width: 80vh; */
        min-height: 75vh;
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
        top: 25%;
        left: 50%;
        transform: translateX(-50%);
        min-width: 160px;
        min-height: 160px;
        display: grid;
        align-items: center;
        justify-items: center;
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
        top: 40%;
        transform: translateY(-50%);
      }

      .right-player-position {
        position: absolute;
        right: 1rem;
        top: 40%;
        transform: translateY(-50%);
      }

   
      `
      }</style>
    </>
  );
};
