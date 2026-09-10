import * as path from "path";
import { hashFiles } from "@actions/glob";

const ALL_SOURCES_PATTERNS = `**\n!**${path.sep}.stack-work\n!.git\n`;
const BUILD_FILES_PATTERNS = `**${path.sep}package.yaml\n**${path.sep}*.cabal\n`;

export type Hashes = {
  snapshot: string;
  package: string;
  sources: string;
};

export async function hashProject(stackYaml: string): Promise<Hashes> {
  return {
    snapshot: await hashFiles(stackYaml),
    package: await hashFiles(BUILD_FILES_PATTERNS),
    sources: await hashFiles(ALL_SOURCES_PATTERNS),
  };
}
