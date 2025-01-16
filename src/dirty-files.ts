import * as core from "@actions/core";
import * as exec from "@actions/exec";

export type OnDirtyFiles = "warn" | "error";

export function parseOnDirtyFiles(input: string): OnDirtyFiles {
  switch (input) {
    case "warn":
    case "error":
      return input as OnDirtyFiles;
    default:
      throw new Error(
        `Invalid on-dirty-files, must be warn or error, saw: ${input}`,
      );
  }
}

export async function checkDirtyFiles(onDirtyFiles: OnDirtyFiles) {
  const stdout = await readGitStatus();
  const paths = parseGitStatus(stdout).filter(isInterestingFile);

  if (paths.length === 0) {
    return;
  }

  const message = `Build caused changes to ${paths.join(", ")}`;

  switch (onDirtyFiles) {
    case "warn":
      core.warning(message);
      break;
    case "error":
      throw new Error(message);
  }
}

async function readGitStatus(): Promise<string> {
  let stdout = "";

  const options: exec.ExecOptions = {
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
    },
    ignoreReturnCode: true,
  };

  await exec.exec("git", ["status", "--porcelain"], options);

  return stdout;
}

// Exported for testing
export function parseGitStatus(stdout: string): string[] {
  return stdout
    .split("\n")
    .filter((path) => {
      // We don't care about untracked files because users may be choosing not
      // to commit generated files -- in which case it showing up here is
      // expected.
      return !path.startsWith("??");
    })
    .map((path) => {
      // Drop leading space, split on space, drop first column and rejoin
      return path.replace(/^\s*/, "").split(/\s+/).slice(1).join(" ");
    })
    .filter((path) => {
      return path.trim() !== "";
    });
}

const INTERESTING_REGEXPS: RegExp[] = [
  /^.*\.cabal$/,
  /^.*\.yaml\.lock$/,
  /^(.*\/)?hie\.yaml$/,
];

// Exported for testing
export function isInterestingFile(path: string): boolean {
  return INTERESTING_REGEXPS.some((re, _index, _array) => {
    return path.match(re);
  });
}
