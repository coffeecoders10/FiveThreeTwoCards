"use client";

import React from "react";
import { Box } from "@mui/material";
// @ts-expect-error — library declares React 16 peer dep but works with React 19
import PlayingCard from "@heruka_urgyen/react-playing-cards/lib/TcN";

// Change this to restyle all card backs at once.
// Use https://isotropic.co/tool/hex-color-to-css-filter/ to convert a hex color to a filter string.
const DEFAULT_BACK_FILTER = "sepia(1) saturate(4) hue-rotate(195deg) brightness(0.6)";

interface FaceDownCardProps {
  height?: string;
  /** CSS filter string to colorize the back. Defaults to navy blue. */
  color?: string;
}

const FaceDownCard: React.FC<FaceDownCardProps> = ({
  height = "100px",
  color = DEFAULT_BACK_FILTER,
}) => (
  <Box sx={{ display: "inline-block", filter: color }}>
    <PlayingCard card="2c" height={height} back />
  </Box>
);

export default FaceDownCard;
