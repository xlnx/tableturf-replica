import { getCardById } from "./core/Tableturf";

export function isDeckValid(deck: number[]) {
  // card count
  if (deck.length != 15) {
    return false;
  }
  // not unique
  if (new Set(deck).size != deck.length) {
    return false;
  }
  // all cards valid
  return deck.map(getCardById).every((_) => _);
}

export function calibrateDeck(deck: number[]) {
  // card count
  if (deck.length > 15) {
    deck = deck.slice(0, 15);
  }
  // not unique
  deck = Array.from(new Set(deck));
  // all cards valid
  return deck.filter(getCardById);
}

export function getDeckTotalArea(deck: number[]) {
  return deck
    .map((card) => getCardById(card).count.area)
    .reduce((a, b) => a + b, 0);
}

export function getNameError(name: string): string {
  if (name == "") {
    return "empty name is not allowed";
  }
  if (name.trim() != name) {
    return "leading/trailing space is not allowed";
  }
  return "";
}
