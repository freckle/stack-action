import * as fs from "fs";
import { join as pathJoin } from "path";
import * as yaml from "js-yaml";

export type StackYaml = {
  resolver: string;
  packages: string[] | null;
};

export function readStackYamlSync(path: string): StackYaml {
  const contents = fs.readFileSync(path, { encoding: "utf-8" });
  return parseStackYaml(contents);
}

export function parseStackYaml(contents: string): StackYaml {
  return yaml.load(contents) as StackYaml;
}

export function packagesStackWorks(
  stackYaml: StackYaml,
  workingDirectory?: string,
): string[] {
  const cwd = workingDirectory ?? process.cwd();

  // We always include ./.stack-work, so filter the "." element if present
  const packageStackWorks = (stackYaml.packages ?? [])
    .filter((p) => p !== ".")
    .map((p) => pathJoin(cwd, p, ".stack-work"));

  return [pathJoin(cwd, ".stack-work")].concat(packageStackWorks);
}
