import { Gateway } from "./Gateway";

async function main() {
  const gateway = new Gateway({
    hostnames: ["192.168.1.107"]
  });
  await gateway.run({
    port: 5140,
    gatewayPort: 5141,
    internalPortRange: [32400, 32410],
  });
  await new Promise(() => {});
}

main();
