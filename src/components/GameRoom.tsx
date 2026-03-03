"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Divider } from "@mui/material";
import { useSocket } from "@/lib/useSocket";
import { Suit, Card, HandRecord, SocketData } from "@/game/cardTypes";
import { Deck, createFullDeck } from "@/game/deck";
import { handWinner } from "@/game/handLogic";
import JoinForm from "./game/JoinForm";
import Lobby from "./game/Lobby";
import TurnBanner from "./game/TurnBanner";
import RoundInfo from "./game/RoundInfo";
import HandTable from "./game/HandTable";
import MyHand from "./game/MyHand";
import OtherPlayers from "./game/OtherPlayers";
import HandHistory from "./game/HandHistory";
import GameOverScreen from "./game/GameOverScreen";

const GameRoom: React.FC = () => {
  const socketRef = useSocket();

  const [room, setRoom] = useState<string>("room1");
  const [username, setUsername] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Game state
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [leadSuit, setLeadSuit] = useState<Suit | null>(null);
  const [handCards, setHandCards] = useState<Record<string, Card>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [otherCardCounts, setOtherCardCounts] = useState<Record<string, number>>({});
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [handResultMsg, setHandResultMsg] = useState<string>("");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HandRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  // Ref for state read inside socket callbacks (avoids stale closures)
  const stateRef = useRef({
    username: "",
    roomUsers: [] as string[],
    isHost: false,
    room: "room1",
    players: [] as string[],
    leadSuit: null as Suit | null,
    handCards: {} as Record<string, Card>,
    scores: {} as Record<string, number>,
    roundNumber: 1,
  });

  // Keep ref in sync
  useEffect(() => { stateRef.current.username = username; }, [username]);
  useEffect(() => { stateRef.current.roomUsers = roomUsers; }, [roomUsers]);
  useEffect(() => { stateRef.current.room = room; }, [room]);
  useEffect(() => { stateRef.current.players = players; }, [players]);
  useEffect(() => { stateRef.current.leadSuit = leadSuit; }, [leadSuit]);
  useEffect(() => { stateRef.current.handCards = handCards; }, [handCards]);
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
      socket_data: JSON.stringify({ type: "start_game", hands, leader: roomUsers[0], players: roomUsers }),
    });
  };

  const playCard = (card: Card) => {
    if (!socketRef.current || currentTurn !== username) return;
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
        setHandCards({});
        setRoundNumber(1);
        setHandResultMsg("");
        setGameOver(false);
        setHistory([]);
        setHistoryOpen(false);
        setGameStarted(true);
      }

      if (sd.type === "play_card") {
        const { username: player, card } = sd;
        const me = stateRef.current.username;

        setHandCards((prev) => {
          const next = { ...prev, [player]: card };

          if (Object.keys(prev).length === 0) {
            setLeadSuit(card.suit);
            stateRef.current.leadSuit = card.suit;
          }

          const allPlayers = stateRef.current.players;
          if (allPlayers.length === 0) return next;

          const numPlayed = Object.keys(next).length;
          if (numPlayed < allPlayers.length) {
            const playerIdx = allPlayers.indexOf(player);
            const nextIdx = (playerIdx + 1) % allPlayers.length;
            for (let offset = 0; offset < allPlayers.length; offset++) {
              const candidate = allPlayers[(nextIdx + offset) % allPlayers.length];
              if (!next[candidate]) {
                setCurrentTurn(candidate);
                break;
              }
            }
          }

          if (numPlayed === allPlayers.length) {
            const currentLeadSuit = stateRef.current.leadSuit ?? card.suit;
            if (stateRef.current.isHost) {
              const winner = handWinner(next, currentLeadSuit);
              const newScores = { ...stateRef.current.scores, [winner]: (stateRef.current.scores[winner] ?? 0) + 1 };
              const completedRound = stateRef.current.roundNumber;
              const isLastRound = completedRound >= 7;

              setTimeout(() => {
                if (!socketRef.current) return;
                socketRef.current.emit("message", {
                  room_id: stateRef.current.room,
                  username: me,
                  socket_data: JSON.stringify({ type: "hand_result", winner, roundNumber: completedRound, scores: newScores }),
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

        if (player !== stateRef.current.username) {
          setOtherCardCounts((prev) => ({
            ...prev,
            [player]: Math.max(0, (prev[player] ?? 7) - 1),
          }));
        }
      }

      if (sd.type === "hand_result") {
        const { winner, roundNumber: completedRound, scores: newScores } = sd;
        setHandResultMsg(`${winner} wins this hand!`);
        setScores(newScores);
        stateRef.current.scores = newScores;

        const snapshotCards = { ...stateRef.current.handCards };
        const snapshotLeadSuit = stateRef.current.leadSuit;
        if (snapshotLeadSuit) {
          setHistory((prev) => {
            if (prev.some((r) => r.round === completedRound)) return prev;
            return [...prev, { round: completedRound, leadSuit: snapshotLeadSuit, cards: snapshotCards, winner }];
          });
        }

        const nextRound = completedRound + 1;
        setRoundNumber(nextRound);
        stateRef.current.roundNumber = nextRound;

        setTimeout(() => {
          setHandCards({});
          setLeadSuit(null);
          stateRef.current.leadSuit = null;
          stateRef.current.handCards = {};
          setCurrentTurn(winner);
          setHandResultMsg("");
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
      <Box
        sx={{
          width: "100%",
          maxWidth: 700,
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRadius: 2,
          boxShadow: 4,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          532 Cards
        </Typography>

        {!joined && (
          <JoinForm
            username={username}
            room={room}
            onUsernameChange={setUsername}
            onRoomChange={setRoom}
            onJoin={joinRoom}
          />
        )}

        {joined && !gameStarted && (
          <Lobby
            roomUsers={roomUsers}
            username={username}
            isHost={isHost}
            onStartGame={startGame}
          />
        )}

        {gameOver && (
          <GameOverScreen
            finalScores={finalScores}
            history={history}
            historyOpen={historyOpen}
            onToggle={() => setHistoryOpen((o) => !o)}
          />
        )}

        {gameStarted && !gameOver && (
          <>
            <TurnBanner currentTurn={currentTurn} username={username} leadSuit={leadSuit} />

            {handResultMsg && (
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="subtitle1" color="success.main" fontWeight={600}>
                  {handResultMsg}
                </Typography>
              </Box>
            )}

            <RoundInfo roundNumber={roundNumber} scores={scores} username={username} />

            <Divider />

            {Object.keys(handCards).length > 0 && <HandTable handCards={handCards} />}

            <Divider />

            <MyHand
              myCards={myCards}
              currentTurn={currentTurn}
              username={username}
              handCards={handCards}
              onPlayCard={playCard}
            />

            <Divider />

            <OtherPlayers
              otherPlayers={otherPlayers}
              currentTurn={currentTurn}
              handCards={handCards}
              otherCardCounts={otherCardCounts}
            />

            {history.length > 0 && (
              <>
                <Divider />
                <HandHistory
                  history={history}
                  historyOpen={historyOpen}
                  onToggle={() => setHistoryOpen((o) => !o)}
                />
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default GameRoom;
