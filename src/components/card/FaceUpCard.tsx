"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Card, Suit } from "@/game/cardTypes";

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
      width: 70,
      height: 100,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 2,
      backgroundColor: "#fff",
      color: isRed(card.suit) ? "#c0392b" : "#1a1a1a",
      userSelect: "none",
      cursor: clickable ? "pointer" : "default",
      filter: dimmed ? "grayscale(1) brightness(0.55)" : "none",
      boxShadow: 3,
      transition: "transform 0.1s, box-shadow 0.1s",
      "&:hover": clickable
        ? {
            boxShadow: "0 6px 20px rgba(160,118,102,0.6)",
          }
        : {},
    }}
  >
    <Typography variant="body2" fontWeight="bold" lineHeight={1}>
      {card.rank}
    </Typography>
    <Typography variant="h6" lineHeight={1}>
      {suitSymbol(card.suit)}
    </Typography>
  </Box>
);

export default FaceUpCard;
