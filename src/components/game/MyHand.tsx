"use client";

import React from "react";
import { Box, Stack } from "@mui/material";
import { Card } from "@/game/cardTypes";
import FaceUpCard from "@/components/card/FaceUpCard";

interface MyHandProps {
  myCards: Card[];
  currentTurn: string;
  username: string;
  handCards: Record<string, Card>;
  onPlayCard: (card: Card) => void;
  getCardPlayable?: (card: Card) => boolean;
}

const MyHand: React.FC<MyHandProps> = ({ myCards, currentTurn, username, handCards, onPlayCard, getCardPlayable }) => {
  const isMyTurn = currentTurn === username;
  const alreadyPlayed = handCards[username] !== undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
        {myCards.map((card, i) => {
          const canPlay = getCardPlayable ? getCardPlayable(card) : (isMyTurn && !alreadyPlayed);
          return (
            <FaceUpCard
              key={i}
              card={card}
              clickable={canPlay}
              dimmed={!canPlay && isMyTurn && !alreadyPlayed}
              onClick={() => onPlayCard(card)}
            />
          );
        })}
      </Stack>
    </Box>
  );
};

export default MyHand;
