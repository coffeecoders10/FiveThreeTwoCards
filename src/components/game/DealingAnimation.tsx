"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import FaceDownCard from "@/components/card/FaceDownCard";

interface DealingAnimationProps {
  /** Ordered player list: [self, p2, p3] */
  players: string[];
  username: string;
  /** Number of cards dealt to each player (typically 5) */
  cardCount: number;
  tableRect: DOMRect;
  myHandRect: DOMRect;
  onComplete: () => void;
}

const DealingAnimation: React.FC<DealingAnimationProps> = ({
  players,
  username,
  cardCount,
  tableRect,
  myHandRect,
  onComplete,
}) => {
  const tableSize = Math.min(tableRect.width, tableRect.height);
  const deckX = tableRect.left + tableRect.width / 2 - 33; // card half-width offset
  const deckY = tableRect.top + tableRect.height / 2 - 50; // card half-height offset

  // Compute destinations for each player (viewport-absolute, top-left of card)
  const destinations = useMemo(() => {
    const others = players.filter((p) => p !== username);
    const p2 = others[0];
    const p3 = others[1];
    const map: Record<string, { x: number; y: number }> = {};
    // Self → MyHand center
    map[username] = {
      x: myHandRect.left + myHandRect.width / 2 - 33,
      y: myHandRect.top + 8,
    };
    if (p2) {
      map[p2] = {
        x: tableRect.left + 0.05 * tableSize,
        y: tableRect.top + 0.08 * tableSize,
      };
    }
    if (p3) {
      map[p3] = {
        x: tableRect.right - 0.05 * tableSize - 66,
        y: tableRect.top + 0.08 * tableSize,
      };
    }
    return map;
  }, [players, username, tableRect, myHandRect, tableSize]);

  // Build deal order: round-robin P1, P2, P3 × cardCount
  const dealSequence = useMemo(() => {
    const seq: string[] = [];
    for (let round = 0; round < cardCount; round++) {
      for (const player of players) {
        seq.push(player);
      }
    }
    return seq;
  }, [players, cardCount]);

  const total = dealSequence.length;
  const lastIdx = total - 1;

  return (
    // Full-screen pointer-events-none overlay
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {/* Deck visual at table center */}
      <div
        style={{
          position: "fixed",
          left: deckX,
          top: deckY,
          zIndex: 10000,
        }}
      >
        {[4, 3, 2, 1, 0].map((offset) => (
          <div
            key={offset}
            style={{
              position: "absolute",
              top: -offset * 1.5,
              left: offset * 0.5,
            }}
          >
            <FaceDownCard height="100px" />
          </div>
        ))}
      </div>

      {/* Flying cards */}
      {dealSequence.map((player, idx) => {
        const dest = destinations[player];
        if (!dest) return null;
        const delay = idx * 0.12;
        const isLast = idx === lastIdx;

        return (
          <motion.div
            key={idx}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 9999,
              originX: "50%",
              originY: "50%",
            }}
            initial={{ x: deckX, y: deckY, scale: 0.85, opacity: 0 }}
            animate={{ x: dest.x, y: dest.y, scale: 1, opacity: [0, 1, 1, 0.8] }}
            transition={{
              delay,
              duration: 0.45,
              type: "spring",
              bounce: 0.05,
            }}
            onAnimationComplete={isLast ? onComplete : undefined}
          >
            <FaceDownCard height="100px" />
          </motion.div>
        );
      })}
    </div>
  );
};

export default DealingAnimation;
