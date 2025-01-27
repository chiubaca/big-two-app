// Audio utilities for game sounds

const SOUNDS = {
  NEXT_TURN: "/audio/turn.mp3",
  SELECT: "/audio/tick.mp3",
  WIN: "/audio/tada.mp3",
} as const;

export type GameSound = keyof typeof SOUNDS;

export const playSound = (sound: GameSound) => {
  const audio = new Audio(SOUNDS[sound]);
  audio.volume = 0.5;
  audio.play().catch((error) => {
    console.warn(`Failed to play ${sound} sound:`, error);
  });
};
