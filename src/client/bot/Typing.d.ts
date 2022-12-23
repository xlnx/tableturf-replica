/**
 * Metadata
 */
interface IBotInfoBrief {
  name: string;
}

interface IBotInfo extends IBotInfoBrief {
  support: {
    // the stages supported by this bot, [] for any
    stages: number[];
    // does this bot support any deck
    anyDeck: boolean;
  };
}

/**
 * Bot.createSession()
 */
interface IBotCreateSessionRequest {
  // given player id
  player: IPlayerId;
  // given stage
  stage: number;
  // undefined => bot selects deck
  // number[] => given deck
  deck?: number[];
}

interface IRemoteBotCreateSessionResponse {
  // session id
  session: string;
  deck?: number[];
}

/**
 * BotSession.init()
 */
interface IBotSessionInitRequest {
  player: IPlayerId;
  game: IGameState;
}

/**
 * BotSession.query()
 */
type IBotSessionQueryResponse = Omit<IPlayerMovement, "player">;

/**
 * BotSession.update()
 */
interface IBotSessionUpdateRequest {
  game: IGameState;
  moves: IPlayerMovement[];
}
