/* eslint-disable import/no-nodejs-modules */
import { execFileSync } from "child_process";
import { resolve } from "path";

const prettierCliPath = resolve(
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs",
);

function getStagedFiles() {
  const output = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  ).trim();

  if (!output) {
    return [];
  }

  return output.split(/\r?\n/).filter(Boolean);
}

const stagedFiles = getStagedFiles();

if (stagedFiles.length === 0) {
  console.log("No staged files to check with Prettier.");
  globalThis.process.exit(0);
}

execFileSync(
  globalThis.process.execPath,
  [prettierCliPath, "--check", "--ignore-unknown", ...stagedFiles],
  { stdio: "inherit" },
);
