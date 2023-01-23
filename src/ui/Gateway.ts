import { GatewayClient } from "../game/GatewayClient";

export const Gateway = new GatewayClient({
  hostname: "api.koishi.top",
  port: 5100,
  gatewayPort: 5102,
  https: true,
});
