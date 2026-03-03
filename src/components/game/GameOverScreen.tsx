"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { HandRecord } from "@/game/cardTypes";
import HandHistory from "./HandHistory";

interface GameOverScreenProps {
  finalScores: Record<string, number>;
  history: HandRecord[];
  historyOpen: boolean;
  onToggle: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ finalScores, history, historyOpen, onToggle }) => {
  const maxScore = Math.max(...Object.values(finalScores));
  const winners = Object.entries(finalScores)
    .filter(([, s]) => s === maxScore)
    .map(([p]) => p);

  return (
    <Box>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: "background.paper",
          border: "2px solid",
          borderColor: "primary.main",
          textAlign: "center",
          boxShadow: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
          Game Over!
        </Typography>
        <Typography variant="h6" gutterBottom>
          {winners.join(" & ")} {winners.length > 1 ? "tie" : "wins"}! ({maxScore} hands)
        </Typography>
        <Stack spacing={0.5} mt={1}>
          {Object.entries(finalScores)
            .sort(([, a], [, b]) => b - a)
            .map(([player, score]) => (
              <Typography key={player} variant="body2">
                {player}: {score} hand{score !== 1 ? "s" : ""}
              </Typography>
            ))}
        </Stack>
      </Box>

      {history.length > 0 && (
        <Box mt={2}>
          <HandHistory
            history={history}
            historyOpen={historyOpen}
            onToggle={onToggle}
            label="Full Hand History"
          />
        </Box>
      )}
    </Box>
  );
};

export default GameOverScreen;
