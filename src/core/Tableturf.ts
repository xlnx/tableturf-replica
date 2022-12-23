import { MatrixUtil } from "./Utils";
import MiniGameBoardInfo from "./data/MiniGameStageInfo";
import MiniGameCardInfo from "./data/MiniGameCardInfo.json";

const EIGHT_NEIGHBOURS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
];

export const Spaces = {
  EMPTY: 0,
  TRIVIAL: 1,
  SPECIAL: 2,
  NEUTRAL: 3,
  INVALID: 99,
};

export interface Rect {
  size: number[];
  values: number[];
}

export interface BoardState extends Rect {
  count: {
    area: number[];
    special: number[];
  };
}

export interface Stage {
  id: number;
  name: string;
  board: Rect;
  count: {
    area: number;
  };
}

export interface Card extends Rect {
  id: number;
  name: string;
  rarity: "Common" | "Rare" | "Fresh";
  count: {
    area: number;
    special: number;
  };
  render: {
    bg: string;
  };
}

export interface PlayerState {
  deck: number[];
  hand: number[];
  count: {
    area: number;
    special: number;
  };
}

export interface GameState {
  round: number;
  board: BoardState;
  players: PlayerState[];
  prevMoves: CardPlacement[][];
}

export interface CardPlacement {
  player: PlayerId;
  card: number;
  rotation: Rotation;
  position: Coordinate;
}

export interface PlayerMovement {
  player: PlayerId;
  action: "discard" | "trivial" | "special";
  hand: number;
  params?: {
    rotation: Rotation;
    position: Coordinate;
  };
}

/* turn apis */
export function player2Turn(player: PlayerId): Turn {
  return player == 0 ? 1 : -1;
}

/* rect apis */
export function contains(rect: Rect, pos: Coordinate): boolean {
  const [w, h] = rect.size;
  const { x, y } = pos;
  return 0 <= x && x < w && 0 <= y && y < h;
}

export function getValue(rect: Rect, pos: Coordinate): number {
  const {
    size: [w],
    values,
  } = rect;
  const { x, y } = pos;
  console.assert(contains(rect, pos));
  return values[x + y * w];
}

export function setValue(rect: Rect, pos: Coordinate, value: number) {
  const {
    size: [w],
    values,
  } = rect;
  const { x, y } = pos;
  console.assert(contains(rect, pos));
  values[x + y * w] = value;
}

function forEach(rect: Rect, callback: (pos: Coordinate, val: number) => void) {
  const {
    size: [w, h],
    values,
  } = rect;
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      callback({ x, y }, values[x + y * w]);
    }
  }
}

export function forEachNonEmpty(
  rect: Rect,
  callback: (pos: Coordinate, val: number) => void
) {
  forEach(rect, (pos, v) => {
    if (v != Spaces.EMPTY && v != Spaces.INVALID) {
      callback(pos, v);
    }
  });
}

/* board apis */
export function isInBoard(board: Rect, pos: Coordinate): boolean {
  return contains(board, pos) && getValue(board, pos) != Spaces.INVALID;
}

export function getBoardState(rect: Rect): BoardState {
  const [w, h] = rect.size;
  const special = [0, 0];
  const area = [0, 0];
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      const v = getValue(rect, { x, y });
      const absv = Math.abs(v);
      const player = v > 0 ? 0 : 1;
      if (absv == Spaces.TRIVIAL || absv == Spaces.SPECIAL) {
        area[player] += 1;
      }
      if (absv == Spaces.SPECIAL) {
        if (isBoardPosCharged(rect, { x, y })) {
          special[player] += 1;
        }
      }
    }
  }
  return {
    ...rect,
    count: { area, special },
  };
}

export function isBoardPosCharged(board: Rect, pos: Coordinate): boolean {
  const v = getValue(board, pos);
  if (Math.abs(v) != Spaces.SPECIAL) {
    return false;
  }
  for (let [dx, dy] of EIGHT_NEIGHBOURS) {
    const p1 = { x: pos.x + dx, y: pos.y + dy };
    if (isInBoard(board, p1)) {
      const v1 = getValue(board, p1);
      if (Math.abs(v1) == Spaces.EMPTY) {
        return false;
      }
    }
  }
  return true;
}

export function moveBoard(board: Rect, moves: CardPlacement[]): BoardState {
  console.assert(moves.length <= 2);
  if (moves.length == 2) {
    console.assert(moves[0].player != moves[1].player);
  }

  const li = new Set();
  board = { ...board, values: board.values.slice() };
  moves.forEach(({ card, rotation, position, player }) => {
    const rect = rotateCard(getCardById(card), rotation);
    forEachNonEmpty(rect, ({ x, y }, v) => {
      const pos = { x: x + position.x, y: y + position.y };
      if (!isInBoard(board, pos)) {
        return;
      }
      const key = pos.x.toString() + ":" + pos.y.toString();
      const v0 = Math.abs(getValue(board, pos));
      let v1 = player2Turn(player) * v;
      if (li.has(key)) {
        if (v == v0) {
          v1 = Spaces.NEUTRAL;
        }
      } else {
        li.add(key);
      }
      if (v >= v0) {
        setValue(board, pos, v1);
      }
    });
  });

  return getBoardState(board);
}

export function isBoardMoveValid(
  board: Rect,
  move: CardPlacement,
  special: boolean
): boolean {
  let ok = true;
  let neighbour = false;

  const rect = rotateCard(getCardById(move.card), move.rotation);
  forEachNonEmpty(rect, ({ x, y }, v) => {
    if (!ok) {
      return;
    }
    const pos = { x: x + move.position.x, y: y + move.position.y };
    if (!isInBoard(board, pos)) {
      ok = false;
      return;
    }
    if (!special) {
      ok = getValue(board, pos) == Spaces.EMPTY;
    } else {
      ok = Math.abs(getValue(board, pos)) <= Spaces.TRIVIAL;
    }
    if (ok && !neighbour) {
      for (let [dx, dy] of EIGHT_NEIGHBOURS) {
        const pos1 = { x: pos.x + dx, y: pos.y + dy };
        if (isInBoard(board, pos1)) {
          const v = getValue(board, pos1) * player2Turn(move.player);
          if (v == Spaces.SPECIAL || (!special && v == Spaces.TRIVIAL)) {
            neighbour = true;
            break;
          }
        }
      }
    }
  });

  return ok && neighbour;
}

/* card apis */
const CARD_ID_LOOKUP: Card[] = [];

for (let info of MiniGameCardInfo) {
  const id = info["Number"];
  const name = info["Name"];
  const values = [];
  for (let y = 0; y < 8; ++y) {
    for (let x = 0; x < 8; ++x) {
      const v0 = info["Square"][x + (7 - y) * 8];
      let v = Spaces.EMPTY;
      if (v0 == "Fill") {
        v = Spaces.TRIVIAL;
      } else if (v0 == "Special") {
        v = Spaces.SPECIAL;
      }
      values.push(v);
    }
  }
  const rect: Rect = {
    size: [8, 8],
    values,
  };
  const card: Card = {
    ...rect,
    id,
    name,
    rarity: <any>info["Rarity"],
    count: {
      area: values.filter((x) => x > 0).length,
      special: info["SpecialCost"],
    },
    render: {
      bg: `cards/${name}.webp`,
    },
  };
  CARD_ID_LOOKUP[id] = card;
}

const ROTATION_MATRICES = [
  [1, 0, 0, 0, 1, 0],
  [0, 1, 0, -1, 0, 7],
  [-1, 0, 7, 0, -1, 7],
  [0, -1, 7, 1, 0, 0],
];

export function rotateCard(card: Card, rotation: Rotation): Rect {
  const [a, b, c, d, e, f] = ROTATION_MATRICES[rotation];
  const values = [];
  for (let y = 0; y < 8; ++y) {
    for (let x = 0; x < 8; ++x) {
      const pos = { x: a * x + b * y + c, y: d * x + e * y + f };
      values.push(getValue(card, pos));
    }
  }
  return {
    size: card.size,
    values,
  };
}

export function getCardById(card: number) {
  const e = CARD_ID_LOOKUP[card];
  console.assert(!!e);
  return e!;
}

/* stage apis */
const STAGE_ID_LOOKUP: Stage[] = [];

for (const info of MiniGameBoardInfo) {
  const { id, name, spaces: str } = info;
  const rect = MatrixUtil.parse(str);
  const area = rect.values.filter((v) => v != Spaces.INVALID).length;
  const stage: Stage = {
    id,
    name,
    board: rect,
    count: { area },
  };
  STAGE_ID_LOOKUP[id] = stage;
}

export function getStageById(stage: number) {
  const e = STAGE_ID_LOOKUP[stage];
  console.assert(!!e);
  return e!;
}

/* game apis */
export function initGame(stage: number, decks: number[][]): GameState {
  console.assert(decks.length == 2);
  const { board } = getStageById(stage);
  return {
    round: 12,
    board: {
      ...board,
      count: {
        area: [1, 1],
        special: [0, 0],
      },
    },
    players: decks.map((deck) => ({
      deck: deck.slice(4),
      hand: deck.slice(0, 4),
      count: {
        area: 0,
        special: 0,
      },
    })),
    prevMoves: [],
  };
}

export function isGameMoveValid(
  game: GameState,
  move: PlayerMovement
): boolean {
  const { player, action, hand, params } = move;
  if (hand < 0 || hand >= 4) {
    return false;
  }
  if (action == "discard") {
    return true;
  }
  if (params == null) {
    return false;
  }
  const special = action == "special";
  const playerState = game.players[player];
  const card = playerState.hand[hand];
  if (special && playerState.count.special < getCardById(card).count.special) {
    return false;
  }
  return isBoardMoveValid(
    game.board,
    {
      ...params,
      player,
      card,
    },
    special
  );
}

export function moveGame(game: GameState, moves: PlayerMovement[]): GameState {
  console.assert(moves.length == 2);
  console.assert(moves.every((e, i) => e.player == i));
  console.assert(moves.every((e) => isGameMoveValid(game, e)));

  const cards = moves.map(({ player, hand }) =>
    getCardById(game.players[player].hand[hand])
  );

  const earnSpecial = [0, 0];
  const [p1, p2] = moves.map(({ player, action, params }, i) => {
    if (action == "special") {
      earnSpecial[i] -= cards[i].count.special;
    } else if (action == "discard") {
      earnSpecial[i] += 1;
      return null;
    }
    return {
      ...params!,
      player,
      card: cards[i].id,
    };
  });

  let boardMoves: CardPlacement[][] = [];
  if (p1 && p2) {
    let overlap = false;
    const li = new Set();
    [p1, p2].forEach(({ rotation, position }, i) => {
      const rect = rotateCard(cards[i], rotation);
      forEachNonEmpty(rect, ({ x, y }, v) => {
        const pos = { x: x + position.x, y: y + position.y };
        const key = pos.x.toString() + ":" + pos.y.toString();
        if (li.has(key)) {
          overlap = true;
        }
        li.add(key);
      });
    });

    const dn = cards[0].count.area - cards[1].count.area;
    if (!overlap || dn == 0) {
      boardMoves = [[p1, p2]];
    } else if (dn < 0) {
      boardMoves = [[p2], [p1]];
    } else {
      boardMoves = [[p1], [p2]];
    }
  } else {
    if (p1) {
      boardMoves = [[p1]];
    }
    if (p2) {
      boardMoves = [[p2]];
    }
  }

  let { round, board, players } = game;
  const { count } = board;
  for (const li of boardMoves) {
    board = moveBoard(board, li);
  }
  count.special.forEach(
    (v, i) => (earnSpecial[i] += board.count.special[i] - v)
  );

  return {
    round: round - 1,
    board,
    players: players.map(({ deck, hand, count }, i) => ({
      deck: deck.slice(1),
      hand: hand.map((v, j) => (j == moves[i].hand ? deck[0] : v)),
      count: {
        area: board.count.area[i],
        special: count.special + earnSpecial[i],
      },
    })),
    prevMoves: boardMoves,
  };
}

/* bot apis */
export function enumerateGameMoves(
  game: GameState,
  player: PlayerId
): PlayerMovement[] {
  const li = [];
  game.players[player].hand.forEach((card, hand) => {
    for (const special of [true, false]) {
      li.push(
        ...enumerateBoardMoves(game, player, card, special).map(
          ({ rotation, position }) => ({
            player,
            hand,
            action: special ? "special" : "trivial",
            params: {
              rotation,
              position,
            },
          })
        )
      );
    }
  });
  return [
    ...li,
    ...[0, 1, 2, 3].map((hand) => ({
      player,
      action: "discard",
      hand,
    })),
  ];
}

export function enumerateBoardMoves(
  game: GameState,
  player: PlayerId,
  card: number,
  special: boolean
): CardPlacement[] {
  const n = 8;
  const li = [];
  const [w, h] = game.board.size;
  for (let y = -n; y < h; ++y) {
    for (let x = -n; x < w; ++x) {
      for (let r = 0; r < 4; ++r) {
        const move: CardPlacement = {
          player,
          card,
          rotation: <Rotation>r,
          position: { x, y },
        };
        if (isBoardMoveValid(game.board, move, special)) {
          li.push(move);
        }
      }
    }
  }
  return li;
}
