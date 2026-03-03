"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import { useSocket } from "@/lib/useSocket";

// --------------------
// Card Types
// --------------------
type Suit = "hearts" | "diamonds" | "clubs" | "spades";

interface Card {
  suit: Suit;
  rank: string;
}

// --------------------
// Deck Class
// --------------------
class Deck {
  private _cards: Card[] = [];

  constructor(cards?: Card[]) {
    if (cards) {
      this._cards = [...cards];
    }
  }

  public shuffle() {
    for (let i = this._cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
    }
  }

  public draw(count: number = 1): Card | Card[] | undefined {
    if (count === 1) {
      return this._cards.shift();
    }
    return this._cards.splice(0, count);
  }
}

const createFullDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
  const deck: Card[] = [];
  suits.forEach((suit) => ranks.forEach((rank) => deck.push({ suit, rank })));
  return deck;
};

// --------------------
// Card Display Components
// --------------------
const suitSymbol = (suit: Suit) =>
  ({ hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[suit]);

const isRed = (suit: Suit) => suit === "hearts" || suit === "diamonds";

const FaceUpCard: React.FC<{ card: Card }> = ({ card }) => (
  <Paper
    elevation={3}
    sx={{
      width: 70,
      height: 100,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 2,
      backgroundColor: "#fff",
      color: isRed(card.suit) ? "#c0392b" : "#1a1a1a",
      userSelect: "none",
    }}
  >
    <Typography variant="body2" fontWeight="bold" lineHeight={1}>
      {card.rank}
    </Typography>
    <Typography variant="h6" lineHeight={1}>
      {suitSymbol(card.suit)}
    </Typography>
  </Paper>
);

const FaceDownCard: React.FC = () => (
  <Paper
    elevation={3}
    sx={{
      width: 70,
      height: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 2,
      backgroundColor: "#3a4a6b",
      backgroundImage:
        "repeating-linear-gradient(45deg, #2e3d5c 0px, #2e3d5c 4px, transparent 4px, transparent 12px)",
    }}
  />
);

// --------------------
// GameRoom Component
// --------------------
const GameRoom: React.FC = () => {
  const socketRef = useSocket();

  const [room, setRoom] = useState<string>("room1");
  const [username, setUsername] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<string[]>([]);

  const isHost = roomUsers[0] === username;

  const joinRoom = () => {
    if (!socketRef.current || !room || !username) return;
    socketRef.current.emit("join", { room_id: room, username });
    setJoined(true);
  };

  const startGame = () => {
    if (!socketRef.current || !joined) return;

    const deck = new Deck(createFullDeck());
    deck.shuffle();
    const hands: Record<string, Card[]> = {};
    for (const user of roomUsers) {
      hands[user] = deck.draw(4) as Card[];
    }

    socketRef.current.emit("start_game", {
      room_id: room,
      socket_data: { hands },
    });
  };

  useEffect(() => {
    if (!socketRef.current) return;

    const handleStatus = (data: { users: string[]; log: string }) => {
      setRoomUsers(data.users);
    };

    const handleStartGame = (data: { socket_data: { hands: Record<string, Card[]> } }) => {
      const hands = data.socket_data?.hands;
      if (!hands) return;

      setMyCards(hands[username] ?? []);
      setOtherPlayers(Object.keys(hands).filter((u) => u !== username));
      setGameStarted(true);
    };

    socketRef.current.on("status", handleStatus);
    socketRef.current.on("start_game", handleStartGame);

    return () => {
      socketRef.current?.off("status", handleStatus);
      socketRef.current?.off("start_game", handleStartGame);
    };
  }, [socketRef, username]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 600,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          532 Cards
        </Typography>

        {/* Join Form */}
        {!joined && (
          <Stack direction="row" spacing={2}>
            <TextField
              label="Username"
              value={username}
              size="small"
              fullWidth
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") joinRoom(); }}
            />
            <TextField
              label="Room"
              value={room}
              size="small"
              fullWidth
              onChange={(e) => setRoom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") joinRoom(); }}
            />
            <Button variant="contained" onClick={joinRoom} disabled={!username}>
              Join
            </Button>
          </Stack>
        )}

        {/* Players in Room */}
        {joined && !gameStarted && (
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
                disabled={roomUsers.length < 2}
                onClick={startGame}
              >
                {roomUsers.length < 2 ? "Waiting for players..." : "Start Game"}
              </Button>
            )}

            {!isHost && joined && (
              <Typography variant="body2" color="text.secondary">
                Waiting for host to start the game...
              </Typography>
            )}
          </>
        )}

        {/* In-Game View */}
        {gameStarted && (
          <>
            {/* My Hand */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Your Hand
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                {myCards.map((card, i) => (
                  <FaceUpCard key={i} card={card} />
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Other Players */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Other Players
              </Typography>
              <Stack spacing={2}>
                {otherPlayers.map((player) => (
                  <Box key={player}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {player}
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <FaceDownCard key={i} />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default GameRoom;
