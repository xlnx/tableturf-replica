// import { Buffer } from "buffer";
// window.Buffer = Buffer;

// import { getLogger } from "loglevel";
// import { TransportData, Host, Client } from "./Controller";
// import { P2P } from "@boardgame.io/p2p";
// import { Color } from "./engine/Color";
// import { randomBytes } from "tweetnacl";
// import base64url from "base64url";
// import QRCode from "qrcode";
// import { Lobby } from "./Lobby";
// import { TableturfClientState } from "./Game";
// import { DB } from "./Database";
// import { System } from "./engine/System";

// const logger = getLogger("peerjs-host");
// logger.setLevel("info");

// const baseUrl = System.url.origin;
// console.log(`base: ${baseUrl}`);

// const matchId = base64url.encode(Buffer.from(randomBytes(16)));
// const url = new URL(`?peer=${matchId}`, baseUrl).href;
// const qrcode: string = await new Promise((resolve, reject) =>
//   QRCode.toDataURL(
//     url,
//     {
//       type: "image/webp",
//       errorCorrectionLevel: "L",
//       margin: 2,
//       color: {
//         light: Color.WHITE.hexSharp,
//         dark: Color.WHITE.hexSharp + "00",
//       },
//     },
//     (err, url) => (!err ? resolve(url) : reject(err))
//   )
// );

// class P2PHost_0 extends Host {
//   readonly url = url;
//   readonly qrcode = qrcode;

//   private _hasClient = false;

//   constructor() {
//     super({
//       playerId: 0,
//       matchId,
//       multiplayer: P2P({
//         isHost: true,
//         peerOptions: PeerJsOptions,
//         onError: (err) => logger.warn(err),
//         acceptClient: (conn) => !this._hasClient && Lobby.acceptClient(),
//       }),
//     });
//   }

//   async handleClientConnect() {
//     this._hasClient = true;
//     /* user info should be put here */
//     Lobby.handleClientConenct();
//   }

//   async handleClientDisconnect() {
//     this._hasClient = false;
//     this.stop();
//     this.send("resetPlayerInfo", 1);
//     Lobby.handleP2PDisconnect();
//   }

//   protected handleStateUpdate(state: TableturfClientState) {
//     super.handleStateUpdate(state);
//     if (!state.G.players[this.playerId]) {
//       this.updatePlayerInfo(DB.player);
//     }
//   }
// }

// export class P2PClient extends Client {
//   private constructor(matchId: string) {
//     super({
//       playerId: <any>(1 - P2PHost.playerId),
//       matchId,
//       multiplayer: P2P({
//         isHost: false,
//         peerOptions: PeerJsOptions,
//         onError: (err) => {
//           logger.warn(err);
//         },
//         onClose: () => {
//           console.log("closed");
//           if (this.isConnected) {
//             this.handleDisconnect();
//           }
//         },
//       }),
//     });
//   }

//   protected handleTransportData(data: TransportData) {
//     super.handleTransportData(data);
//     logger.log(data);
//     if (data.type == "matchData") {
//     }
//   }

//   protected handleStateUpdate(state: TableturfClientState) {
//     super.handleStateUpdate(state);
//     if (!state.G.players[this.playerId]) {
//       this.updatePlayerInfo(DB.player);
//     }
//   }

//   static connect(matchId: string, timeout: number): Promise<Client> {
//     return new P2PClient(matchId)._connect(timeout);
//   }

//   async handleDisconnect() {
//     this.stop();
//     if (this.isConnected()) {
//       Lobby.handleP2PDisconnect();
//     }
//   }
// }

// const PeerJsOptions = undefined;
// // export const PeerJsOptions = {
// //   key: "peerjs",
// //   host: "0.0.0.0",
// //   port: 9000,
// // };

// export const P2PHost = new P2PHost_0();
// console.log(`Room url: ${P2PHost.url}`);
