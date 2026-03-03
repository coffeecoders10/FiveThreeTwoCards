import { Card, Suit } from "./cardTypes";

export const RANK_ORDER = ["7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];

export function handWinner(handCards: Record<string, Card>, leadSuit: Suit, trumpSuit: Suit): string {
  let bestPlayer = "";
  let bestCard: Card | null = null;

  for (const [player, card] of Object.entries(handCards)) {
    if (!bestCard) {
      bestPlayer = player;
      bestCard = card;
      continue;
    }

    const bestIsTrump = bestCard.suit === trumpSuit;
    const cardIsTrump = card.suit === trumpSuit;
    const bestIsLead = bestCard.suit === leadSuit;
    const cardIsLead = card.suit === leadSuit;

    if (cardIsTrump && !bestIsTrump) {
      // Trump beats anything that isn't trump
      bestPlayer = player;
      bestCard = card;
    } else if (cardIsTrump && bestIsTrump) {
      // Both trump: higher rank wins
      if (RANK_ORDER.indexOf(card.rank) > RANK_ORDER.indexOf(bestCard.rank)) {
        bestPlayer = player;
        bestCard = card;
      }
    } else if (!cardIsTrump && !bestIsTrump) {
      // Neither is trump: lead suit beats off-suit
      if (cardIsLead && !bestIsLead) {
        bestPlayer = player;
        bestCard = card;
      } else if (cardIsLead && bestIsLead) {
        if (RANK_ORDER.indexOf(card.rank) > RANK_ORDER.indexOf(bestCard.rank)) {
          bestPlayer = player;
          bestCard = card;
        }
      }
      // card is off-suit and non-trump: can never beat best
    }
    // card is not trump, best is trump: card can never beat best
  }

  return bestPlayer;
}
