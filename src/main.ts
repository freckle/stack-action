import * as core from "@actions/core";

import { StackCLI } from "./stack-cli";
import { getCacheKeys } from "./get-cache-keys";
import { hashProject } from "./hash-project";
import { getInputs } from "./inputs";
import { readStackYamlSync, getStackDirectories } from "./stack-yaml";
import { DEFAULT_CACHE_OPTIONS, withCache } from "./with-cache";

async function run() {
  try {
    const inputs = getInputs();

    if (inputs.workingDirectory) {
      core.debug(`Change directory: ${inputs.workingDirectory}`);
      process.chdir(inputs.workingDirectory);
    }

    const hashes = await core.group("Calculate hashes", async () => {
      const hashes = await hashProject(inputs.stackYaml);
      core.info(`Snapshot: ${hashes.snapshot}`);
      core.info(`Packages: ${hashes.package}`);
      core.info(`Sources: ${hashes.sources}`);
      return hashes;
    });

    const stack = new StackCLI(
      inputs.stackYaml,
      inputs.stackArguments,
      core.isDebug(),
    );

    if (inputs.upgradeStack) {
      await core.group("Upgrade stack", async () => {
        await stack.upgrade();
      });
    }

    const { stackYaml, stackDirectories } = await core.group(
      "Determine stack directories",
      async () => {
        const stackYaml = readStackYamlSync(inputs.stackYaml);
        const stackDirectories = await getStackDirectories(stackYaml, stack);

        core.info(`Stack root: ${stackDirectories.stackRoot}`);
        core.info(
          `Stack works:\n - ${stackDirectories.stackWorks.join("\n - ")}`,
        );

        return { stackYaml, stackDirectories };
      },
    );

    // Can't use compiler here because stack-query requires setting up the Stack
    // environment, installing GHC, etc. And we never want to do that outside of
    // caching. Use the resolver itself instead.
    const cachePrefix = `${inputs.cachePrefix}${process.platform}/${stackYaml.resolver}`;

    await core.group("Setup and install dependencies", async () => {
      await withCache(
        [stackDirectories.stackRoot].concat(stackDirectories.stackWorks),
        getCacheKeys([`${cachePrefix}/deps`, hashes.snapshot, hashes.package]),
        async () => {
          await stack.setup(inputs.stackSetupArguments);
          await stack.buildDependencies(inputs.stackBuildArgumentsDependencies);
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
  }
}

run();
