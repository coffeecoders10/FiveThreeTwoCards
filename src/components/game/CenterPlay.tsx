"use client";

import React, { forwardRef } from "react";
import { Box, Typography } from "@mui/material";
import { Card } from "@/game/cardTypes";
import FaceUpCard from "@/components/card/FaceUpCard";

interface CenterPlayProps {
  handCards: Record<string, Card>;
  players: string[];
  username: string;
  handResultMsg?: string;
  flyingPlayers?: Set<string>;
}

const MAX_LABEL = 8;

const CenterPlay = forwardRef<HTMLDivElement, CenterPlayProps>(
  ({ handCards, players, username, handResultMsg, flyingPlayers }, ref) => {
    const others = players.filter((p) => p !== username);
    const p2 = others[0]; // top-left seat
    const p3 = others[1]; // top-right seat

    // [left%, top%] relative to this container — card center anchors
    const positions: Record<string, { left: string; top: string }> = {
      [username]: { left: "50%", top: "75%" }, // P1 — bottom-center
      ...(p2 ? { [p2]: { left: "20%", top: "15%" } } : {}), // P2 — top-left
      ...(p3 ? { [p3]: { left: "80%", top: "15%" } } : {}), // P3 — top-right
    };

    const hasCards = Object.keys(handCards).length > 0;

    return (
      <Box ref={ref} sx={{ position: "relative", width: 165, height: 150 }}>
        {hasCards &&
          Object.entries(handCards).map(([player, card]) => {
            const pos = positions[player];
            if (!pos) return null;
            // Skip rendering while the card is flying in from this player
            if (flyingPlayers?.has(player)) return null;
            const label = player.length > MAX_LABEL ? player.slice(0, MAX_LABEL) + "…" : player;
            return (
              <Box
                key={player}
                sx={{
                  position: "absolute",
                  left: pos.left,
                  top: pos.top,
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.4,
                }}
              >
                <FaceUpCard card={card} height="75px" />
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem" }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}

        {/* Hand result message overlay */}
        {handResultMsg && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                color: "success.main",
                bgcolor: "rgba(0,0,0,0.65)",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                textAlign: "center",
                fontSize: "0.8rem",
              }}
            >
              {handResultMsg}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }
);

CenterPlay.displayName = "CenterPlay";

export default CenterPlay;
