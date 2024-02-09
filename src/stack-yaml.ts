import * as fs from "fs";
import { join as joinPath } from "path";
import * as yaml from "js-yaml";

export type StackYaml = {
  resolver: string;
  packages: string[] | null;
};

export function readStackYamlSync(path: string): StackYaml {
  const contents = fs.readFileSync(path, { encoding: "utf-8" });
  return yaml.load(contents) as StackYaml;
}

export function packagesStackWorks(stackYaml: StackYaml): string[] {
  const cwd = process.cwd();

  return [".stack-work"]
    .concat((stackYaml.packages ?? []).map((p) => joinPath(p, ".stack-work")))
    .map((sw) => joinPath(cwd, sw));
}
