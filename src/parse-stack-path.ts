import * as yaml from "js-yaml";

export type StackPath = {
  [key: string]: string | null;
};

export function parseStackPath(stdout: string): StackPath {
  return yaml.load(stdout) as StackPath;
}
