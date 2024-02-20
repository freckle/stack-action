import * as exec from "@actions/exec";

import { StackCLI } from "./stack-cli";

jest.spyOn(exec, "exec");

describe("StackCLI", () => {
  test("Respects --resolver given", async () => {
    const stackCLI = new StackCLI(["--resolver", "lts"], false);

    await stackCLI.setup([]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      ["--resolver", "lts", "setup"],
      undefined, // ExecOptions
    );
  });

  test("Adds --resolver nightly", async () => {
    const stackCLI = new StackCLI(
      ["--stack-yaml", "sub/stack-nightly.yaml"],
      false,
    );

    await stackCLI.setup([]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      [
        "--stack-yaml",
        "sub/stack-nightly.yaml",
        "--resolver",
        "nightly",
        "setup",
      ],
      undefined, // ExecOptions
    );
  });

  test("Doesn't add --resolver nightly if given", async () => {
    const stackCLI = new StackCLI(
      [
        "--stack-yaml",
        "sub/stack-nightly.yaml",
        "--resolver",
        "nightly-20240201",
      ],
      false,
    );

    await stackCLI.setup([]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      [
        "--stack-yaml",
        "sub/stack-nightly.yaml",
        "--resolver",
        "nightly-20240201",
        "setup",
      ],
      undefined, // ExecOptions
    );
  });

  test("buildDependencies", async () => {
    const stackCLI = new StackCLI([], false);

    await stackCLI.buildDependencies(["--coverage"]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      [
        "build",
        "--test",
        "--no-run-tests",
        "--dependencies-only",
        "--coverage",
      ],
      undefined,
    );
  });

  test("buildNoTest", async () => {
    const stackCLI = new StackCLI([], false);

    await stackCLI.buildNoTest(["--coverage"]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      ["build", "--test", "--no-run-tests", "--coverage"],
      undefined,
    );
  });

  test("buildTest", async () => {
    const stackCLI = new StackCLI([], false);

    await stackCLI.buildTest(["--coverage"]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      ["build", "--test", "--coverage"],
      undefined,
    );
  });

  test("build", async () => {
    const stackCLI = new StackCLI([], false);

    await stackCLI.build(["--coverage"]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      ["build", "--coverage"],
      undefined,
    );
  });
});
