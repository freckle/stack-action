import * as fs from "fs";
import * as core from "@actions/core";

import { StackCLI } from "./stack-cli";

export const HIE_YAML: string = "hie.yaml";

export class GenHIE {
  public readonly path: string;

  private readonly stack: StackCLI;
  private readonly exists: boolean;

  constructor(stack: StackCLI, path?: string) {
    this.stack = stack;
    this.path = path ? path : HIE_YAML;
    this.exists = fs.existsSync(this.path);
  }

  async install(): Promise<void> {
    if (this.exists) {
      try {
        await this.stack.installCompilerTools(["implicit-hie"]);
      } catch {
        core.warning(
          `Failed to install implicit-hie, ${this.path} will not be maintained`,
        );
      }
    }
  }

  async generate(): Promise<void> {
    if (!this.exists) {
      core.info(`Skipping, ${this.path} does not exist`);
      return;
    }

    const installed = await this.stack.which("gen-hie");

    if (!installed) {
      core.info(`Skipping, implicit-hie was not successfully installed`);
      return;
    }

    core.info(`gen-hie --stack > ${this.path}`);
    const yaml = await this.stack.read(["exec", "--", "gen-hie", "--stack"]);
    fs.writeFileSync(this.path, yaml);
  }
}
