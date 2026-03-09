"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/game/cardTypes";
import FaceUpCard from "@/components/card/FaceUpCard";
import FaceDownCard from "@/components/card/FaceDownCard";

interface FlyingCardProps {
  card: Card;
  isFaceUp: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  tilt?: number;
  onComplete: () => void;
}

const FlyingCard: React.FC<FlyingCardProps> = ({
  card,
  isFaceUp,
  fromX,
  fromY,
  toX,
  toY,
  tilt = 0,
  onComplete,
}) => (
  <motion.div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      pointerEvents: "none",
      zIndex: 9998,
      originX: "50%",
      originY: "50%",
    }}
    initial={{ x: fromX, y: fromY, scale: 0.9, rotate: 0, opacity: 1 }}
    animate={{ x: toX, y: toY, scale: 1, rotate: tilt, opacity: 1 }}
    transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
    onAnimationComplete={onComplete}
  >
    {isFaceUp ? <FaceUpCard card={card} /> : <FaceDownCard />}
  </motion.div>
);

export default FlyingCard;
