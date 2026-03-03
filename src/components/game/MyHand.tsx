"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Card } from "@/game/cardTypes";
import FaceUpCard from "@/components/card/FaceUpCard";

interface MyHandProps {
  myCards: Card[];
  currentTurn: string;
  username: string;
  handCards: Record<string, Card>;
  onPlayCard: (card: Card) => void;
}

const MyHand: React.FC<MyHandProps> = ({ myCards, currentTurn, username, handCards, onPlayCard }) => {
  const isMyTurn = currentTurn === username;
  const alreadyPlayed = handCards[username] !== undefined;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Your Hand ({myCards.length} cards)
      </Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {myCards.map((card, i) => {
          const canPlay = isMyTurn && !alreadyPlayed;
          return (
            <FaceUpCard
              key={i}
              card={card}
              clickable={canPlay}
              dimmed={!canPlay && isMyTurn}
              onClick={() => onPlayCard(card)}
            />
          );
        })}
      </Stack>
    </Box>
  );
};

export default MyHand;
