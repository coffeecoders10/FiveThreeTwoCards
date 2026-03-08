"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useSocket } from "@/lib/useSocket";
import { Suit, Card, HandRecord, SocketData } from "@/game/cardTypes";
import { Deck, create532Deck } from "@/game/deck";
import { handWinner } from "@/game/handLogic";
import JoinForm from "./game/JoinForm";
import Lobby from "./game/Lobby";
import TopHUD from "./game/TopHUD";
import GameTable from "./game/GameTable";
import MyHand from "./game/MyHand";
import PlayerSpot from "./game/PlayerSpot";
import HandHistory from "./game/HandHistory";
import GameOverScreen from "./game/GameOverScreen";
import TrumpSelector from "./game/TrumpSelector";
import DealingAnimation from "./game/DealingAnimation";
import FlyingCard from "./game/FlyingCard";

type GamePhase = "lobby" | "trump_selection" | "playing";

type PendingDeal = {
  type: "initial" | "final";
  myCards: Card[];
  otherCounts: Record<string, number>;
  leader?: string;
};

type FlyingCardEntry = {
  id: string;
  player: string;
  card: Card;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  tilt: number;
  isFaceUp: boolean;
};

const GameRoom: React.FC = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
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

  // Animation state
  const [dealingAnimation, setDealingAnimation] = useState<"initial" | "final" | null>(null);
  const [flyingCards, setFlyingCards] = useState<FlyingCardEntry[]>([]);
  const [flyingPlayers, setFlyingPlayers] = useState<Set<string>>(new Set());

  // DOM refs for animation position calculation
  const gameTableRef = useRef<HTMLDivElement>(null);
  const myHandRef = useRef<HTMLDivElement>(null);
  const centerPlayRef = useRef<HTMLDivElement>(null);

  // Pending deal buffer — holds cards until the dealing animation finishes
  const pendingDealRef = useRef<PendingDeal | null>(null);

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
    // Cards from initial deal — needed to combine with final deal
    pendingInitialCards: [] as Card[],
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
    if (dealingAnimation !== null) return; // block play during deal animation
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

  // Called when the dealing animation finishes — applies buffered state
  const handleDealComplete = () => {
    const pending = pendingDealRef.current;
    if (!pending) { setDealingAnimation(null); return; }

    setMyCards(pending.myCards);

    if (pending.type === "initial") {
      stateRef.current.pendingInitialCards = pending.myCards;
      setDealingAnimation(null);
      setPhase("trump_selection");
    } else {
      setOtherCardCounts(pending.otherCounts);
      // Only reset turn to leader if no card has been played yet (guards against race condition
      // where a play_card event arrives before this animation completes on a slower client)
      if (pending.leader && Object.keys(stateRef.current.handCards).length === 0) {
        setCurrentTurn(pending.leader);
      }
      setDealingAnimation(null);
      setPhase("playing");
    }

    pendingDealRef.current = null;
  };

  // Called when a flying card lands — removes it from state so CenterPlay renders it
  const handleFlyingCardComplete = (id: string, player: string) => {
    setFlyingCards((prev) => prev.filter((fc) => fc.id !== id));
    setFlyingPlayers((prev) => {
      const next = new Set(prev);
      next.delete(player);
      return next;
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
        // Buffer cards until dealing animation completes
        pendingDealRef.current = {
          type: "initial",
          myCards: sd.hands[me] ?? [],
          otherCounts: {},
        };
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
        // Trigger dealing animation — phase transition deferred to handleDealComplete
        setDealingAnimation("initial");
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
        const finalCards = sd.hands[me] ?? [];
        const allPlayers = stateRef.current.players;
        const initCounts: Record<string, number> = {};
        for (const p of allPlayers) {
          if (p !== me) initCounts[p] = 10;
        }
        setTrumpSuit(sd.trumpSuit);
        stateRef.current.trumpSuit = sd.trumpSuit;
        // Buffer cards until dealing animation completes
        pendingDealRef.current = {
          type: "final",
          myCards: [...stateRef.current.pendingInitialCards, ...finalCards],
          otherCounts: initCounts,
          leader: sd.leader,
        };
        // Trigger dealing animation — phase transition deferred to handleDealComplete
        setDealingAnimation("final");
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

        if (player !== me) {
          setOtherCardCounts((prev) => ({
            ...prev,
            [player]: Math.max(0, (prev[player] ?? 10) - 1),
          }));
        }

        // Trigger flying card animation
        if (gameTableRef.current) {
          const tableRect = gameTableRef.current.getBoundingClientRect();
          const tableSize = Math.min(tableRect.width, tableRect.height);
          const allPlayers = stateRef.current.players;
          const others = allPlayers.filter((p) => p !== me);
          const isSelf = player === me;

          let fromX: number, fromY: number;
          if (isSelf && myHandRef.current) {
            const handRect = myHandRef.current.getBoundingClientRect();
            fromX = handRect.left + handRect.width / 2 - 33;
            fromY = handRect.top + 8;
          } else if (others[0] === player) {
            fromX = tableRect.left + 0.07 * tableSize;
            fromY = tableRect.top + 0.09 * tableSize;
          } else {
            fromX = tableRect.right - 0.07 * tableSize - 66;
            fromY = tableRect.top + 0.09 * tableSize;
          }

          let toX: number, toY: number;
          if (centerPlayRef.current) {
            const cpRect = centerPlayRef.current.getBoundingClientRect();
            if (isSelf) {
              toX = cpRect.left + 0.50 * cpRect.width - 33;
              toY = cpRect.top + 0.75 * cpRect.height - 50;
            } else if (others[0] === player) {
              toX = cpRect.left + 0.20 * cpRect.width - 33;
              toY = cpRect.top + 0.15 * cpRect.height - 50;
            } else {
              toX = cpRect.left + 0.80 * cpRect.width - 33;
              toY = cpRect.top + 0.15 * cpRect.height - 50;
            }
          } else {
            toX = tableRect.left + tableRect.width / 2 - 33;
            toY = tableRect.top + tableRect.height / 2 - 50;
          }

          const id = `${player}-${Date.now()}`;
          const tilt = (Math.random() - 0.5) * 16;
          setFlyingPlayers((prev) => new Set([...prev, player]));
          setFlyingCards((prev) => [
            ...prev,
            { id, player, card, fromX, fromY, toX, toY, tilt, isFaceUp: isSelf },
          ]);
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

  // ── Render helpers ─────────────────────────────────────────────────────────

  // Animation overlays — rendered on top of whatever phase screen is showing
  const animationOverlays = (
    <>
      {dealingAnimation && players.length > 0 && (() => {
        // Compute rects now (at render time, using window dimensions as fallback)
        const tableRect = gameTableRef.current?.getBoundingClientRect() ?? {
          left: window.innerWidth * 0.1,
          right: window.innerWidth * 0.9,
          top: window.innerHeight * 0.1,
          bottom: window.innerHeight * 0.75,
          width: window.innerWidth * 0.8,
          height: window.innerHeight * 0.65,
        } as DOMRect;
        const myHandRect = myHandRef.current?.getBoundingClientRect() ?? {
          left: 0,
          top: window.innerHeight * 0.8,
          width: window.innerWidth,
          height: window.innerHeight * 0.15,
        } as DOMRect;
        return (
          <DealingAnimation
            players={players}
            username={username}
            cardCount={5}
            tableRect={tableRect}
            myHandRect={myHandRect}
            onComplete={handleDealComplete}
          />
        );
      })()}
      {flyingCards.map((fc) => (
        <FlyingCard
          key={fc.id}
          card={fc.card}
          isFaceUp={fc.isFaceUp}
          fromX={fc.fromX}
          fromY={fc.fromY}
          toX={fc.toX}
          toY={fc.toY}
          tilt={fc.tilt}
          onComplete={() => handleFlyingCardComplete(fc.id, fc.player)}
        />
      ))}
    </>
  );

  // ── Pre-game screens ──────────────────────────────────────────────────────
  if (!joined) {
    return (
      <>
        <Box
          sx={{
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            gap: 4,
            px: 2,
          }}
        >
          {/* Hero section */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
            <Image
              src="/coffeecoders_logo.png"
              alt="Coffee Coders"
              width={72}
              height={72}
              style={{ objectFit: "contain" }}
            />
            <Typography variant="h3" fontWeight={800} color="primary.main" lineHeight={1}>
              532 Cards
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A card game for 3 players
            </Typography>
          </Box>

          {/* Input card */}
          <Box
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: "background.paper",
              boxShadow: 6,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <JoinForm
              username={username}
              room={room}
              onUsernameChange={setUsername}
              onRoomChange={setRoom}
              onJoin={joinRoom}
            />
          </Box>
        </Box>
        {animationOverlays}
      </>
    );
  }

  if (joined && phase === "lobby") {
    return (
      <>
        <Box
          sx={{
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            px: 2,
          }}
        >
          <Box
            sx={{
              p: 4,
              borderRadius: 3,
              bgcolor: "background.paper",
              boxShadow: 6,
              width: "100%",
              maxWidth: 440,
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom>
              532 Cards
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
              Room: {room}
            </Typography>
            <Lobby
              roomUsers={roomUsers}
              username={username}
              isHost={isHost}
              onStartGame={startGame}
            />
          </Box>
        </Box>
        {animationOverlays}
      </>
    );
  }

  if (gameOver) {
    return (
      <>
        <Box
          sx={{
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            p: 2,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 600 }}>
            <GameOverScreen
              finalScores={finalScores}
              history={history}
              historyOpen={historyOpen}
              onToggle={() => setHistoryOpen((o) => !o)}
            />
          </Box>
        </Box>
        {animationOverlays}
      </>
    );
  }

  // ── Trump selection ────────────────────────────────────────────────────────
  if (phase === "trump_selection") {
    return (
      <>
        <Box
          sx={{
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            gap: 3,
            p: 3,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            First 5 cards dealt — pick the trump suit
          </Typography>
          <Box ref={myHandRef} sx={{ width: "100%", alignSelf: "stretch" }}>
            <MyHand
              myCards={myCards}
              currentTurn=""
              username={username}
              handCards={{}}
              onPlayCard={() => {}}
            />
          </Box>
          <TrumpSelector
            isChooser={username === trumpChooser}
            chooserName={trumpChooser}
            onSelectTrump={selectTrump}
          />
        </Box>
        {animationOverlays}
      </>
    );
  }

  // ── Playing phase ──────────────────────────────────────────────────────────
  return (
    <>
      <Box
        sx={{
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "background.default",
        }}
      >
        {/* Top info bar */}
        <TopHUD
          roundNumber={roundNumber}
          trumpSuit={trumpSuit}
          currentTurn={currentTurn}
          username={username}
        />

        {/* Row: game column + optional desktop history column */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            width: "100%",
          }}
        >
          {/* Game column — table + dock + mobile history */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              overflow: "hidden",
            }}
          >
            {/* Table — natural size, does not flex-grow */}
            <Box
              sx={{
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <GameTable
                ref={gameTableRef}
                centerPlayRef={centerPlayRef}
                players={players}
                username={username}
                otherCardCounts={otherCardCounts}
                scores={scores}
                currentTurn={currentTurn}
                handCards={handCards}
                handResultMsg={handResultMsg}
                flyingPlayers={flyingPlayers}
              />
            </Box>

            {/* Stacked dock: avatar row above card fan — flexShrink:0, sits directly below table */}
            <Box sx={{ flexShrink: 0, width: "100%", pt: 1 }}>
              {/* Avatar row — centered */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  pb: 0.5,
                }}
              >
                <PlayerSpot
                  isSelf
                  horizontal
                  username={username}
                  cardCount={0}
                  score={scores[username] ?? 0}
                  isCurrentTurn={currentTurn === username}
                />
              </Box>

              {/* Card fan — full width */}
              <Box ref={myHandRef} sx={{ width: "100%" }}>
                <MyHand
                  myCards={myCards}
                  currentTurn={currentTurn}
                  username={username}
                  handCards={handCards}
                  onPlayCard={playCard}
                  getCardPlayable={getCardPlayable}
                  hidden={dealingAnimation === "final"}
                />
              </Box>
            </Box>

            {/* Mobile: collapsible below hand fan */}
            {history.length > 0 && !isDesktop && (
              <Box sx={{ flexShrink: 0, width: "100%", px: 2, pt: 1 }}>
                <HandHistory
                  history={history}
                  historyOpen={historyOpen}
                  onToggle={() => setHistoryOpen((o) => !o)}
                />
              </Box>
            )}
          </Box>

          {/* Desktop: history column — natural sibling, no z-index needed */}
          {history.length > 0 && isDesktop && (
            <Box
              sx={{
                width: 320,
                flexShrink: 0,
                overflowY: "auto",
                borderLeft: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                p: 2,
              }}
            >
              <HandHistory
                history={history}
                historyOpen={historyOpen}
                onToggle={() => setHistoryOpen((o) => !o)}
              />
            </Box>
          )}
        </Box>
      </Box>
      {animationOverlays}
    </>
  );
};

export default GameRoom;
