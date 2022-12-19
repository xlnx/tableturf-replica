// browser polyfill
import { Buffer } from "buffer";
window.Buffer = Buffer;

import base64url from "base64url";
import { randomBytes } from "tweetnacl";
import { P2P } from "@boardgame.io/p2p";
import { Client } from "./Client";
import { getLogger } from "loglevel";

const logger = getLogger("p2p");
logger.setLevel("info");

function randomBase64Url() {
  return base64url.encode(Buffer.from(randomBytes(16)));
}

const PeerJsOptions = undefined;
const P2PTimeoutSec = 15;

export class P2PHost extends Client {
  private constructor() {
    super({
      playerId: 0,
      matchId: randomBase64Url(),
      multiplayer: P2P({
        isHost: true,
        peerOptions: PeerJsOptions,
        onError: (err) => logger.warn(err),
        // acceptClient: (conn) => !this._hasClient && Lobby.acceptClient(),
      }),
    });
  }

  static async create() {
    return await new P2PHost().start(P2PTimeoutSec);
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
          console.info("client closed");
          // if (this.isConnected) {
          //   this.handleDisconnect();
          // }
        },
      }),
    });
  }

  static async connect(matchId: string) {
    return new P2PClient(matchId).start(P2PTimeoutSec);
  }
}
