import type { Card } from "@chiubaca/big-two-utils";

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
}: {
  card: Card;
  selected?: boolean;
  onSelect?: () => void;
}) => {
  return (
    <label
      key={card.value + card.suit}
      className={`card card-bordered shadow-sm p-4 ${cardColourMapper(card.suit)} cursor-pointer transition-transform hover:-translate-y-2 focus-within:-translate-y-2 ${selected ? "-translate-y-2 border-2 border-black" : ""}`}
    >
      <input
        type="checkbox"
        className="hidden"
        checked={selected}
        onChange={onSelect}
      />
      {suitIconMapper(card.suit)} {card.value}
    </label>
  );
};
