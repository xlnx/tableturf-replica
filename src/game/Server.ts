import { Gateway } from "./Gateway";
import fs from "fs";
import path from "path";

const config = fs
  .readFileSync(path.resolve(process.cwd(), process.argv[2]), "utf8")
  .toString();

async function main() {
  // cors = {
  //   hostnames: ["192.168.1.107"]
  // }
  // run = {
  //   port: 5140,
  //   gatewayPort: 5141,
  //   internalPortRange: [32400, 32410],
  // }
  const { cors, run } = JSON.parse(config);
  const gateway = new Gateway(cors);
  await gateway.run(run);
  await new Promise(() => {});
}

main();
