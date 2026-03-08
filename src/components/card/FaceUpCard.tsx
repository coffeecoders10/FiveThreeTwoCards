"use client";

import React from "react";
import { Box } from "@mui/material";
import { Card, Suit } from "@/game/cardTypes";
// @ts-expect-error — library declares React 16 peer dep but works with React 19
import PlayingCard from "@heruka_urgyen/react-playing-cards/lib/TcN";

const rankMap: Record<string, string> = {
  "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7",
  "8": "8", "9": "9", "10": "T", "Jack": "J", "Queen": "Q", "King": "K", "Ace": "A",
};
const suitMap: Record<Suit, string> = {
  hearts: "h", diamonds: "d", clubs: "c", spades: "s",
};

export const toCardCode = (card: Card) => rankMap[card.rank] + suitMap[card.suit];

// Keep these exports for OtherPlayers.tsx which imports them
export const suitSymbol = (suit: Suit) =>
  ({ hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[suit]);
export const isRed = (suit: Suit) => suit === "hearts" || suit === "diamonds";

interface FaceUpCardProps {
  card: Card;
  clickable?: boolean;
  onClick?: () => void;
  dimmed?: boolean;
}

const FaceUpCard: React.FC<FaceUpCardProps> = ({ card, clickable, onClick, dimmed }) => (
  <Box
    onClick={clickable ? onClick : undefined}
    sx={{
      display: "inline-block",
      cursor: clickable ? "pointer" : "default",
      filter: dimmed ? "grayscale(1) brightness(0.55)" : "none",
      transition: "filter 0.1s, box-shadow 0.1s",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: 3,
      userSelect: "none",
      "&:hover": clickable
        ? { boxShadow: "0 6px 20px rgba(160,118,102,0.6)" }
        : {},
    }}
  >
    <PlayingCard card={toCardCode(card)} height="100px" />
  </Box>
);

export default FaceUpCard;
