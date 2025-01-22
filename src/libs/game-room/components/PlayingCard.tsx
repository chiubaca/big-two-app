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
    <>
      <label
        style={style}
        key={card.value + card.suit}
        className={`playing-card ${cardColourMapper(card.suit)} ${className || ""} ${selected ? "selected" : ""}`}
      >
        <input
          type="checkbox"
          className="card-checkbox"
          checked={selected}
          onChange={onSelect}
        />
        <span className="card-corner">
          {suitIconMapper(card.suit)} {card.value}
        </span>
        <span className="card-center">{suitIconMapper(card.suit)}</span>
        <span className="card-corner rotated">
          {suitIconMapper(card.suit)} {card.value}
        </span>
      </label>

      <style>{
        /* css */ `
        .playing-card {
          width: 13vmin;
          height: 17vmin;
          min-width: 60px;
          min-height: 80px;
          max-width: 96px;
          max-height: 128px;
          border: 1px solid #ccc;
          border-radius: 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          background-color: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          z-index: 10;
          transition: transform 0.2s ease;
        }

        .playing-card.selected {
          transform: translateY(-0.5rem);
          border: 2px solid black;
        }

        .card-checkbox {
          display: none;
        }

        .card-corner {
          padding-left: 1vmin;
          font-size: minmax(14px, 3vmin) ;
        }

        .card-center {
          text-align: center;
          font-size: minmax(16px, 5vmin) ;
        }

        .rotated {
          transform: rotate(180deg);
        }

        .text-red-500 {
          color: #ef4444;
        }

        .text-black {
          color: #000000;
        }
      `
      }</style>
    </>
  );
};
