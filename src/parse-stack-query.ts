import * as yaml from "js-yaml";

export type StackQuery = {
  compiler: Compiler;
};

export type Compiler = {
  actual: string;
  wanted: string;
};

export function parseStackQuery(stdout: string): StackQuery {
  return yaml.load(stdout) as StackQuery;
}
