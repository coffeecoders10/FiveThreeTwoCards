"use client";

import React from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

const TOTAL_SEATS = 3;

interface LobbyProps {
  roomUsers: string[];
  username: string;
  isHost: boolean;
  onStartGame: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ roomUsers, username, isHost, onStartGame }) => (
  <Stack spacing={1.5}>
    {/* Seat rows */}
    {Array.from({ length: TOTAL_SEATS }).map((_, i) => {
      const player = roomUsers[i];
      const isSelf = player === username;

      if (player) {
        return (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.25,
              borderRadius: 2,
              border: "1px solid",
              borderColor: isSelf ? "primary.main" : "rgba(255,255,255,0.12)",
              bgcolor: isSelf ? "rgba(160,118,102,0.1)" : "rgba(255,255,255,0.04)",
            }}
          >
            <PersonIcon sx={{ color: isSelf ? "primary.main" : "text.secondary", fontSize: 20 }} />
            <Typography fontWeight={isSelf ? 700 : 400} sx={{ flex: 1 }}>
              {player}
            </Typography>
            {isSelf && (
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                you
              </Typography>
            )}
          </Box>
        );
      }

      return (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.25,
            borderRadius: 2,
            border: "1px dashed rgba(255,255,255,0.18)",
            "@keyframes pulse": {
              "0%": { opacity: 0.35 },
              "50%": { opacity: 0.75 },
              "100%": { opacity: 0.35 },
            },
            animation: "pulse 1.8s ease-in-out infinite",
          }}
        >
          <PersonIcon sx={{ color: "text.disabled", fontSize: 20 }} />
          <Typography variant="body2" color="text.disabled">
            Waiting for player…
          </Typography>
        </Box>
      );
    })}

    {/* Action */}
    <Box sx={{ pt: 1 }}>
      {isHost ? (
        <Button
          variant="contained"
          color="success"
          fullWidth
          size="large"
          disabled={roomUsers.length !== TOTAL_SEATS}
          onClick={onStartGame}
        >
          {roomUsers.length < TOTAL_SEATS
            ? `Waiting for players… (${roomUsers.length}/${TOTAL_SEATS})`
            : "Start Game"}
        </Button>
      ) : (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Waiting for host to start the game…
        </Typography>
      )}
    </Box>
  </Stack>
);

export default Lobby;
