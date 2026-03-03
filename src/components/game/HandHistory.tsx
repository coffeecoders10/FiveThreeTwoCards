"use client";

import React from "react";
import { Box, Stack, Typography, IconButton, Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { HandRecord } from "@/game/cardTypes";
import FaceUpCard, { suitSymbol } from "@/components/card/FaceUpCard";

interface HandHistoryProps {
  history: HandRecord[];
  historyOpen: boolean;
  onToggle: () => void;
  label?: string;
}

const HandHistory: React.FC<HandHistoryProps> = ({ history, historyOpen, onToggle, label }) => (
  <Box>
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ cursor: "pointer" }}
      onClick={onToggle}
    >
      <Typography variant="subtitle2" color="text.secondary">
        {label ?? `Hand History (${history.length} hand${history.length !== 1 ? "s" : ""} completed)`}
      </Typography>
      <IconButton size="small">
        {historyOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </IconButton>
    </Stack>
    <Collapse in={historyOpen}>
      <Stack spacing={1.5} mt={1}>
        {[...history].reverse().map((record) => (
          <Box
            key={record.round}
            sx={{
              p: 1.5,
              borderRadius: 1,
              backgroundColor: "background.default",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" fontWeight={600}>
                Hand {record.round}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Lead: {suitSymbol(record.leadSuit)} {record.leadSuit}
                </Typography>
                <Typography variant="caption" color="success.main" fontWeight={600}>
                  · {record.winner} wins
                </Typography>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {Object.entries(record.cards).map(([player, card]) => (
                <Box key={player} sx={{ textAlign: "center" }}>
                  <FaceUpCard card={card} />
                  <Typography
                    variant="caption"
                    display="block"
                    mt={0.5}
                    fontWeight={player === record.winner ? 700 : 400}
                    color={player === record.winner ? "success.main" : "text.secondary"}
                  >
                    {player}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Collapse>
  </Box>
);

export default HandHistory;
