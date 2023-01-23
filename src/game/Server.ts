import { Gateway } from "./Gateway";
import fs from "fs";
import path from "path";

const config = fs
  .readFileSync(path.resolve(process.cwd(), process.argv[2]), "utf8")
  .toString();

async function main() {
  const gateway = new Gateway();
  await gateway.run(JSON.parse(config));
  await new Promise(() => {});
}

main();
