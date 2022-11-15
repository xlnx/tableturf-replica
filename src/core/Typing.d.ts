declare type Turn = -1 | 1;
declare type PlayerId = 0 | 1;

declare type Rotation = 0 | 1 | 2 | 3;

declare type Coordinate = {
  x: number;
  y: number;
};

declare interface Matrix<T> {
  width: number;
  height: number;
  spaces: T[];
}
