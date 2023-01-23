declare type ICreateMatchBody = IJoinMatchBody & {
  matchName?: string;
  // password?: string;
};

declare interface IJoinMatchBody {
  playerName: string;
}

declare interface ILeaveMatchBody {
  playerID: string;
  credentials: string;
}
