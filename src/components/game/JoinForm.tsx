"use client";

import React from "react";
import { Stack, TextField, Button } from "@mui/material";

interface JoinFormProps {
  username: string;
  room: string;
  onUsernameChange: (v: string) => void;
  onRoomChange: (v: string) => void;
  onJoin: () => void;
}

const JoinForm: React.FC<JoinFormProps> = ({ username, room, onUsernameChange, onRoomChange, onJoin }) => (
  <Stack direction="column" spacing={2}>
    <TextField
      id="username-field"
      label="Username"
      value={username}
      fullWidth
      onChange={(e) => onUsernameChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onJoin(); }}
    />
    <TextField
      id="room-field"
      label="Room"
      value={room}
      fullWidth
      onChange={(e) => onRoomChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onJoin(); }}
    />
    <Button
      variant="contained"
      fullWidth
      size="large"
      onClick={onJoin}
      disabled={!username}
    >
      Join Game
    </Button>
  </Stack>
);

export default JoinForm;
