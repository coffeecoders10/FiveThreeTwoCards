"use client";

import React from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import { Card } from "@/game/cardTypes";
import { suitSymbol } from "@/components/card/FaceUpCard";
import FaceDownCard from "@/components/card/FaceDownCard";

interface OtherPlayersProps {
  otherPlayers: string[];
  currentTurn: string;
  handCards: Record<string, Card>;
  otherCardCounts: Record<string, number>;
}

const OtherPlayers: React.FC<OtherPlayersProps> = ({ otherPlayers, currentTurn, handCards, otherCardCounts }) => (
  <Box>
    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
      Other Players
    </Typography>
    <Stack spacing={2}>
      {otherPlayers.map((player) => {
        const count = otherCardCounts[player] ?? 7;
        const playedCard = handCards[player];
        return (
          <Box key={player}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography variant="body2" color="text.secondary">
                {player}
              </Typography>
              {currentTurn === player && (
                <Chip label="their turn" size="small" color="warning" />
              )}
              {playedCard && (
                <Typography variant="caption" color="text.secondary">
                  played {playedCard.rank}{suitSymbol(playedCard.suit)}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1.5}>
              {Array.from({ length: count }).map((_, i) => (
                <FaceDownCard key={i} />
              ))}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  </Box>
);

export default OtherPlayers;
