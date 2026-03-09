"use client";

import React from "react";
import { Badge, Box, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import FaceDownCard from "@/components/card/FaceDownCard";

interface PlayerSpotProps {
  username: string;
  cardCount: number;
  score: number;
  isCurrentTurn: boolean;
  /** When true, renders the "You" variant (no card fan, different icon color) */
  isSelf?: boolean;
  /** When true (only applies to isSelf), renders avatar + name inline horizontally */
  horizontal?: boolean;
  /** When true, renders a smaller avatar and card fan — for opponent spots inside the table */
  compact?: boolean;
}

const MAX_NAME_LEN = 10;

const PlayerSpot: React.FC<PlayerSpotProps> = ({
  username,
  cardCount,
  score,
  isCurrentTurn,
  isSelf = false,
  horizontal = false,
  compact = false,
}) => {
  const displayName =
    username.length > MAX_NAME_LEN ? username.slice(0, MAX_NAME_LEN) + "…" : username;

  const fanCount = isSelf ? 0 : Math.min(cardCount, 5);
  const mid = (fanCount - 1) / 2;
  const angles = Array.from({ length: fanCount }, (_, i) => (i - mid) * 10);

  if (isSelf && horizontal) {
    return (
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
        <Badge
          badgeContent={score}
          showZero
          color="primary"
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
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
            <PersonIcon sx={{ fontSize: 24, color: "primary.main" }} />
          </Box>
        </Badge>
        <Typography
          variant="caption"
          sx={{
            color: isCurrentTurn ? "primary.main" : "text.secondary",
            fontWeight: isCurrentTurn ? 700 : 400,
            maxWidth: 100,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}
        >
          {displayName}
        </Typography>
      </Box>
    );
  }

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
            width: compact ? 40 : 52,
            height: compact ? 40 : 52,
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
              fontSize: compact ? 22 : 30,
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
        <Box sx={{ position: "relative", width: compact ? 48 : 60, height: compact ? 36 : 52, mt: 0.5 }}>
          {angles.map((angle, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                top: 0,
                left: "50%",
                ml: compact ? "-13px" : "-17px",
                transformOrigin: "bottom center",
                transform: `rotate(${angle}deg)`,
              }}
            >
              <FaceDownCard height={compact ? "32px" : "48px"} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PlayerSpot;
