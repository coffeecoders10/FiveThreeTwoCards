"use client";

import React, { useState } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    Stack,
    Divider
} from "@mui/material";

// --------------------
// Card Type
// --------------------
type Suit = "hearts" | "diamonds" | "clubs" | "spades";

interface Card {
    suit: Suit;
    rank: string;
}

// --------------------
// Deck Class
// --------------------
class Deck {
    private _cards: Card[] = [];

    constructor(cards?: Card[]) {
        if (cards) {
            this._cards = [...cards];
        }
    }

    public cards(cards: Card[]) {
        this._cards = [...cards];
    }

    public shuffle() {
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [
                this._cards[j],
                this._cards[i],
            ];
        }
    }

    public draw(count: number = 1): Card | Card[] | undefined {
        if (count === 1) {
            return this._cards.shift();
        }
        return this._cards.splice(0, count);
    }

    public remaining(): number {
        return this._cards.length;
    }
}

// --------------------
// Utility: Create 52-card deck
// --------------------
const createFullDeck = (): Card[] => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks = [
        "Ace",
        "2", "3", "4", "5", "6", "7", "8", "9", "10",
        "Jack",
        "Queen",
        "King"
    ];

    const deck: Card[] = [];

    suits.forEach((suit) => {
        ranks.forEach((rank) => {
            deck.push({ suit, rank });
        });
    });

    return deck;
};

// --------------------
// MUI Component
// --------------------
const DeckGame: React.FC = () => {
    const [deck] = useState<Deck>(() => {
        const newDeck = new Deck(createFullDeck());
        newDeck.shuffle();
        return newDeck;
    });

    const [drawnCard, setDrawnCard] = useState<Card | null>(null);
    const [drawnCards, setDrawnCards] = useState<Card[]>([]);
    const [remaining, setRemaining] = useState<number>(
        deck.remaining()
    );

    const handleShuffle = () => {
        deck.shuffle();
        setDrawnCard(null);
        setDrawnCards([]); // Clear history
        setRemaining(deck.remaining());
    };

    const handleDraw = () => {
        const card = deck.draw() as Card | undefined;

        if (card) {
            setDrawnCard(card);
            setDrawnCards((prev) => [...prev, card]); // Add to list
            setRemaining(deck.remaining());
        }
    };

    return (
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
            <Stack spacing={3} alignItems="center">
                <Typography variant="h4">
                    52 Card Deck
                </Typography>

                <Typography variant="body1">
                    Remaining Cards: {remaining}
                </Typography>

                {drawnCard && (
                    <Box
                        sx={{
                            p: 2,
                            border: "1px solid #ccc",
                            borderRadius: 2,
                            minWidth: 200,
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h6">
                            {drawnCard.rank} of {drawnCard.suit}
                        </Typography>
                    </Box>
                )}

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleShuffle}
                    >
                        Shuffle
                    </Button>

                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleDraw}
                        disabled={remaining === 0}
                    >
                        Draw Card
                    </Button>
                </Stack>

                <Divider sx={{ width: "100%", mt: 3 }} />

                {/* Drawn Cards List */}
                <Box sx={{ width: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                        Drawn Cards
                    </Typography>

                    {drawnCards.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No cards drawn yet.
                        </Typography>
                    ) : (
                        <Stack spacing={1}>
                            {drawnCards.map((card, index) => (
                                <Box
                                    key={`${card.rank}-${card.suit}-${index}`}
                                    sx={{
                                        p: 1,
                                        border: "1px solid #ddd",
                                        borderRadius: 1
                                    }}
                                >
                                    {card.rank} of {card.suit}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
};

export default DeckGame;
