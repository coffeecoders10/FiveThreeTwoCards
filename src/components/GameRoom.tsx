"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Divider,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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

  public draw(count: number = 1): Card[] {
    return this._cards.splice(0, count);
  }
}

const createFullDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];
  const deck: Card[] = [];
  suits.forEach((suit) => ranks.forEach((rank) => deck.push({ suit, rank })));
  return deck;
};

// --------------------
// Card rank comparison
// --------------------
const RANK_ORDER = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];

function trickWinner(trickCards: Record<string, Card>, leadSuit: Suit): string {
  let bestPlayer = "";
  let bestCard: Card | null = null;

  for (const [player, card] of Object.entries(trickCards)) {
    if (!bestCard) {
      bestPlayer = player;
      bestCard = card;
      continue;
    }
    const bestIsLead = bestCard.suit === leadSuit;
    const cardIsLead = card.suit === leadSuit;

    if (cardIsLead && !bestIsLead) {
      bestPlayer = player;
      bestCard = card;
    } else if (cardIsLead && bestIsLead) {
      if (RANK_ORDER.indexOf(card.rank) > RANK_ORDER.indexOf(bestCard.rank)) {
        bestPlayer = player;
        bestCard = card;
      }
    }
    // card is off-suit: can never beat best
  }

  return bestPlayer;
}

// --------------------
// Card Display Components
// --------------------
const suitSymbol = (suit: Suit) =>
  ({ hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" }[suit]);

const isRed = (suit: Suit) => suit === "hearts" || suit === "diamonds";

const FaceUpCard: React.FC<{ card: Card; clickable?: boolean; onClick?: () => void; dimmed?: boolean }> = ({
  card,
  clickable,
  onClick,
  dimmed,
}) => (
  <Paper
    elevation={3}
    onClick={clickable ? onClick : undefined}
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
      cursor: clickable ? "pointer" : "default",
      opacity: dimmed ? 0.4 : 1,
      transition: "transform 0.1s, box-shadow 0.1s",
      "&:hover": clickable
        ? {
            transform: "translateY(-6px)",
            boxShadow: "0 6px 20px rgba(160,118,102,0.6)",
          }
        : {},
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
// History types
// --------------------
interface TrickRecord {
  round: number;
  leadSuit: Suit;
  cards: Record<string, Card>; // { player: card }
  winner: string;
}

// --------------------
// Socket data types
// --------------------
type SocketData =
  | { type: "start_game"; hands: Record<string, Card[]>; leader: string; players: string[] }
  | { type: "play_card"; username: string; card: Card }
  | { type: "trick_result"; winner: string; roundNumber: number; scores: Record<string, number> }
  | { type: "game_over"; scores: Record<string, number> };

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

  // Game state
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<string[]>([]); // ordered list of all players
  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [leadSuit, setLeadSuit] = useState<Suit | null>(null);
  const [trickCards, setTrickCards] = useState<Record<string, Card>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [otherCardCounts, setOtherCardCounts] = useState<Record<string, number>>({});
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [trickResultMsg, setTrickResultMsg] = useState<string>("");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<TrickRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  // Use a ref for state that needs to be read inside socket callbacks without stale closures
  const stateRef = useRef({
    username: "",
    roomUsers: [] as string[],
    isHost: false,
    room: "room1",
    players: [] as string[],
    leadSuit: null as Suit | null,
    trickCards: {} as Record<string, Card>,
    scores: {} as Record<string, number>,
    roundNumber: 1,
  });

  // Keep ref in sync
  useEffect(() => { stateRef.current.username = username; }, [username]);
  useEffect(() => { stateRef.current.roomUsers = roomUsers; }, [roomUsers]);
  useEffect(() => { stateRef.current.room = room; }, [room]);
  useEffect(() => { stateRef.current.players = players; }, [players]);
  useEffect(() => { stateRef.current.leadSuit = leadSuit; }, [leadSuit]);
  useEffect(() => { stateRef.current.trickCards = trickCards; }, [trickCards]);
  useEffect(() => { stateRef.current.scores = scores; }, [scores]);
  useEffect(() => { stateRef.current.roundNumber = roundNumber; }, [roundNumber]);

  const isHost = roomUsers[0] === username;
  useEffect(() => { stateRef.current.isHost = roomUsers[0] === username; }, [roomUsers, username]);

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
      hands[user] = deck.draw(7);
    }

    socketRef.current.emit("message", {
      room_id: room,
      username,
      socket_data: JSON.stringify({
        type: "start_game",
        hands,
        leader: roomUsers[0],
        players: roomUsers,
      }),
    });
  };

  const playCard = (card: Card) => {
    if (!socketRef.current || currentTurn !== username) return;

    // Optimistically remove from hand
    setMyCards((prev) => {
      const idx = prev.findIndex((c) => c.suit === card.suit && c.rank === card.rank);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });

    socketRef.current.emit("message", {
      room_id: stateRef.current.room,
      username,
      socket_data: JSON.stringify({ type: "play_card", username, card }),
    });
  };

  useEffect(() => {
    if (!socketRef.current) return;

    const handleStatus = (data: { users: string[]; log: string }) => {
      setRoomUsers(data.users);
    };

    const handleMessage = (data: { username: string; socket_data: SocketData }) => {
      const sd = data.socket_data;

      if (sd.type === "start_game") {
        const me = stateRef.current.username;
        setMyCards(sd.hands[me] ?? []);
        setPlayers(sd.players);
        const initCounts: Record<string, number> = {};
        for (const p of sd.players) {
          if (p !== me) initCounts[p] = 7;
        }
        setOtherCardCounts(initCounts);
        const initScores: Record<string, number> = {};
        for (const p of sd.players) initScores[p] = 0;
        setScores(initScores);
        setCurrentTurn(sd.leader);
        setLeadSuit(null);
        setTrickCards({});
        setRoundNumber(1);
        setTrickResultMsg("");
        setGameOver(false);
        setHistory([]);
        setHistoryOpen(false);
        setGameStarted(true);
      }

      if (sd.type === "play_card") {
        const { username: player, card } = sd;
        const me = stateRef.current.username;

        setTrickCards((prev) => {
          const next = { ...prev, [player]: card };

          // Set lead suit on first card
          if (Object.keys(prev).length === 0) {
            setLeadSuit(card.suit);
            stateRef.current.leadSuit = card.suit;
          }

          // Determine who plays next
          const allPlayers = stateRef.current.players;
          if (allPlayers.length === 0) return next;

          const numPlayed = Object.keys(next).length;
          if (numPlayed < allPlayers.length) {
            // Find who hasn't played yet — next in order after current leader
            // currentTurn rotates: we don't need to set it here because
            // we'll derive it from who is missing in trickCards
            // Find next player in order who hasn't played
            // Advance turn: find the index of the player who just played, next in cycle
            const playerIdx = allPlayers.indexOf(player);
            const nextIdx = (playerIdx + 1) % allPlayers.length;
            // Skip players who already played
            for (let offset = 0; offset < allPlayers.length; offset++) {
              const candidate = allPlayers[(nextIdx + offset) % allPlayers.length];
              if (!next[candidate]) {
                setCurrentTurn(candidate);
                break;
              }
            }
          }

          // If all played, host computes winner
          if (numPlayed === allPlayers.length) {
            const currentLeadSuit = stateRef.current.leadSuit ?? card.suit;
            if (stateRef.current.isHost) {
              const winner = trickWinner(next, currentLeadSuit);
              const newScores = { ...stateRef.current.scores, [winner]: (stateRef.current.scores[winner] ?? 0) + 1 };
              // roundNumber in stateRef is the current round (1-based), not yet incremented
              const completedRound = stateRef.current.roundNumber;
              const isLastRound = completedRound >= 7;

              setTimeout(() => {
                if (!socketRef.current) return;
                socketRef.current.emit("message", {
                  room_id: stateRef.current.room,
                  username: me,
                  socket_data: JSON.stringify({
                    type: "trick_result",
                    winner,
                    roundNumber: completedRound,
                    scores: newScores,
                  }),
                });

                if (isLastRound) {
                  socketRef.current.emit("message", {
                    room_id: stateRef.current.room,
                    username: me,
                    socket_data: JSON.stringify({ type: "game_over", scores: newScores }),
                  });
                }
              }, 800);
            }
          }

          return next;
        });

        // Update other players' card count
        if (player !== stateRef.current.username) {
          setOtherCardCounts((prev) => ({
            ...prev,
            [player]: Math.max(0, (prev[player] ?? 7) - 1),
          }));
        }
      }

      if (sd.type === "trick_result") {
        const { winner, roundNumber: completedRound, scores: newScores } = sd;
        setTrickResultMsg(`${winner} wins this hand!`);
        setScores(newScores);
        stateRef.current.scores = newScores;

        // Capture snapshot for history before clearing trick state
        const snapshotCards = { ...stateRef.current.trickCards };
        const snapshotLeadSuit = stateRef.current.leadSuit;
        if (snapshotLeadSuit) {
          setHistory((prev) => {
            // Deduplicate: ignore if this round is already recorded
            if (prev.some((r) => r.round === completedRound)) return prev;
            return [...prev, { round: completedRound, leadSuit: snapshotLeadSuit, cards: snapshotCards, winner }];
          });
        }

        // Advance round counter to the next round
        const nextRound = completedRound + 1;
        setRoundNumber(nextRound);
        stateRef.current.roundNumber = nextRound;

        setTimeout(() => {
          setTrickCards({});
          setLeadSuit(null);
          stateRef.current.leadSuit = null;
          stateRef.current.trickCards = {};
          setCurrentTurn(winner);
          setTrickResultMsg("");
        }, 1500);
      }

      if (sd.type === "game_over") {
        setFinalScores(sd.scores);
        setGameOver(true);
      }
    };

    socketRef.current.on("status", handleStatus);
    socketRef.current.on("message", handleMessage);

    return () => {
      socketRef.current?.off("status", handleStatus);
      socketRef.current?.off("message", handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef]);

  const otherPlayers = players.filter((p) => p !== username);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 700,
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

        {/* Lobby */}
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

        {/* Game Over */}
        {gameOver && (
          <Box>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "background.paper",
                border: "2px solid",
                borderColor: "primary.main",
                textAlign: "center",
              }}
            >
              <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                Game Over!
              </Typography>
              {(() => {
                const maxScore = Math.max(...Object.values(finalScores));
                const winners = Object.entries(finalScores)
                  .filter(([, s]) => s === maxScore)
                  .map(([p]) => p);
                return (
                  <Typography variant="h6" gutterBottom>
                    {winners.join(" & ")} {winners.length > 1 ? "tie" : "wins"}! ({maxScore} hands)
                  </Typography>
                );
              })()}
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

            {/* Full history shown after game ends */}
            {history.length > 0 && (
              <Box mt={2}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ cursor: "pointer" }}
                  onClick={() => setHistoryOpen((o) => !o)}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Full Hand History
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
            )}
          </Box>
        )}

        {/* In-Game View */}
        {gameStarted && !gameOver && (
          <>
            {/* Turn Banner */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: currentTurn === username ? "primary.main" : "background.paper",
                textAlign: "center",
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color={currentTurn === username ? "background.default" : "text.primary"}
              >
                {currentTurn === username
                  ? "Your turn! Play a card."
                  : `Waiting for ${currentTurn}...`}
              </Typography>
              {leadSuit && (
                <Typography variant="caption" color={currentTurn === username ? "background.default" : "text.secondary"}>
                  Lead suit: {suitSymbol(leadSuit)} {leadSuit}
                </Typography>
              )}
            </Box>

            {/* Trick Result Flash */}
            {trickResultMsg && (
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="subtitle1" color="success.main" fontWeight={600}>
                  {trickResultMsg}
                </Typography>
              </Box>
            )}

            {/* Round Info */}
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

            <Divider />

            {/* Table — Trick in Progress */}
            {Object.keys(trickCards).length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cards played this hand
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {Object.entries(trickCards).map(([player, card]) => (
                    <Box key={player} sx={{ textAlign: "center" }}>
                      <FaceUpCard card={card} />
                      <Typography variant="caption" display="block" mt={0.5}>
                        {player}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider />

            {/* My Hand */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Your Hand ({myCards.length} cards)
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {myCards.map((card, i) => {
                  const isMyTurn = currentTurn === username;
                  const alreadyPlayed = trickCards[username] !== undefined;
                  const canPlay = isMyTurn && !alreadyPlayed;
                  return (
                    <FaceUpCard
                      key={i}
                      card={card}
                      clickable={canPlay}
                      dimmed={!canPlay && isMyTurn}
                      onClick={() => playCard(card)}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Divider />

            {/* Other Players */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Other Players
              </Typography>
              <Stack spacing={2}>
                {otherPlayers.map((player) => {
                  const count = otherCardCounts[player] ?? 7;
                  const playedCard = trickCards[player];
                  return (
                    <Box key={player}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {player}
                        </Typography>
                        {currentTurn === player && (
                          <Chip label="their turn" size="small" color="warning" />
                        )}
                        {playedCard && (
                          <Typography variant="caption" color="text.secondary">
                            played {playedCard.rank}{suitSymbol(playedCard.suit)}
                          </Typography>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={1.5}>
                        {Array.from({ length: count }).map((_, i) => (
                          <FaceDownCard key={i} />
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Play History */}
            {history.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ cursor: "pointer" }}
                    onClick={() => setHistoryOpen((o) => !o)}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Hand History ({history.length} hand{history.length !== 1 ? "s" : ""} completed)
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
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default GameRoom;
