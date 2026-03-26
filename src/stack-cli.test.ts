import { ExecOptions } from "@actions/exec";
import { jest } from "@jest/globals";

import { ExecDelegate, StackCLI } from "./stack-cli.js";

const exec: ExecDelegate = {
  exec: jest.fn((command: string, args: string[], options?: ExecOptions) =>
    Promise.resolve(0),
  ),
};

describe("StackCLI", () => {
  test("Respects --resolver given", async () => {
    const stackCLI = new StackCLI(["--resolver", "lts"], false, exec);

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
      exec,
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
      exec,
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

  test("installCompilerTools", async () => {
    const stackCLI = new StackCLI([], false, exec);
    await stackCLI.installCompilerTools(["hlint", "weeder"]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      ["install", "--copy-compiler-tool", "hlint", "weeder"],
      undefined,
    );
  });

  test("installCompilerTools with empty arguments", async () => {
    const stackCLI = new StackCLI([], false, exec);
    await stackCLI.installCompilerTools([]);

    expect(exec.exec).not.toHaveBeenCalled();
  });

  test("buildDependencies", async () => {
    const stackCLI = new StackCLI([], false, exec);

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
    const stackCLI = new StackCLI([], false, exec);

    await stackCLI.buildNoTest(["--coverage"]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      ["build", "--test", "--no-run-tests", "--coverage"],
      undefined,
    );
  });

  test("buildTest", async () => {
    const stackCLI = new StackCLI([], false, exec);

    await stackCLI.buildTest(["--coverage"]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      ["build", "--test", "--coverage"],
      undefined,
    );
  });

  test("build", async () => {
    const stackCLI = new StackCLI([], false, exec);

    await stackCLI.build(["--coverage"]);

    expect(exec.exec).toHaveBeenCalledWith(
      "stack",
      ["build", "--coverage"],
      undefined,
    );
  });
});
