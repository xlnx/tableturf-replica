interface IDeckData {
  name: string;
  deck: number[];
}

interface IRootData {
  playerName: string;
  decks: IDeckData[];
  currDeck: number;
}
