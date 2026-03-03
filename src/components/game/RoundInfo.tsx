"use client";

import React from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import { Suit } from "@/game/cardTypes";
import { suitSymbol, isRed } from "@/components/card/FaceUpCard";

interface RoundInfoProps {
  roundNumber: number;
  scores: Record<string, number>;
  username: string;
  trumpSuit: Suit | null;
}

const RoundInfo: React.FC<RoundInfoProps> = ({ roundNumber, scores, username, trumpSuit }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Typography variant="caption" color="text.secondary">
        Hand {roundNumber} / 10
      </Typography>
      {trumpSuit && (
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: isRed(trumpSuit) ? "error.main" : "text.primary" }}
        >
          Trump: {suitSymbol(trumpSuit)} {trumpSuit}
        </Typography>
      )}
    </Stack>
    <Stack direction="row" spacing={1}>
      {Object.entries(scores).map(([player, score]) => (
        <Chip
          key={player}
          label={`${player}: ${score} hand${score !== 1 ? "s" : ""}`}
          size="small"
          color={player === username ? "primary" : "default"}
        />
      ))}
    </Stack>
  </Box>
);

export default RoundInfo;
