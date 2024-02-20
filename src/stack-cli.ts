import * as fs from "fs";
import * as path from "path";
import { devNull } from "os";
import type { ExecOptions } from "@actions/exec";
import * as exec from "@actions/exec";

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
  public config: string;
  public resolver: string | null;

  private debug: boolean;
  private globalArgs: string[];

  constructor(args: string[], debug?: boolean) {
    this.debug = debug ?? false;
    this.globalArgs = args;

    // Capture --stack-yaml if given
    const stackYamlIdx = args.indexOf("--stack-yaml");
    const stackYamlArg = stackYamlIdx >= 0 ? args[stackYamlIdx + 1] : null;

    this.config = stackYamlArg ?? process.env.STACK_YAML ?? "stack.yaml";

    // Capture --resolver if given
    const resolverIdx = args.indexOf("--resolver");
    const resolverArg = resolverIdx >= 0 ? args[resolverIdx + 1] : null;

    this.resolver = resolverArg;

    // Infer nightly if not given
    if (!this.resolver && path.basename(this.config) === "stack-nightly.yaml") {
      this.resolver = "nightly";
      this.globalArgs.push("--resolver");
      this.globalArgs.push("nightly");
    }
  }

  async upgrade(): Promise<number> {
    // Avoid this.exec because we don't need/want globalArgs
    return await exec.exec("stack", ["upgrade"]);
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
    return await exec.exec("stack", this.globalArgs.concat(args), options);
  }
}
