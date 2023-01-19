import { System } from "../engine/System";
import { GatewayClient } from "../game/GatewayClient";

export const Gateway = new GatewayClient({
    hostname: System.url.hostname,
    port: 5140,
    gatewayPort: 5141,
})
