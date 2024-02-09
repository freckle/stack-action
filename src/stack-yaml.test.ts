import { parseStackYaml, packagesStackWorks } from "./stack-yaml";

test("packageStackWorks with no packages", () => {
  const stackYaml = parseStackYaml("resolver: lts-22\n");

  expect(packagesStackWorks(stackYaml, "/home/project")).toEqual([
    "/home/project/.stack-work",
  ]);
});

test("packageStackWorks with default . as packages", () => {
  const stackYaml = parseStackYaml("resolver: lts-22\npackages:\n- .");

  expect(packagesStackWorks(stackYaml, "/home/project")).toEqual([
    "/home/project/.stack-work",
  ]);
});

test("packageStackWorks with sub-packages", () => {
  const stackYaml = parseStackYaml(
    [
      "resolver: lts-22",
      "packages:",
      "  - subproject1",
      "  - subproject2",
    ].join("\n"),
  );

  expect(packagesStackWorks(stackYaml, "/home/project")).toEqual([
    "/home/project/.stack-work",
    "/home/project/subproject1/.stack-work",
    "/home/project/subproject2/.stack-work",
  ]);
});

test("packageStackWorks with . and sub-packages", () => {
  const stackYaml = parseStackYaml(
    [
      "resolver: lts-22",
      "packages:",
      "  - .",
      "  - subproject1",
      "  - subproject2",
    ].join("\n"),
  );

  expect(packagesStackWorks(stackYaml, "/home/project")).toEqual([
    "/home/project/.stack-work",
    "/home/project/subproject1/.stack-work",
    "/home/project/subproject2/.stack-work",
  ]);
});
