import { parseGitStatus, isInterestingFile } from "./dirty-files";

describe("parseGitStatus", () => {
  test("parse file name, and filters untracked", () => {
    const paths = parseGitStatus(
      [
        "A  staged-file.rb",
        " M action.yml",
        " M src/inputs.ts",
        "?? src/new-file.ts",
        " M src/path with spaces.md",
      ].join("\n"),
    );

    expect(paths).toEqual([
      "staged-file.rb",
      "action.yml",
      "src/inputs.ts",
      "src/path with spaces.md",
    ]);
  });

  const empties = [
    ["empty", ""],
    ["newline", "\n"],
    ["spaces", " "],
    ["spaces+newline", " \n"],
  ];

  test.each(empties)("handles %s as no paths", (_arg, str) => {
    expect(parseGitStatus(str)).toEqual([]);
  });
});

describe("isInterestingFile", () => {
  const interesting = [
    "foo.cabal",
    "bar.cabal",
    "stack.yaml.lock",
    "stack-lts20.yaml.lock",
    "hie.yaml",
    "example/hie.yaml",
  ];

  test.each(interesting)("considers %p interesting", (path) => {
    expect(isInterestingFile(path)).toBe(true);
  });

  const uninteresting = [
    "some-file.md",
    "other file.txt",
    "foo.cabal.lock",
    "foo.yaml.lock2",
    "routhie.yaml",
  ];

  test.each(uninteresting)("considers %p uninteresting", (path) => {
    expect(isInterestingFile(path)).toBe(false);
  });
});
