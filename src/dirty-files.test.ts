import { parseGitStatus, isInterestingFile } from "./dirty-files";

describe("parseGitStatus", () => {
  test("parse file names", () => {
    const paths = parseGitStatus(
      [
        "A  new-file.rb",
        " M action.yml",
        " M src/inputs.ts",
        "?? src/dirty-files.ts",
        " M src/path with spaces.md",
      ].join("\n"),
    );

    expect(paths).toEqual([
      "new-file.rb",
      "action.yml",
      "src/inputs.ts",
      "src/dirty-files.ts",
      "src/path with spaces.md",
    ]);
  });
});

describe("isInterestingFile", () => {
  const interesting = [
    "foo.cabal",
    "bar.cabal",
    "stack.yaml.lock",
    "stack-lts20.yaml.lock",
  ];

  test.each(interesting)("considers %p interesting", (path) => {
    expect(isInterestingFile(path)).toBe(true);
  });

  const uninteresting = [
    "some-file.md",
    "other file.txt",
    "foo.cabal.lock",
    "foo.yaml.lock2",
  ];

  test.each(uninteresting)("considers %p uninteresting", (path) => {
    expect(isInterestingFile(path)).toBe(false);
  });
});
