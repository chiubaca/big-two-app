import { twMerge } from "tailwind-merge";
import type { Card } from "@chiubaca/big-two-utils";
import { Style } from "hono/css";

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

export const PlayingCard = ({
  card,
  selected,
  onSelect,
  className,
  style,
}: {
  card: Card;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  style?: React.HTMLAttributes<HTMLLabelElement>["style"];
}) => {
  return (
    <label
      style={style}
      key={card.value + card.suit}
      className={twMerge([
        className,
        cardColourMapper(card.suit),
        selected && "-translate-y-2 border-2 border-black",
        "border rounded-lg text-sm w-24 h-32  flex flex-col justify-around bg-white shadow-sm z-10",
      ])}
    >
      <input
        type="checkbox"
        className="hidden"
        checked={selected}
        onChange={onSelect}
      />
      <span className="pl-4">
        {suitIconMapper(card.suit)} {card.value}
      </span>
      <span className="text-center text-2xl">{suitIconMapper(card.suit)}</span>

      <span className="pl-4 rotate-180">
        {suitIconMapper(card.suit)} {card.value}
      </span>
    </label>
  );
};
