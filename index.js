import { spawnSync } from "child_process";

import eslint_recommended from "./node_modules/eslint/conf/eslint-recommended.js";
import eslint_all from "./node_modules/eslint/conf/eslint-all.js";

const args = process.argv.slice(2);

if (args.length === 0 || args.some(e => e === "--help")) {
  console.log("usage: node index.js [...extends] target-config");
  process.exit(0);
}

const extend = args.slice(0, -1);
const target = args.at(-1);

async function load_config(name) {
  if (name === "eslint:recommended") {
    return eslint_recommended;
  } else if (name === "eslint:all") {
    return eslint_all;
  } else if (name[0] === ".") {
    (await import(name)).default;
  } else {
    console.log("\x1b[32m" + "installing" + "\x1b[m", name);
    spawnSync("pnpm", ["add", /*"--no-save",*/ name], { stdio: "inherit" });
    return (await import(name)).default;
  }
}

const extend_configs = [];
for (const name of extend) {
  extend_configs.push(await load_config(name));
}

const target_config = await load_config(target);

console.log({ extend_configs, target_config });
