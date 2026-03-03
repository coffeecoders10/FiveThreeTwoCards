"use client";

import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Suit } from "@/game/cardTypes";
import { suitSymbol, isRed } from "@/components/card/FaceUpCard";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

interface TrumpSelectorProps {
  isChooser: boolean;
  chooserName: string;
  onSelectTrump: (suit: Suit) => void;
}

const TrumpSelector: React.FC<TrumpSelectorProps> = ({ isChooser, chooserName, onSelectTrump }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2,
      border: "2px dashed",
      borderColor: "warning.main",
      textAlign: "center",
    }}
  >
    {isChooser ? (
      <>
        <Typography variant="subtitle1" fontWeight={700} color="warning.main" gutterBottom>
          Choose the Trump Suit
        </Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center">
          {SUITS.map((suit) => (
            <Button
              key={suit}
              variant="outlined"
              onClick={() => onSelectTrump(suit)}
              sx={{
                fontSize: "1.4rem",
                minWidth: 60,
                color: isRed(suit) ? "error.main" : "text.primary",
                borderColor: isRed(suit) ? "error.main" : "text.primary",
                "&:hover": {
                  backgroundColor: isRed(suit) ? "error.light" : "action.hover",
                },
              }}
            >
              {suitSymbol(suit)}
            </Button>
          ))}
        </Stack>
      </>
    ) : (
      <Typography variant="subtitle1" color="text.secondary">
        Waiting for <strong>{chooserName}</strong> to choose the trump suit...
      </Typography>
    )}
  </Box>
);

export default TrumpSelector;
