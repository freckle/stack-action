import * as core from "@actions/core";
import * as Shellwords from "shellwords-ts";

export type Inputs = {
  workingDirectory: string | null;
  stackYaml: string;
  test: boolean;
  stackArguments: string[];
  stackSetupArguments: string[];
  stackQueryArguments: string[];
  stackBuildArgumentsDependencies: string[];
  stackBuildArgumentsBuild: string[];
  stackBuildArgumentsTest: string[];
  cachePrefix: string;
  cacheSaveAlways: boolean;
  upgradeStack: boolean;
};

export function getInputs(): Inputs {
  const getBuildArguments = (step: string): string[] => {
    return getShellWordsInput("stack-build-arguments").concat(
      getShellWordsInput(`stack-build-arguments-${step}`),
    );
  };

  return {
    workingDirectory: getInputDefault("working-directory", null),
    stackYaml: getInputDefault("stack-yaml", "stack.yaml"),
    test: core.getBooleanInput("test"),
    stackArguments: getShellWordsInput("stack-arguments"),
    stackSetupArguments: getShellWordsInput("stack-setup-arguments"),
    stackQueryArguments: getShellWordsInput("stack-query-arguments"),
    stackBuildArgumentsDependencies: getBuildArguments("dependencies"),
    stackBuildArgumentsBuild: getBuildArguments("build"),
    stackBuildArgumentsTest: getBuildArguments("test"),
    cachePrefix: core.getInput("cache-prefix"),
    cacheSaveAlways: core.getBooleanInput("cache-save-always"),
    upgradeStack: core.getBooleanInput("upgrade-stack"),
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
