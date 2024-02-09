import * as core from "@actions/core";
import * as Shellwords from "shellwords-ts";

export type Inputs = {
  workingDirectory: string | null;
  stackYaml: string;
  test: boolean;
  stackArguments: string[];
  stackSetupArguments: string[];
  stackQueryArguments: string[];
  stackBuildArguments: string[];
  stackBuildArgumentsDependencies: string[];
  stackBuildArgumentsBuild: string[];
  stackBuildArgumentsTest: string[];
  cachePrefix: string;
  cacheSaveAlways: boolean;
};

export function getInputs(): Inputs {
  return {
    workingDirectory: getInputDefault("working-directory", null),
    stackYaml: getInputDefault("stack-yaml", "stack.yaml"),
    test: core.getBooleanInput("test"),
    stackArguments: getShellWordsInput("stack-arguments"),
    stackSetupArguments: getShellWordsInput("stack-setup-arguments"),
    stackQueryArguments: getShellWordsInput("stack-query-arguments"),
    stackBuildArguments: getShellWordsInput("stack-build-arguments"),
    stackBuildArgumentsDependencies: getShellWordsInput(
      "stack-build-arguments-dependencies",
    ),
    stackBuildArgumentsBuild: getShellWordsInput("stack-build-arguments-build"),
    stackBuildArgumentsTest: getShellWordsInput("stack-build-arguments-test"),
    cachePrefix: core.getInput("cache-prefix"),
    cacheSaveAlways: core.getBooleanInput("cache-save-always"),
  };
}

function getInputDefault<T>(name: string, d: T): string | T {
  const raw = core.getInput(name, { trimWhitespace: true });
  return raw === "" ? d : raw;
}

function getShellWordsInput(
  name: string,
  options?: core.InputOptions,
): string[] {
  const raw = core.getMultilineInput(name, options).join(" ");
  return Shellwords.split(raw);
}
