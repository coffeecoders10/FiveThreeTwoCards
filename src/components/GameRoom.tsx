"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Divider } from "@mui/material";
import { useSocket } from "@/lib/useSocket";
import { Suit, Card, HandRecord, SocketData } from "@/game/cardTypes";
import { Deck, create532Deck } from "@/game/deck";
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
import TrumpSelector from "./game/TrumpSelector";

type GamePhase = "lobby" | "trump_selection" | "playing";

const GameRoom: React.FC = () => {
  const socketRef = useSocket();

  const [room, setRoom] = useState<string>("room1");
  const [username, setUsername] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>("lobby");

  // Game state
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string>("");
  const [leadSuit, setLeadSuit] = useState<Suit | null>(null);
  const [trumpSuit, setTrumpSuit] = useState<Suit | null>(null);
  const [trumpChooser, setTrumpChooser] = useState<string>("");
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
    trumpSuit: null as Suit | null,
    handCards: {} as Record<string, Card>,
    scores: {} as Record<string, number>,
    roundNumber: 1,
    // Host-only: second half of dealt hands, held until trump is chosen
    pendingFinalHands: {} as Record<string, Card[]>,
    trumpChooser: "",
  });

  // Keep ref in sync
  useEffect(() => { stateRef.current.username = username; }, [username]);
  useEffect(() => { stateRef.current.roomUsers = roomUsers; }, [roomUsers]);
  useEffect(() => { stateRef.current.room = room; }, [room]);
  useEffect(() => { stateRef.current.players = players; }, [players]);
  useEffect(() => { stateRef.current.leadSuit = leadSuit; }, [leadSuit]);
  useEffect(() => { stateRef.current.trumpSuit = trumpSuit; }, [trumpSuit]);
  useEffect(() => { stateRef.current.handCards = handCards; }, [handCards]);
  useEffect(() => { stateRef.current.scores = scores; }, [scores]);
  useEffect(() => { stateRef.current.roundNumber = roundNumber; }, [roundNumber]);
  useEffect(() => { stateRef.current.trumpChooser = trumpChooser; }, [trumpChooser]);

  const isHost = roomUsers[0] === username;
  useEffect(() => { stateRef.current.isHost = roomUsers[0] === username; }, [roomUsers, username]);

  const joinRoom = () => {
    if (!socketRef.current || !room || !username) return;
    socketRef.current.emit("join", { room_id: room, username });
    setJoined(true);
  };

  const startGame = () => {
    if (!socketRef.current || !joined) return;
    const deck = new Deck(create532Deck());
    deck.shuffle();

    const allPlayers = stateRef.current.roomUsers;
    // Deal first 5 cards to each player
    const initialHands: Record<string, Card[]> = {};
    const finalHands: Record<string, Card[]> = {};
    for (const user of allPlayers) {
      initialHands[user] = deck.draw(5);
      finalHands[user] = deck.draw(5);
    }

    // Pick random trump chooser
    const chooserIdx = Math.floor(Math.random() * allPlayers.length);
    const chooser = allPlayers[chooserIdx];

    // Store second-half hands until trump is chosen
    stateRef.current.pendingFinalHands = finalHands;

    socketRef.current.emit("message", {
      room_id: room,
      username,
      socket_data: JSON.stringify({
        type: "deal_initial",
        hands: initialHands,
        trumpChooser: chooser,
        players: allPlayers,
      }),
    });
  };

  const selectTrump = (suit: Suit) => {
    if (!socketRef.current) return;
    socketRef.current.emit("message", {
      room_id: stateRef.current.room,
      username,
      socket_data: JSON.stringify({
        type: "trump_selected",
        suit,
        leader: stateRef.current.trumpChooser,
      }),
    });
  };

  const playCard = (card: Card) => {
    if (!socketRef.current || currentTurn !== username) return;
    if (handCards[username]) return; // already played this hand

    // Follow-suit enforcement: if lead suit is set and player holds that suit, must play it
    if (leadSuit) {
      const hasLeadSuit = myCards.some((c) => c.suit === leadSuit);
      if (hasLeadSuit && card.suit !== leadSuit) return;
    }

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

      if (sd.type === "deal_initial") {
        const me = stateRef.current.username;
        setMyCards(sd.hands[me] ?? []);
        setPlayers(sd.players);
        setTrumpChooser(sd.trumpChooser);
        stateRef.current.trumpChooser = sd.trumpChooser;
        const initScores: Record<string, number> = {};
        for (const p of sd.players) initScores[p] = 0;
        setScores(initScores);
        setLeadSuit(null);
        setHandCards({});
        setRoundNumber(1);
        setHandResultMsg("");
        setGameOver(false);
        setHistory([]);
        setHistoryOpen(false);
        setPhase("trump_selection");
      }

      if (sd.type === "trump_selected") {
        setTrumpSuit(sd.suit);
        stateRef.current.trumpSuit = sd.suit;

        // Only host emits deal_final
        if (stateRef.current.isHost) {
          const finalHands = stateRef.current.pendingFinalHands;
          if (!socketRef.current) return;
          socketRef.current.emit("message", {
            room_id: stateRef.current.room,
            username: stateRef.current.username,
            socket_data: JSON.stringify({
              type: "deal_final",
              hands: finalHands,
              trumpSuit: sd.suit,
              leader: sd.leader,
            }),
          });
        }
      }

      if (sd.type === "deal_final") {
        const me = stateRef.current.username;
        setMyCards((prev) => [...prev, ...(sd.hands[me] ?? [])]);
        setTrumpSuit(sd.trumpSuit);
        stateRef.current.trumpSuit = sd.trumpSuit;

        const allPlayers = stateRef.current.players;
        const initCounts: Record<string, number> = {};
        for (const p of allPlayers) {
          if (p !== me) initCounts[p] = 10;
        }
        setOtherCardCounts(initCounts);
        setCurrentTurn(sd.leader);
        setPhase("playing");
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
            const currentTrumpSuit = stateRef.current.trumpSuit ?? currentLeadSuit;
            if (stateRef.current.isHost) {
              const winner = handWinner(next, currentLeadSuit, currentTrumpSuit);
              const newScores = { ...stateRef.current.scores, [winner]: (stateRef.current.scores[winner] ?? 0) + 1 };
              const completedRound = stateRef.current.roundNumber;
              const isLastRound = completedRound >= 10;

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
            [player]: Math.max(0, (prev[player] ?? 10) - 1),
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
        const snapshotTrumpSuit = stateRef.current.trumpSuit;
        if (snapshotLeadSuit && snapshotTrumpSuit) {
          setHistory((prev) => {
            if (prev.some((r) => r.round === completedRound)) return prev;
            return [...prev, { round: completedRound, leadSuit: snapshotLeadSuit, trumpSuit: snapshotTrumpSuit, cards: snapshotCards, winner }];
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

  // Determine which cards are playable (for dimming)
  const getCardPlayable = (card: Card): boolean => {
    if (currentTurn !== username) return false;
    if (handCards[username]) return false;
    if (!leadSuit) return true;
    const hasLeadSuit = myCards.some((c) => c.suit === leadSuit);
    if (hasLeadSuit) return card.suit === leadSuit;
    return true;
  };

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

        {joined && phase === "lobby" && (
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

        {phase === "trump_selection" && !gameOver && (
          <>
            <Typography variant="subtitle2" color="text.secondary">
              First 5 cards dealt. Waiting for trump selection...
            </Typography>
            <MyHand
              myCards={myCards}
              currentTurn=""
              username={username}
              handCards={{}}
              onPlayCard={() => {}}
            />
            <TrumpSelector
              isChooser={username === trumpChooser}
              chooserName={trumpChooser}
              onSelectTrump={selectTrump}
            />
          </>
        )}

        {phase === "playing" && !gameOver && (
          <>
            <TurnBanner
              currentTurn={currentTurn}
              username={username}
              leadSuit={leadSuit}
              trumpSuit={trumpSuit}
            />

            {handResultMsg && (
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="subtitle1" color="success.main" fontWeight={600}>
                  {handResultMsg}
                </Typography>
              </Box>
            )}

            <RoundInfo
              roundNumber={roundNumber}
              scores={scores}
              username={username}
              trumpSuit={trumpSuit}
            />

            <Divider />

            {Object.keys(handCards).length > 0 && <HandTable handCards={handCards} />}

            <Divider />

            <MyHand
              myCards={myCards}
              currentTurn={currentTurn}
              username={username}
              handCards={handCards}
              onPlayCard={playCard}
              getCardPlayable={getCardPlayable}
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
