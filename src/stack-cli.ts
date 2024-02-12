import * as fs from "fs";
import { devNull } from "os";
import type { ExecOptions } from "@actions/exec";
import * as realExec from "@actions/exec";

import type { StackPath } from "./parse-stack-path";
import { parseStackPath } from "./parse-stack-path";
import type { StackQuery } from "./parse-stack-query";
import { parseStackQuery } from "./parse-stack-query";

export interface ExecDelegate {
  exec: (
    command: string,
    args: string[],
    options?: ExecOptions,
  ) => Promise<number>;
}

export class StackCLI {
  private debug: boolean;
  private globalArgs: string[];
  private execDelegate: ExecDelegate;

  constructor(
    stackYaml: string,
    args: string[],
    debug?: boolean,
    execDelegate?: ExecDelegate,
  ) {
    this.debug = debug ?? false;
    this.execDelegate = execDelegate ?? realExec;
    const resolverArgs =
      stackYaml.endsWith("stack-nightly.yaml") && !args.includes("--resolver")
        ? ["--resolver", "nightly"]
        : [];

    this.globalArgs = ["--stack-yaml", stackYaml]
      .concat(resolverArgs)
      .concat(args);
  }

  async upgrade(): Promise<number> {
    // Skip this.exec because we don't need/want globalArgs
    return await this.execDelegate.exec("stack", ["upgrade"]);
  }

  async setup(args: string[]): Promise<number> {
    return await this.exec(["setup"].concat(args));
  }

  async buildDependencies(args: string[]): Promise<number> {
    return await this.buildNoTest(["--dependencies-only"].concat(args));
  }

  async buildNoTest(args: string[]): Promise<number> {
    return await this.build(["--test", "--no-run-tests"].concat(args));
  }

  async buildTest(args: string[]): Promise<number> {
    return await this.build(["--test"].concat(args));
  }

  async build(args: string[]): Promise<number> {
    return await this.exec(["build"].concat(args));
  }

  async path(): Promise<StackPath> {
    return await this.parse(["path"], parseStackPath);
  }

  async query(): Promise<StackQuery> {
    return await this.parse(["query"], parseStackQuery);
  }

  async parse<A>(args: string[], f: (stdout: string) => A): Promise<A> {
    const stdout = await this.read(args);
    return f(stdout);
  }

  async read(args: string[]): Promise<string> {
    let stdout = "";

    const options: ExecOptions = {
      listeners: {
        stdout: (data: Buffer) => {
          stdout += data.toString();
        },
      },
    };

    if (!this.debug) {
      // If not debugging, hide the output being read
      options.outStream = fs.createWriteStream(devNull);
    }

    await this.exec(args, options);
    return stdout;
  }

  private async exec(args: string[], options?: ExecOptions): Promise<number> {
    return await this.execDelegate.exec(
      "stack",
      this.globalArgs.concat(args),
      options,
    );
  }
}
