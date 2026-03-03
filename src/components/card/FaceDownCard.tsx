"use client";

import React from "react";
import { Box } from "@mui/material";

const FaceDownCard: React.FC = () => (
  <Box
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
      boxShadow: 3,
    }}
  />
);

export default FaceDownCard;
