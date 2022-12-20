// browser polyfill
import { Buffer } from "buffer";
window.Buffer = Buffer;

import base64url from "base64url";
import { randomBytes } from "tweetnacl";
import { P2P } from "@boardgame.io/p2p";
import { Client, TransportData } from "./Client";
import { getLogger } from "loglevel";
import { TableturfClientState } from "../Game";

const logger = getLogger("p2p");
logger.setLevel("info");

function randomBase64Url() {
  return base64url.encode(Buffer.from(randomBytes(16)));
}

const PeerJsOptions = undefined;
const P2PTimeoutSec = 15;

export class P2PHost extends Client {
  private _peer: any;
  private _cleanUp = false;

  private constructor() {
    super({
      playerId: 0,
      matchId: randomBase64Url(),
      multiplayer: P2P({
        isHost: true,
        peerOptions: PeerJsOptions,
        onError: (err) => logger.warn(err),
        acceptClient: (conn) => {
          if (
            !this._peer &&
            this.client.getState().ctx.phase == "prepare" &&
            !this._cleanUp
          ) {
            this._peer = conn;
            return true;
          }
          logger.warn(`rejected incoming connection:`, conn);
          conn.close();
          return false;
        },
      }),
    });
    this.on("data", this._handleDataP2P.bind(this));
    this.on("update", this._handleUpdateP2P.bind(this));
  }

  static async create() {
    return await new P2PHost().start(P2PTimeoutSec);
  }

  private _handleDataP2P(data: TransportData) {
    if (data.type == "matchData") {
      if (this._peer && !data.args[1][1].isConnected) {
        this._cleanUp = true;
        this._peer = null;
        this.client.events.setPhase("reset");
        this.send("resetPlayerInfo", 1);
      }
    }
  }

  private _handleUpdateP2P({ G, ctx }: TableturfClientState) {
    if (this._cleanUp) {
      if (ctx.phase == "prepare" && !G.players[1]) {
        this._cleanUp = false;
      }
    }
  }
}

export class P2PClient extends Client {
  private constructor(matchId: string) {
    super({
      playerId: 1,
      matchId,
      multiplayer: P2P({
        isHost: false,
        peerOptions: PeerJsOptions,
        onError: (err) => {
          logger.warn(err);
        },
        onClose: () => {
          this.handleDisconnect();
        },
      }),
    });
  }

  static async connect(matchId: string) {
    return new P2PClient(matchId).start(P2PTimeoutSec);
  }
}
