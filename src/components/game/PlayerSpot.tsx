"use client";

import React from "react";
import { Badge, Box, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

interface PlayerSpotProps {
  username: string;
  cardCount: number;
  score: number;
  isCurrentTurn: boolean;
  /** When true, renders the "You" variant (no card fan, different icon color) */
  isSelf?: boolean;
}

const MAX_NAME_LEN = 10;

const PlayerSpot: React.FC<PlayerSpotProps> = ({
  username,
  cardCount,
  score,
  isCurrentTurn,
  isSelf = false,
}) => {
  const displayName =
    username.length > MAX_NAME_LEN ? username.slice(0, MAX_NAME_LEN) + "…" : username;

  const fanCount = isSelf ? 0 : Math.min(cardCount, 5);
  const mid = (fanCount - 1) / 2;
  const angles = Array.from({ length: fanCount }, (_, i) => (i - mid) * 10);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      {/* Avatar with score badge */}
      <Badge
        badgeContent={score}
        showZero
        color="primary"
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: "#2a2a3a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isCurrentTurn
              ? "0 0 0 3px #a07666, 0 0 14px rgba(160,118,102,0.55)"
              : "none",
            transition: "box-shadow 0.3s ease",
          }}
        >
          <PersonIcon
            sx={{
              fontSize: 30,
              color: isSelf ? "primary.main" : "text.secondary",
            }}
          />
        </Box>
      </Badge>

      {/* Username */}
      <Typography
        variant="caption"
        sx={{
          color: isCurrentTurn ? "primary.main" : "text.secondary",
          fontWeight: isCurrentTurn ? 700 : 400,
          maxWidth: 80,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {displayName}
        {isSelf && (
          <Box component="span" sx={{ color: "text.disabled", ml: 0.5 }}>
            (you)
          </Box>
        )}
      </Typography>

      {/* Face-down card fan */}
      {fanCount > 0 && (
        <Box sx={{ position: "relative", width: 60, height: 52, mt: 0.5 }}>
          {angles.map((angle, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: 34,
                height: 48,
                ml: "-17px",
                borderRadius: "4px",
                bgcolor: "#3a4a6b",
                backgroundImage:
                  "repeating-linear-gradient(45deg, #2e3d5c 0px, #2e3d5c 2px, transparent 2px, transparent 8px)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                transformOrigin: "bottom center",
                transform: `rotate(${angle}deg)`,
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PlayerSpot;
