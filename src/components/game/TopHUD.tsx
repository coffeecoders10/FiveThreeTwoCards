"use client";

import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { Suit } from "@/game/cardTypes";
import { suitSymbol, isRed } from "@/components/card/FaceUpCard";

interface TopHUDProps {
  roundNumber: number;
  trumpSuit: Suit | null;
  currentTurn: string;
  username: string;
}

const TopHUD: React.FC<TopHUDProps> = ({ roundNumber, trumpSuit, currentTurn, username }) => {
  const isMyTurn = currentTurn === username;

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        py: 1.5,
        bgcolor: "background.paper",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    >
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        Round {roundNumber} / 10
      </Typography>

      {trumpSuit ? (
        <Chip
          label={`Trump: ${suitSymbol(trumpSuit)}`}
          size="small"
          sx={{
            bgcolor: isRed(trumpSuit) ? "rgba(192,57,43,0.2)" : "rgba(255,255,255,0.1)",
            color: isRed(trumpSuit) ? "error.light" : "text.primary",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        />
      ) : (
        <Chip label="No trump yet" size="small" sx={{ opacity: 0.4 }} />
      )}

      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ color: isMyTurn ? "primary.main" : "text.secondary" }}
      >
        {isMyTurn ? "Your turn" : `${currentTurn}'s turn`}
      </Typography>
    </Box>
  );
};

export default TopHUD;
