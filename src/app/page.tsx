"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Image from "next/image";
import { darkTheme } from "./theme";
import DeckGame from "@/components/DeckGame";
import RoomChat from "@/components/ChatRoom";

export default function CC532CardGameHome() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          backgroundColor: "background.default",
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            position: "absolute",
            top: 24,
            left: 24,
            cursor: "pointer",
          }}
        >
          <a href="http://coffeecoders.pythonanywhere.com/">
            <Image
              src="/coffeecoders_logo.png"
              alt="Coffee Coders Logo"
              width={60}
              height={60}
              style={{ objectFit: "contain" }}
            />
          </a>
        </Box>

        {/* Centered Content */}
        <Container maxWidth="sm">
          <Box textAlign="center">
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "primary.main",
              }}
            >
              TITLE
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: "text.secondary",
              }}
            >
              SUBTITLE
            </Typography>

            <DeckGame />

            <RoomChat />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
