import { GatewayClient } from "../game/GatewayClient";

export const Gateway = new GatewayClient({
  hostname: "api.tableturf.koishi.top",
  port: 5100,
  gatewayPort: 5101,
});
