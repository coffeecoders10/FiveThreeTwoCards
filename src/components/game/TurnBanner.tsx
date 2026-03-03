"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Suit } from "@/game/cardTypes";
import { suitSymbol, isRed } from "@/components/card/FaceUpCard";

interface TurnBannerProps {
  currentTurn: string;
  username: string;
  leadSuit: Suit | null;
  trumpSuit: Suit | null;
}

const TurnBanner: React.FC<TurnBannerProps> = ({ currentTurn, username, leadSuit, trumpSuit }) => {
  const isMyTurn = currentTurn === username;
  const captionColor = isMyTurn ? "background.default" : "text.secondary";

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor: isMyTurn ? "primary.main" : "background.paper",
        textAlign: "center",
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={700}
        color={isMyTurn ? "background.default" : "text.primary"}
      >
        {isMyTurn ? "Your turn! Play a card." : `Waiting for ${currentTurn}...`}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        {leadSuit && (
          <Typography variant="caption" color={captionColor}>
            Lead: {suitSymbol(leadSuit)} {leadSuit}
          </Typography>
        )}
        {trumpSuit && (
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ color: isMyTurn ? "background.default" : (isRed(trumpSuit) ? "error.light" : "text.secondary") }}
          >
            Trump: {suitSymbol(trumpSuit)} {trumpSuit}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default TurnBanner;
