"use client";

import React, { forwardRef, RefObject } from "react";
import { Box } from "@mui/material";
import { Card } from "@/game/cardTypes";
import PlayerSpot from "./PlayerSpot";
import CenterPlay from "./CenterPlay";

interface GameTableProps {
  players: string[];
  username: string;
  otherCardCounts: Record<string, number>;
  scores: Record<string, number>;
  currentTurn: string;
  handCards: Record<string, Card>;
  handResultMsg?: string;
  flyingPlayers?: Set<string>;
  centerPlayRef?: RefObject<HTMLDivElement | null>;
}

const GameTable = forwardRef<HTMLDivElement, GameTableProps>(
  (
    {
      players,
      username,
      otherCardCounts,
      scores,
      currentTurn,
      handCards,
      handResultMsg,
      flyingPlayers,
      centerPlayRef,
    },
    ref
  ) => {
    const others = players.filter((p) => p !== username);
    const p2 = others[0];
    const p3 = others[1];

    return (
      <Box
        ref={ref}
        sx={{
          position: "relative",
          width: "min(calc(100vw - 32px), calc(100vh - 280px), 900px)",
          aspectRatio: "1",
          mx: "auto",
        }}
      >
        {/* SVG filter definition — felt noise texture */}
        <svg
          aria-hidden="true"
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        >
          <defs>
            <filter id="felt-texture" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                stitchTiles="stitch"
                result="noise"
              />
              <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
              <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" />
            </filter>
          </defs>
        </svg>

        {/* Circular table — green felt base */}
        <Box
          sx={{
            position: "absolute",
            top: "12%",
            left: "12%",
            width: "76%",
            height: "76%",
            borderRadius: "50%",
            border: "8px solid #2d6a4f",
            bgcolor: "#1a4a2e",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7), inset 0 0 30px rgba(0,0,0,0.3)",
          }}
        />

        {/* Felt texture overlay */}
        <Box
          sx={{
            position: "absolute",
            top: "12%",
            left: "12%",
            width: "76%",
            height: "76%",
            borderRadius: "50%",
            bgcolor: "#ffffff",
            filter: "url(#felt-texture)",
            mixBlendMode: "multiply",
            opacity: 0.35,
            pointerEvents: "none",
          }}
        />

        {/* Radial vignette overlay */}
        <Box
          sx={{
            position: "absolute",
            top: "12%",
            left: "12%",
            width: "76%",
            height: "76%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* P2 — top-left */}
        {p2 && (
          <Box
            sx={{
              position: "absolute",
              top: "6%",
              left: "4%",
              zIndex: 10,
            }}
          >
            <PlayerSpot
              username={p2}
              cardCount={otherCardCounts[p2] ?? 0}
              score={scores[p2] ?? 0}
              isCurrentTurn={currentTurn === p2}
              compact
            />
          </Box>
        )}

        {/* P3 — top-right */}
        {p3 && (
          <Box
            sx={{
              position: "absolute",
              top: "6%",
              right: "4%",
              zIndex: 10,
            }}
          >
            <PlayerSpot
              username={p3}
              cardCount={otherCardCounts[p3] ?? 0}
              score={scores[p3] ?? 0}
              isCurrentTurn={currentTurn === p3}
              compact
            />
          </Box>
        )}

        {/* Center — played cards in triangular spread */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -48%)",
            zIndex: 10,
          }}
        >
          <CenterPlay
            ref={centerPlayRef}
            handCards={handCards}
            players={players}
            username={username}
            handResultMsg={handResultMsg}
            flyingPlayers={flyingPlayers}
          />
        </Box>
      </Box>
    );
  }
);

GameTable.displayName = "GameTable";

export default GameTable;
