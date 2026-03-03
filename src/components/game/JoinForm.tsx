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
  <Stack direction="row" spacing={2}>
    <TextField
      label="Username"
      value={username}
      size="small"
      fullWidth
      onChange={(e) => onUsernameChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onJoin(); }}
    />
    <TextField
      label="Room"
      value={room}
      size="small"
      fullWidth
      onChange={(e) => onRoomChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onJoin(); }}
    />
    <Button variant="contained" onClick={onJoin} disabled={!username}>
      Join
    </Button>
  </Stack>
);

export default JoinForm;
