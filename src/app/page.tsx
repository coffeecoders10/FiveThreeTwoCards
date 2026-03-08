"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import dynamic from "next/dynamic";
import { darkTheme } from "./theme";

const GameRoom = dynamic(() => import("@/components/GameRoom"), { ssr: false });

export default function CC532CardGameHome() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GameRoom />
    </ThemeProvider>
  );
}
