"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Suit } from "@/game/cardTypes";
import { suitSymbol } from "@/components/card/FaceUpCard";

interface TurnBannerProps {
  currentTurn: string;
  username: string;
  leadSuit: Suit | null;
}

const TurnBanner: React.FC<TurnBannerProps> = ({ currentTurn, username, leadSuit }) => (
  <Box
    sx={{
      p: 1.5,
      borderRadius: 2,
      backgroundColor: currentTurn === username ? "primary.main" : "background.paper",
      textAlign: "center",
    }}
  >
    <Typography
      variant="subtitle1"
      fontWeight={700}
      color={currentTurn === username ? "background.default" : "text.primary"}
    >
      {currentTurn === username ? "Your turn! Play a card." : `Waiting for ${currentTurn}...`}
    </Typography>
    {leadSuit && (
      <Typography variant="caption" color={currentTurn === username ? "background.default" : "text.secondary"}>
        Lead suit: {suitSymbol(leadSuit)} {leadSuit}
      </Typography>
    )}
  </Box>
);

export default TurnBanner;
