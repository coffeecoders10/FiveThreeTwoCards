"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Card } from "@/game/cardTypes";
import FaceUpCard from "@/components/card/FaceUpCard";

interface HandTableProps {
  handCards: Record<string, Card>;
}

const HandTable: React.FC<HandTableProps> = ({ handCards }) => (
  <Box>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      Cards played this hand
    </Typography>
    <Stack direction="row" spacing={2} flexWrap="wrap">
      {Object.entries(handCards).map(([player, card]) => (
        <Box key={player} sx={{ textAlign: "center" }}>
          <FaceUpCard card={card} />
          <Typography variant="caption" display="block" mt={0.5}>
            {player}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Box>
);

export default HandTable;
