export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export interface Card {
  suit: Suit;
  rank: string;
}

export interface HandRecord {
  round: number;
  leadSuit: Suit;
  cards: Record<string, Card>;
  winner: string;
}

export type SocketData =
  | { type: "start_game"; hands: Record<string, Card[]>; leader: string; players: string[] }
  | { type: "play_card"; username: string; card: Card }
  | { type: "hand_result"; winner: string; roundNumber: number; scores: Record<string, number> }
  | { type: "game_over"; scores: Record<string, number> };
