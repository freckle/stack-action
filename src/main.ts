import * as core from "@actions/core";

import { StackCLI } from "./stack-cli";
import { getCacheKeys } from "./get-cache-keys";
import { hashProject } from "./hash-project";
import { getInputs } from "./inputs";
import { readStackYamlSync, packagesStackWorks } from "./stack-yaml";
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

    // TODO: input to skip this
    await core.group("Upgrade stack", async () => {
      await stack.upgrade();
    });

    const { stackYaml, stackRoot, stackWorks } = await core.group(
      "Determine stack directories",
      async () => {
        // Only use --stack-root, which (as of stack v2.15) won't load the
        // environment and install GHC, etc. It's the only option currently safe
        // to make use of outside of caching.
        const stackRoot = (await stack.read(["path", "--stack-root"])).trim();
        core.info(`Stack root: ${stackRoot}`);

        const stackYaml = readStackYamlSync(inputs.stackYaml);
        const stackWorks = packagesStackWorks(stackYaml);
        core.info(`Stack works:\n - ${stackWorks.join("\n - ")}`);

        return { stackYaml, stackRoot, stackWorks };
      },
    );

    // Can't use compiler here because stack-query requires setting up the Stack
    // environment, installing GHC, etc. And we never want to do that outside of
    // caching. Use the resolver itself instead.
    const cachePrefix = `${inputs.cachePrefix}${process.platform}/${stackYaml.resolver}`;

    await core.group("Setup and install dependencies", async () => {
      await withCache(
        [stackRoot].concat(stackWorks),
        getCacheKeys([`${cachePrefix}/deps`, hashes.snapshot, hashes.package]),
        async () => {
          await stack.setup(inputs.stackSetupArguments);
          await stack.buildDependencies(
            inputs.stackBuildArguments.concat(
              inputs.stackBuildArgumentsDependencies,
            ),
          );
        },
        {
          ...DEFAULT_CACHE_OPTIONS,
          skipOnHit: !inputs.cacheSaveAlways,
        },
      );
    });

    await core.group("Build", async () => {
      await withCache(
        stackWorks,
        getCacheKeys([
          `${cachePrefix}/build`,
          hashes.snapshot,
          hashes.package,
          hashes.sources,
        ]),
        async () => {
          await stack.buildNoTest(
            inputs.stackBuildArguments.concat(inputs.stackBuildArgumentsBuild),
          );
        },
        {
          ...DEFAULT_CACHE_OPTIONS,
          skipOnHit: false, // always Build
        },
      );
    });

    await core.group("Test", async () => {
      if (inputs.test) {
        await stack.buildTest(
          inputs.stackBuildArguments.concat(inputs.stackBuildArgumentsTest),
        );
      }
    });

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
