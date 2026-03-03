export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export interface Card {
  suit: Suit;
  rank: string;
}

export interface HandRecord {
  round: number;
  leadSuit: Suit;
  trumpSuit: Suit;
  cards: Record<string, Card>;
  winner: string;
}

export type SocketData =
  | { type: "start_game"; hands: Record<string, Card[]>; leader: string; players: string[] }
  | { type: "deal_initial"; hands: Record<string, Card[]>; trumpChooser: string; players: string[] }
  | { type: "trump_selected"; suit: Suit; leader: string }
  | { type: "deal_final"; hands: Record<string, Card[]>; trumpSuit: Suit; leader: string }
  | { type: "play_card"; username: string; card: Card }
  | { type: "hand_result"; winner: string; roundNumber: number; scores: Record<string, number> }
  | { type: "game_over"; scores: Record<string, number> };
