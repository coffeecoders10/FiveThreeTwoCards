import { Card, Suit } from "./cardTypes";

export class Deck {
  private _cards: Card[] = [];

  constructor(cards?: Card[]) {
    if (cards) {
      this._cards = [...cards];
    }
  }

  public shuffle() {
    for (let i = this._cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
    }
  }

  public draw(count: number = 1): Card[] {
    return this._cards.splice(0, count);
  }
}

export const createFullDeck = (): Card[] => {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];
  const deck: Card[] = [];
  suits.forEach((suit) => ranks.forEach((rank) => deck.push({ suit, rank })));
  return deck;
};
