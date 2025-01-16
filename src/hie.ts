import * as fs from "fs";
import * as core from "@actions/core";

import { StackCLI } from "./stack-cli";

export const HIE_YAML: string = "hie.yaml";

export class GenHIE {
  public readonly path: string;

  private readonly stack: StackCLI;
  private readonly exists: boolean;
  private installed: boolean;

  constructor(stack: StackCLI, path?: string) {
    this.stack = stack;
    this.path = path ? path : HIE_YAML;
    this.exists = fs.existsSync(this.path);
    this.installed = false;
  }

  async install(): Promise<void> {
    if (this.exists) {
      try {
        await this.stack.installCompilerTools(["implicit-hie"]);
        this.installed = true;
      } catch {
        core.warning(
          `Failed to install implicit-hie, ${this.path} will not be maintained`,
        );
      }
    }
  }

  async generate(): Promise<void> {
    if (this.exists && this.installed) {
      const contents = await this.stack.read([
        "exec",
        "--",
        "gen-hie",
        "--stack",
      ]);

      fs.writeFileSync(this.path, contents);
    }
  }
}
