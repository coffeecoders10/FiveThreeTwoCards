import { Card, Suit } from "./cardTypes";

export const RANK_ORDER = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];

export function handWinner(handCards: Record<string, Card>, leadSuit: Suit): string {
  let bestPlayer = "";
  let bestCard: Card | null = null;

  for (const [player, card] of Object.entries(handCards)) {
    if (!bestCard) {
      bestPlayer = player;
      bestCard = card;
      continue;
    }
    const bestIsLead = bestCard.suit === leadSuit;
    const cardIsLead = card.suit === leadSuit;

    if (cardIsLead && !bestIsLead) {
      bestPlayer = player;
      bestCard = card;
    } else if (cardIsLead && bestIsLead) {
      if (RANK_ORDER.indexOf(card.rank) > RANK_ORDER.indexOf(bestCard.rank)) {
        bestPlayer = player;
        bestCard = card;
      }
    }
    // card is off-suit: can never beat best
  }

  return bestPlayer;
}
