"use client";

import React from "react";
import { Box } from "@mui/material";
import { Card } from "@/game/cardTypes";
import FaceUpCard from "@/components/card/FaceUpCard";

interface MyHandProps {
  myCards: Card[];
  currentTurn: string;
  username: string;
  handCards: Record<string, Card>;
  onPlayCard: (card: Card) => void;
  getCardPlayable?: (card: Card) => boolean;
  /** When true, cards are invisible (layout preserved) — used during deal animation */
  hidden?: boolean;
}

const MyHand: React.FC<MyHandProps> = ({
  myCards,
  currentTurn,
  username,
  handCards,
  onPlayCard,
  getCardPlayable,
  hidden = false,
}) => {
  const isMyTurn = currentTurn === username;
  const alreadyPlayed = handCards[username] !== undefined;

  const n = myCards.length;
  const cardStep = 60;
  const fanHalf = Math.min(10, n * 1.2);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          position: "relative",
          height: 160,
          width: "100%",
          overflow: "visible",
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? "none" : "auto",
          transition: "opacity 0.3s ease",
        }}
      >
        {myCards.map((card, i) => {
          const canPlay = getCardPlayable ? getCardPlayable(card) : (isMyTurn && !alreadyPlayed);
          const dimmed = !canPlay && isMyTurn && !alreadyPlayed;
          const offset = (i - (n - 1) / 2) * cardStep;
          const angle = n <= 1 ? 0 : -fanHalf + (i / (n - 1)) * (fanHalf * 2);
          const basePop = canPlay ? -14 : 0;
          const zIndex = Math.floor(n / 2) - Math.abs(i - Math.floor(n / 2)) + 1;

          return (
            <Box
              key={i}
              sx={{
                position: "absolute",
                bottom: 0,
                left: `calc(50% + ${offset}px)`,
                transformOrigin: "bottom center",
                transform: `translateX(-50%) rotate(${angle}deg) translateY(${basePop}px)`,
                transition: "transform 0.18s ease",
                zIndex,
                "&:hover": canPlay
                  ? { transform: `translateX(-50%) rotate(${angle}deg) translateY(-28px)` }
                  : {},
              }}
            >
              <FaceUpCard
                card={card}
                clickable={canPlay}
                dimmed={dimmed}
                onClick={() => onPlayCard(card)}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default MyHand;
