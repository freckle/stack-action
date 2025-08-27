import * as core from "@actions/core";

import { checkDirtyFiles } from "./dirty-files";
import { StackCLI } from "./stack-cli";
import { getCacheKeys } from "./get-cache-keys";
import { hashProject } from "./hash-project";
import { getInputs } from "./inputs";
import { readStackYamlSync, getStackDirectories } from "./stack-yaml";
import { DEFAULT_CACHE_OPTIONS, withCache } from "./with-cache";
import { GenHIE } from "./hie";

async function run() {
  try {
    const inputs = getInputs();

    if (inputs.color) {
      inputs.stackArguments.unshift("--color=always");
    }

    if (inputs.workingDirectory) {
      core.debug(`Change directory: ${inputs.workingDirectory}`);
      process.chdir(inputs.workingDirectory);
    }

    if (inputs.stackYaml) {
      core.warning(
        "inputs.stack-yaml is deprecated. Set env.STACK_YAML or use inputs.stack-arguments instead.",
      );

      // Maintain original behavior for now
      inputs.stackArguments.unshift(inputs.stackYaml);
      inputs.stackArguments.unshift("--stack-yaml");
    }

    const stack = new StackCLI(inputs.stackArguments, core.isDebug());
    const genHIE = new GenHIE(stack);

    await core.group("Install/upgrade stack", async () => {
      const installed = await stack.installed();

      if (installed) {
        if (inputs.upgradeStack) {
          core.info("Upgrading stack");
          await stack.upgrade();
        }
      } else {
        if (inputs.installStack) {
          core.info("Installing stack");
          await stack.install();
        } else {
          throw new Error(
            [
              "The executable stack is not present on $PATH",
              "Make sure it is installed in a preceding step, or use",
              "`install-stack: true` to have it installed for you.",
            ].join("\n"),
          );
        }
      }
    });

    const hashes = await core.group("Calculate hashes", async () => {
      const hashes = await hashProject(stack.config);
      core.info(`Snapshot: ${hashes.snapshot}`);
      core.info(`Packages: ${hashes.package}`);
      core.info(`Sources: ${hashes.sources}`);
      return hashes;
    });

    const { stackYaml, stackDirectories } = await core.group(
      "Determine stack directories",
      async () => {
        const stackYaml = readStackYamlSync(stack.config);
        const stackDirectories = await getStackDirectories(stackYaml, stack);

        core.info(
          [
            `Stack root: ${stackDirectories.stackRoot}`,
            `Stack programs: ${stackDirectories.stackPrograms}`,
            `Stack works:\n - ${stackDirectories.stackWorks.join("\n - ")}`,
          ].join("\n"),
        );

        return { stackYaml, stackDirectories };
      },
    );

    // Can't use compiler here because stack-query requires setting up the Stack
    // environment, installing GHC, etc. And we never want to do that outside of
    // caching. Use the resolver itself instead. This will use either --resolver
    // from stack-arguments, if given, or fall back to reading resolver from the
    // stack.yaml file in use.
    const cachePrefix = `${inputs.cachePrefix}${process.platform}${process.arch}/${
      stack.resolver ?? stackYaml.resolver
    }`;

    await core.group("Setup and install dependencies", async () => {
      const { stackRoot, stackPrograms, stackWorks } = stackDirectories;

      await withCache(
        [stackRoot, stackPrograms].concat(stackWorks),
        getCacheKeys([`${cachePrefix}/deps`, hashes.snapshot, hashes.package]),
        async () => {
          await stack.setup(inputs.stackSetupArguments);
          await stack.buildDependencies(inputs.stackBuildArgumentsDependencies);
          await stack.installCompilerTools(inputs.compilerTools);
          await genHIE.install();
        },
        {
          ...DEFAULT_CACHE_OPTIONS,
          saveOnError: inputs.cacheSaveAlways,
        },
      );
    });

    await core.group("Build", async () => {
      await withCache(
        stackDirectories.stackWorks,
        getCacheKeys([
          `${cachePrefix}/build`,
          hashes.snapshot,
          hashes.package,
          hashes.sources,
        ]),
        async () => {
          await stack.buildNoTest(inputs.stackBuildArgumentsBuild);
        },
        {
          ...DEFAULT_CACHE_OPTIONS,
          skipOnHit: false, // always Build
          saveOnError: inputs.cacheSaveAlways,
        },
      );
    });

    await core.group(`Maintain ${genHIE.path}`, async () => {
      await genHIE.generate();
    });

    await core.group("Check for dirty files", async () => {
      await checkDirtyFiles(inputs.onDirtyFiles);
    });

    if (inputs.test) {
      await core.group("Test", async () => {
        await stack.buildTest(inputs.stackBuildArgumentsTest);
      });
    }

    await core.group("Set outputs", async () => {
      const stackQuery = await stack.query();
      const compiler = stackQuery.compiler.actual;
      const compilerVersion = compiler.replace(/^ghc-/, "");

      core.info("Setting query-compiler outputs");
      core.setOutput("compiler", compiler);
      core.setOutput("compiler-version", compilerVersion);

      const stackPath = await stack.path();

      core.info("Setting stack-path outputs");
      for (const k in stackPath) {
        const v = stackPath[k];
        core.debug(`Setting stack-path output: ${k}=${v}`);
        core.setOutput(k, v);
      }
    });
    // https://github.com/actions/cache/blob/0c45773b623bea8c8e75f6c82b208c3cf94ea4f9/src/restoreImpl.ts#L99-L106
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      core.error(error);
      core.setFailed(error.message);
    } else if (typeof error === "string") {
      core.error(error);
      core.setFailed(error);
    } else {
      core.error("Non-Error exception");
      core.setFailed("Non-Error exception");
    }
    // https://github.com/actions/cache/blob/0c45773b623bea8c8e75f6c82b208c3cf94ea4f9/src/restoreImpl.ts#L88
    process.exit(1);
  }
}

run();
