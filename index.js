import { writeFileSync } from "fs";
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

function merge(merged, key, actual) {
  if (key === "rules") {
    for (const key2 of Object.keys(actual)) {
      merged[key2] = actual[key2];
    }
  } else {
    merged[key] = actual;
  }
}

const extend_config = extend_configs.reduce((merged, config) => {
  for (const key of Object.keys(config)) {
    if (!(key in merged)) {
      merged[key] = config[key];
    } else {
      merge(merged, key, config[key]);
    }
  }
  return merged;
}, {});

const target_config = await load_config(target);

const result = { extends: extend, rules: {} };

function uniq(array) {
  let visited = new Set();
  let result = [];
  for (let a of array) {
    if (!visited.has(a)) {
      visited.add(a);
      result.push(a);
    }
  }
  return a;
}

function is_equal(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) return a.every((e, i) => is_equal(e, b[i]));
  if (typeof a === "object" && a !== null)
    return Object.keys(a).every(k => is_equal(a[k], b[k]));
}

const TURN_OFF_MISSING_RULES = false;

for (const key of Object.keys(target_config)) {
  if (key === "rules") {
    const old_values = extend_config[key];
    const values = target_config[key];
    for (const key2 of Object.keys(target_config.rules)) {
      const old_value = old_values[key2];
      const value = values[key2];
      if (old_value && !value) {
        if (TURN_OFF_MISSING_RULES) {
          result.rules[key2] = "off";
        }
      } else if (!is_equal(old_value, value)) {
        result.rules[key2] = value;
      }
    }
  } else if (key === "extends") {
    result.extends = uniq([...result.extends, ...target_config.extends]);
  } else {
    result[key] = target_config[key];
  }
}

writeFileSync("out.json", JSON.stringify(result, null, 2));
