declare type ICreateMatchBody = IJoinMatchBody & {
  matchName?: string;
  // password?: string;
};

declare type ICreateMatchResponse = IJoinMatchResponse & {
  matchID: string;
};

declare interface IJoinMatchBody {
  playerName: string;
}

declare interface IJoinMatchResponse {
  playerID: string;
  playerCredentials: string;
}

declare interface ILeaveMatchBody {
  playerID: string;
  credentials: string;
}
