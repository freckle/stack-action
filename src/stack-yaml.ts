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

export async function getStackDirectories(
  stackYaml: StackYaml,
  stack: StackCLI,
  workingDirectory?: string,
): Promise<StackDirectories> {
  const cwd = workingDirectory ?? process.cwd();

  // Only use --stack-root, which (as of stack v2.15) won't load the environment
  // and install GHC, etc. It's the only option currently safe to make use of
  // outside of caching.
  const stackRoot = (await stack.read(["path", "--stack-root"])).trim();

  // Avoid `stack path --programs` until
  // https://github.com/commercialhaskell/stack/issues/6484 is fixed.
  const stackPrograms =
    stackYaml["local-programs-path"] ?? defaultLocalProgramsPath(stackRoot);

  const stackWorks = packagesStackWorks(stackYaml, cwd);

  return { stackRoot, stackPrograms, stackWorks };
}

// https://docs.haskellstack.org/en/stable/yaml_configuration/#local-programs-path
function defaultLocalProgramsPath(stackRoot: string): string {
  if (process.platform === "win32") {
    const localAppData = process.env["%LOCALAPPDATA%"];

    if (localAppData) {
      return pathJoin(localAppData, "Programs", "stack");
    }
  }

  return pathJoin(stackRoot, "programs");
}

function packagesStackWorks(stackYaml: StackYaml, cwd: string): string[] {
  // We always include ./.stack-work, so filter the "." element if present
  const packageStackWorks = (stackYaml.packages ?? [])
    .filter((p) => p !== ".")
    .map((p) => pathJoin(cwd, p, ".stack-work"));

  return [pathJoin(cwd, ".stack-work")].concat(packageStackWorks);
}
