import * as fs from "fs";
import { join as pathJoin } from "path";
import * as yaml from "js-yaml";

import { StackCLI } from "./stack-cli";

export type StackYaml = {
  resolver: string;
  packages: string[] | null;
  "local-programs-path": string | null;
};

export function readStackYamlSync(path: string): StackYaml {
  const contents = fs.readFileSync(path, { encoding: "utf-8" });
  return parseStackYaml(contents);
}

export function parseStackYaml(contents: string): StackYaml {
  return yaml.load(contents) as StackYaml;
}

export type StackDirectories = {
  stackRoot: string;
  stackPrograms: string;
  stackWorks: string[];
};

// Internal type for parsing Yaml output from `stack path`
type StackPath = {
  "stack-root": string;
  programs: string;
};

export async function getStackDirectories(
  stackYaml: StackYaml,
  stack: StackCLI,
  workingDirectory?: string,
): Promise<StackDirectories> {
  const cwd = workingDirectory ?? process.cwd();

  // Only use --stack-root and --programs, which (as of stack v2.15.3) won't
  // load the environment and install GHC, etc. These are the only options
  // currently safe to make use of outside of caching.
  const output = await stack.read(["path", "--stack-root", "--programs"]);
  const stackPath = yaml.load(output) as StackPath;
  const stackWorks = packagesStackWorks(stackYaml, cwd);

  return {
    stackRoot: stackPath["stack-root"],
    stackPrograms: stackPath.programs,
    stackWorks,
  };
}

function packagesStackWorks(stackYaml: StackYaml, cwd: string): string[] {
  // We always include ./.stack-work, so filter the "." element if present
  const packageStackWorks = (stackYaml.packages ?? [])
    .filter((p) => p !== ".")
    .map((p) => pathJoin(cwd, p, ".stack-work"));

  return [pathJoin(cwd, ".stack-work")].concat(packageStackWorks);
}
