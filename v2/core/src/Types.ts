export type ITurn = -1 | 1;
export type IPlayerId = 0 | 1;

export type IRotation = 0 | 1 | 2 | 3;

export type ICoordinate = {
  x: number;
  y: number;
};

export interface IRect {
  size: number[];
  values: number[];
}

export interface IBoardState extends IRect {
  count: {
    area: number[];
    special: number[];
  };
}

export interface IStage {
  id: number;
  name: string;
  board: IRect;
  count: {
    area: number;
  };
}

export interface ICard extends IRect {
  id: number;
  name: string;
  rarity: "Common" | "Rare" | "Fresh";
  category: string;
  season: number;
  count: {
    area: number;
    special: number;
  };
  render: {
    bg: string;
  };
}

export interface IPlayerState {
  deck: number[];
  hand: number[];
  count: {
    area: number;
    special: number;
  };
}

export interface IGameState {
  round: number;
  board: IBoardState;
  players: IPlayerState[];
  prevMoves: ICardPlacement[][];
}

export interface ICardPlacement {
  player: IPlayerId;
  card: number;
  rotation: IRotation;
  position: ICoordinate;
}

export interface IPlayerMovement {
  player: IPlayerId;
  action: "discard" | "trivial" | "special";
  hand: number;
  params?: {
    rotation: IRotation;
    position: ICoordinate;
  };
}
