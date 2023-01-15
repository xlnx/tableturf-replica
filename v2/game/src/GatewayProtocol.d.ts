declare type ICreateMatchBody = IJoinMatchBody & {};

declare interface IJoinMatchBody {
  playerName: string;
}

declare interface ILeaveMatchBody {
  playerID: string;
  credentials: string;
}
