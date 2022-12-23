declare type ITurn = -1 | 1;
declare type IPlayerId = 0 | 1;

declare type IRotation = 0 | 1 | 2 | 3;

declare type ICoordinate = {
  x: number;
  y: number;
};

interface IRect {
  size: number[];
  values: number[];
}

interface IBoardState extends IRect {
  count: {
    area: number[];
    special: number[];
  };
}

interface IStage {
  id: number;
  name: string;
  board: IRect;
  count: {
    area: number;
  };
}

interface ICard extends IRect {
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

interface IPlayerState {
  deck: number[];
  hand: number[];
  count: {
    area: number;
    special: number;
  };
}

interface IGameState {
  round: number;
  board: IBoardState;
  players: IPlayerState[];
  prevMoves: ICardPlacement[][];
}

interface ICardPlacement {
  player: IPlayerId;
  card: number;
  rotation: IRotation;
  position: ICoordinate;
}

interface IPlayerMovement {
  player: IPlayerId;
  action: "discard" | "trivial" | "special";
  hand: number;
  params?: {
    rotation: IRotation;
    position: ICoordinate;
  };
}
