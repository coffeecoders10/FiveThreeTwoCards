"use client";

import React from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";

interface RoundInfoProps {
  roundNumber: number;
  scores: Record<string, number>;
  username: string;
}

const RoundInfo: React.FC<RoundInfoProps> = ({ roundNumber, scores, username }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Typography variant="caption" color="text.secondary">
      Hand {roundNumber} / 7
    </Typography>
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
