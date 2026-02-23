"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useSocket } from "@/lib/useSocket";

type Message = {
  room_id: string;
  username: string;
  message: string;
};

const RoomChat: React.FC = () => {
  const socketRef = useSocket();

  const [room, setRoom] = useState<string>("room1");
  const [username, setUsername] = useState<string>("Nitish");
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [joined, setJoined] = useState<boolean>(false);

  // Join Room
  const joinRoom = () => {
    if (!socketRef.current || !room) return;
    console.log(`Joining room ${room} as ${username}`);
    socketRef.current.emit("join", {
      room_id: room,
      username,
    });
    console.log(`Joined room ${room} as ${username}`);
    setJoined(true);
  };

  // Send Message
  const sendMessage = () => {
    if (!socketRef.current || !message || !joined) return;
    console.log(`Sending message '${message}' to room ${room} as ${username}`);
    socketRef.current.emit("message", {
      room_id: room,
      username,
      message: JSON.stringify({ message: message, card: "Ace" }),
    });
    console.log(`Message sent`);
    setMessage("");
  };

  // Listen for incoming messages
  useEffect(() => {
    if (!socketRef.current) return;

    const handleReceive = (data: Message) => {
      console.log(
        `Received message ${JSON.stringify(data)} '${data.message}' from ${data.username} in room ${data.room_id}`,
      );
      setMessages((prev) => [...prev, data]);
    };

    socketRef.current.on("message", handleReceive);

    return () => {
      socketRef.current?.off("message", handleReceive);
    };
  }, [socketRef]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Paper
        elevation={4}
        sx={{
          width: 500,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Room Chat
        </Typography>

        {/* Room + Username */}
        <Stack direction="row" spacing={2}>
          <TextField
            label="Username"
            value={username}
            size="small"
            fullWidth
            onChange={(e) => setUsername(e.target.value)}
            disabled={joined}
          />
          <TextField
            label="Room"
            value={room}
            size="small"
            fullWidth
            onChange={(e) => setRoom(e.target.value)}
            disabled={joined}
          />
          <Button variant="contained" onClick={joinRoom} disabled={joined}>
            Join
          </Button>
        </Stack>

        <Divider />

        {/* Messages */}
        <Paper
          variant="outlined"
          sx={{
            height: 250,
            overflowY: "auto",
            p: 1,
          }}
        >
          <List dense>
            {messages.map((msg, index) => (
              <ListItem key={index} disablePadding>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      <strong>{msg.username}:</strong> {msg.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Send Message */}
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            value={message}
            size="small"
            fullWidth
            onChange={(e) => setMessage(e.target.value)}
            disabled={!joined}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <Button variant="contained" onClick={sendMessage} disabled={!joined}>
            Send
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RoomChat;
