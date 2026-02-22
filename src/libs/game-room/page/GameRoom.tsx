import type { Card } from "@chiubaca/big-two-utils";
import { useContext, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { playSound } from "~libs/audio";
import { Confetti } from "~libs/confetti";
import { detectHandType } from "~libs/helpers/gameStateMachine";
import { honoClient } from "~libs/hono-actions";

import { PlayingCard } from "../components/PlayingCard";
import { SettingsModal } from "../components/settings/SettingsModal";
import { makePlayerOrder } from "../helpers/makePlayerOrder";
import {
  GameRoomContext,
  GameRoomProvider,
  type InitialGameRoomContextProps,
} from "./GameRoom.context";
import "../../../base.css";

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
        ? `Play ${handType}`
        : "Not valid"
      : "Pick some cards";

  const { gameState, currentUserId, roomId } = useContext(GameRoomContext);

  console.log(gameState.value);
  const currentPlayerIdTurn =
    gameState.context.players[gameState.context.currentPlayerIndex].id;

  const isCurrentPlayerTurn = currentPlayerIdTurn === currentUserId;

  const thisPlayerIndex = gameState.context.players.findIndex(
    (player) => player.id === currentUserId,
  );
  const isThisPlayerInRoom = gameState.context.players
    .map((p) => p.id)
    .find((id) => id === currentUserId);

  const isThisPlayerTheCreator = creatorId === currentUserId;

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
    if (hasPlayerWon) {
      playSound("WIN");
    }
  }, [hasPlayerWon]);

  const toggleSelectedCard = (card: Card) => {
    playSound("SELECT");
    const isCardSelected = selectedCards.some(
      (selectedCard) =>
        selectedCard.suit === card.suit && selectedCard.value === card.value,
    );
    if (isCardSelected) {
      setSelectedCards(
        selectedCards.filter(
          (selectedCard) =>
            selectedCard.suit !== card.suit ||
            selectedCard.value !== card.value,
        ),
      );
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  return (
    <>
      <main className="game-room flex h-svh flex-col justify-between">
        <nav className="flex items-center justify-between px-4 py-3 bg-casino-black/90 backdrop-blur-sm border-b border-casino-emerald/30">
          <a
            className="btn btn-ghost text-casino-cream hover:text-casino-emeraldLight hover:bg-casino-emerald/10 border border-transparent hover:border-casino-emerald/30 transition-all"
            href="/"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-display">Home</span>
          </a>
          <div className="flex items-center gap-3">
            {!isThisPlayerInRoom && (
              <button
                className={twMerge([
                  "btn bg-casino-emerald text-casino-cream font-medium border-none hover:bg-casino-emeraldLight hover:shadow-emerald transition-all",
                  gameState.value !== "WAITING_FOR_PLAYERS" &&
                    "opacity-50 cursor-not-allowed",
                ])}
                type="button"
                onClick={async () =>
                  await honoClient.api.joinGame.$post({
                    json: { roomId },
                  })
                }
              >
                {gameState.value === "WAITING_FOR_PLAYERS"
                  ? "Join Table"
                  : "Game in Progress"}
              </button>
            )}

            {isThisPlayerTheCreator && (
              <button
                className="btn btn-sm bg-casino-cardRed/80 text-casino-cream border-none hover:bg-casino-cardRed"
                type="button"
                onClick={() =>
                  honoClient.api.resetGame.$post({ json: { roomId } })
                }
              >
                New Game
              </button>
            )}
            <SettingsModal />
          </div>
        </nav>

        <div className="p-4 flex-1 flex items-center justify-center">
          <div className="table">
            <div className="played-cards-center">
              {gameState.value === "WAITING_FOR_PLAYERS" && (
                <div>
                  {isThisPlayerTheCreator ? (
                    <button
                      className="btn bg-casino-emerald text-casino-cream font-display text-lg border-none hover:bg-casino-emeraldLight hover:shadow-emerald-glow px-8"
                      type="button"
                      onClick={() =>
                        honoClient.api.startGame.$post({ json: { roomId } })
                      }
                    >
                      Deal Cards
                    </button>
                  ) : (
                    <div className="flex flex-col items-center p-5 text-center">
                      <p className="font-display text-casino-cream/70 text-xl mb-4">
                        Waiting for host
                      </p>
                      <span className="loading loading-dots loading-lg text-casino-emeraldLight" />
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
              )}
            </div>

            {/* TOP PLAYER */}
            <div
              className={twMerge([
                "top-player-position min-h-14 rounded-xl p-2",
                isTopPlayerFocused
                  ? "bg-casino-emeraldLight/20 border border-casino-emeraldLight/50"
                  : "bg-casino-black/30 border border-casino-emerald/10",
              ])}
            >
              <div className="relative ml-2 flex">
                {isTopPlayerFocused && (
                  <div className="absolute -right-5 -top-5 badge badge-sm bg-casino-emeraldLight text-casino-black border-none">
                    <span className="loading loading-dots loading-sm" />
                  </div>
                )}
                {topPlayer?.hand.toSpliced(13).map((_card, idx) => {
                  return (
                    <div
                      key={idx}
                      className="card-back -ml-2 h-10 w-8 rounded-sm"
                    />
                  );
                })}
                {topPlayer?.hand.length > 13 && (
                  <span className="absolute grid h-full w-full items-center justify-center">
                    <span className="badge badge-sm bg-casino-black/50 text-casino-cream py-2 text-xs backdrop-blur-sm border border-casino-emerald/30">
                      {topPlayer.hand.length}
                    </span>
                  </span>
                )}
              </div>
              {topPlayer?.name && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-casino-cream/50 font-medium">
                  {gameState.context.players[topPlayerIdx].name}
                </span>
              )}
            </div>

            {/* LEFT PLAYER */}
            <div
              className={twMerge([
                "left-player-position min-h-36 min-w-12 rounded-xl p-2 pb-8",
                isLeftPlayerFocused
                  ? "bg-casino-emeraldLight/20 border border-casino-emeraldLight/50"
                  : "bg-casino-black/30 border border-casino-emerald/10",
              ])}
            >
              <div className="relative flex flex-col">
                {isLeftPlayerFocused && (
                  <div className="badge badge-sm bg-casino-emeraldLight text-casino-black -top-5 -right-5 absolute border-none">
                    <span className="loading loading-dots loading-sm" />
                  </div>
                )}
                {leftPlayer?.hand.toSpliced(13).map((_card, idx) => {
                  return (
                    <div
                      key={idx}
                      className="card-back -mb-6 h-8 w-10 rounded-sm"
                    />
                  );
                })}
                {leftPlayer?.hand.length > 13 && (
                  <span className="absolute grid h-full w-full items-center justify-center">
                    <span className="badge badge-sm bg-casino-black/50 text-casino-cream py-2 text-xs backdrop-blur-sm border border-casino-emerald/30">
                      {leftPlayer.hand.length}
                    </span>
                  </span>
                )}
              </div>
              {leftPlayer?.name && (
                <span className="absolute -bottom-4 z-10 pt-28 text-xs text-casino-cream/50 font-medium">
                  {gameState.context.players[leftPlayerIdx].name}
                </span>
              )}
            </div>

            {/* RIGHT PLAYER */}
            <div
              className={twMerge([
                "right-player-position min-h-36 min-w-12 rounded-xl p-2 pb-8",
                isRightPlayerFocused
                  ? "bg-casino-emeraldLight/20 border border-casino-emeraldLight/50"
                  : "bg-casino-black/30 border border-casino-emerald/10",
              ])}
            >
              <div className="relative flex flex-col">
                {rightPlayerIdx === gameState.context.currentPlayerIndex && (
                  <div className="badge badge-sm bg-casino-emeraldLight text-casino-black -top-5 -left-5 absolute border-none">
                    <span className="loading loading-dots loading-sm" />
                  </div>
                )}

                {rightPlayer?.hand.toSpliced(13).map((_card, idx) => {
                  return (
                    <div
                      key={idx}
                      className="card-back -mb-6 h-8 w-10 rounded-sm"
                    />
                  );
                })}
                {rightPlayer?.hand.length > 13 && (
                  <span className="absolute grid h-full w-full items-center justify-center">
                    <span className="badge badge-sm bg-casino-black/50 text-casino-cream py-2 text-xs backdrop-blur-sm border border-casino-emerald/30">
                      {rightPlayer.hand.length}
                    </span>
                  </span>
                )}
              </div>
              {rightPlayer?.name && (
                <span className="absolute -bottom-4 z-10 pt-28 text-xs text-casino-cream/50 font-medium">
                  {rightPlayer.name}
                </span>
              )}
            </div>

            {/* CURRENT PLAYER */}
            <div className="current-player mt-10 flex flex-col items-center">
              {isCurrentPlayerFocused && (
                <span className="badge bg-casino-emeraldLight text-casino-black border-none font-medium px-4 py-1 mb-2">
                  {gameState.value === "PLAY_NEW_ROUND"
                    ? "You won that round"
                    : "Your turn"}
                </span>
              )}
              {gameState.context.players[thisPlayerIndex] ? (
                <div className="w-full">
                  <div
                    className={twMerge([
                      "m-4 grid min-h-40 grid-rows-2 justify-items-center gap-1 overflow-x-auto rounded-xl p-4",
                      isCurrentPlayerFocused
                        ? "bg-casino-emeraldLight/20 border border-casino-emeraldLight/50"
                        : "bg-casino-black/30 border border-casino-emerald/10",
                    ])}
                  >
                    {gameState.context.players[thisPlayerIndex].hand.map(
                      (card, index) => {
                        const totalCards =
                          gameState.context.players[thisPlayerIndex].hand
                            .length;
                        const cardsPerRow = Math.ceil(totalCards / 2);
                        const row = index < cardsPerRow ? 0 : 1;
                        return (
                          <PlayingCard
                            key={card.suit + card.value}
                            className="hover:-translate-y-2 mb-2 shrink-0 cursor-pointer transition-transform"
                            style={{
                              gridRow: row + 1,
                              gridColumn: "auto",
                            }}
                            card={card}
                            onSelect={() => toggleSelectedCard(card)}
                            selected={selectedCards.some(
                              (selectedCard) =>
                                selectedCard.suit === card.suit &&
                                selectedCard.value === card.value,
                            )}
                          />
                        );
                      },
                    )}
                  </div>
                </div>
              ) : (
                <div className="m-4 grid min-h-40 w-11/12 rounded-xl bg-casino-black/30 border border-casino-emerald/10" />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-casino-black/80 backdrop-blur-sm border-t border-casino-emerald/30 p-6">
          <div className="flex items-center justify-center gap-3">
            <button
              className={twMerge([
                isCurrentPlayerTurn
                  ? "bg-casino-emerald text-casino-cream hover:bg-casino-emeraldLight hover:shadow-emerald"
                  : "bg-casino-charcoal text-casino-cream/40 cursor-not-allowed",
                "btn font-display px-8 border-none transition-all",
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
              className={twMerge([
                isCurrentPlayerTurn
                  ? "bg-casino-charcoal text-casino-cream border border-casino-emerald/30 hover:bg-casino-charcoal/80 hover:border-casino-emerald/50"
                  : "bg-casino-charcoal/50 text-casino-cream/30 cursor-not-allowed border-transparent",
                "btn btn-sm px-6 transition-all",
              ])}
              onClick={() =>
                honoClient.api.passTurn.$post({ json: { roomId } })
              }
            >
              Pass
            </button>
          </div>
        </div>
      </main>

      {/* toast notification */}
      {guardMessage && (
        <div
          key={guardMessage.key}
          className="toast toast-center toast-middle pointer-events-none z-50 animate-fade-out"
        >
          <div className="alert bg-casino-cardRed/90 text-casino-cream border-none backdrop-blur-sm">
            <span className="font-medium">{guardMessage.message}</span>
          </div>
        </div>
      )}

      {gameState.value === "GAME_END" && (
        <dialog open id="game_end_modal" className="modal backdrop-blur-sm">
          <div className="modal-box bg-casino-charcoal border border-casino-emerald/30 text-casino-cream max-w-md">
            <div className="flex flex-col items-center justify-center gap-6 py-4">
              {hasPlayerWon && <Confetti />}
              <h3 className="font-display text-5xl text-emerald-gradient">
                {hasPlayerWon ? "Victory" : "Defeat"}
              </h3>
              {!hasPlayerWon && (
                <p className="text-casino-cream/60 text-lg">
                  Better luck next time
                </p>
              )}

              {isThisPlayerTheCreator ? (
                <button
                  className="btn bg-casino-emerald text-casino-cream font-display text-lg border-none hover:bg-casino-emeraldLight hover:shadow-emerald-glow btn-wide"
                  type="button"
                  onClick={() =>
                    honoClient.api.resetGame.$post({ json: { roomId } })
                  }
                >
                  New Game
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-casino-cream/50">Waiting for new game</p>
                  <span className="loading loading-dots loading-lg text-casino-emeraldLight" />
                  <a
                    className="btn btn-ghost text-casino-emeraldLight hover:bg-casino-emerald/10 border border-casino-emerald/30"
                    href="/"
                  >
                    Return Home
                  </a>
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}

      <style>{`
				.game-room {
					background: linear-gradient(180deg, #0a0a0f 0%, #16213e 100%);
					height: 100vh;
					overflow: hidden;
				}

				.table { 
					min-height: 70vh;
					max-width: 850px;
					width: 100%;
					border: 3px solid #1a7a42;
					
					display: grid;
					background: linear-gradient(135deg, #0d4d2b 0%, #0a3d22 50%, #0d4d2b 100%);
					box-shadow: 
						inset 0 0 100px rgba(0, 0, 0, 0.5),
						0 0 30px rgba(13, 77, 43, 0.3),
						0 0 60px rgba(0, 0, 0, 0.5);
					justify-items: center;
					align-items: end;
					margin: 0 auto;
					grid-template-areas: 
							"     .            player-top           .      "
							"player-left      table-center    player-right "
							"current-player  current-player  current-player";
					position: relative;
				} 

				.table::before {
					content: '';
					position: absolute;
					inset: 8px;
					border: 1px solid rgba(26, 122, 66, 0.3);
					pointer-events: none;
				}

				.current-player {
					grid-area: current-player;
					width: 100%;
					overflow: hidden;
				}

				.card-back {
					background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
					border: 1px solid #1a7a42;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
					position: relative;
					overflow: hidden;
				}

				.card-back::before {
					content: '';
					position: absolute;
					inset: 3px;
					background: repeating-linear-gradient(
						45deg,
						transparent,
						transparent 2px,
						rgba(26, 122, 66, 0.15) 2px,
						rgba(26, 122, 66, 0.15) 4px
					);
					border-radius: 2px;
				}

				.played-cards-center {
					position: absolute;
					border-radius: 12px;
					top: 25%;
					left: 50%;
					transform: translateX(-50%);
					min-width: 180px;
					min-height: 180px;
					display: grid;
					align-items: center;
					justify-items: center;
					padding: 2px;
					background: rgba(0, 0, 0, 0.2);
					backdrop-filter: blur(4px);
				}

				.top-player-position {
					position: absolute;
					top: 1.5rem;
					left: 50%;
					transform: translateX(-50%);
					width: 40%;
					backdrop-filter: blur(8px);
				}

				.bottom-player-position {
					position: absolute;
					bottom: 1rem;
					left: 50%;
					transform: translateX(-50%);
				}

				.left-player-position {
					position: absolute;
					left: 1.5rem;
					top: 40%;
					transform: translateY(-50%);
					backdrop-filter: blur(8px);
				}

				.right-player-position {
					position: absolute;
					right: 1.5rem;
					top: 40%;
					transform: translateY(-50%);
					backdrop-filter: blur(8px);
				}

				@media (max-width: 640px) {
					.table {
						border-radius: 24px;
						min-height: 65vh;
					}
					.table::before {
						border-radius: 18px;
					}
					.top-player-position,
					.bottom-player-position {
						width: 60%;
					}
				}
			`}</style>
    </>
  );
};
