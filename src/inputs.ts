import * as core from "@actions/core";
import * as Shellwords from "shellwords-ts";
import { envsubst } from "./envsubst";

export type Inputs = {
  workingDirectory: string | null;
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
  compilerTools: string[];

  // Deprecated
  stackYaml: string | null;
};

export function getInputs(): Inputs {
  const getBuildArguments = (step: string): string[] => {
    return getShellWordsInput("stack-build-arguments").concat(
      getShellWordsInput(`stack-build-arguments-${step}`),
    );
  };

  return {
    workingDirectory: getInputDefault("working-directory", null),
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
    compilerTools: core.getMultilineInput("compiler-tools"),
    stackYaml: getInputDefault("stack-yaml", null),
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
  return Shellwords.split(raw).map(envsubst);
}
