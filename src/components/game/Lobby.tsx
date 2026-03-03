"use client";

import React from "react";
import { Box, Stack, Typography, Chip, Button } from "@mui/material";

interface LobbyProps {
  roomUsers: string[];
  username: string;
  isHost: boolean;
  onStartGame: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ roomUsers, username, isHost, onStartGame }) => (
  <>
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Players in room ({roomUsers.length})
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {roomUsers.map((user) => (
          <Chip
            key={user}
            label={user === username ? `${user} (you)` : user}
            color={user === username ? "primary" : "default"}
            size="small"
          />
        ))}
      </Stack>
    </Box>

    {isHost && (
      <Button
        variant="contained"
        color="success"
        disabled={roomUsers.length !== 3}
        onClick={onStartGame}
      >
        {roomUsers.length < 3 ? `Waiting for players... (${roomUsers.length}/3)` : "Start Game"}
      </Button>
    )}

    {!isHost && (
      <Typography variant="body2" color="text.secondary">
        Waiting for host to start the game...
      </Typography>
    )}
  </>
);

export default Lobby;
