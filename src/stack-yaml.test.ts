import { parseStackYaml, getStackDirectories } from "./stack-yaml";
import { StackCLI } from "./stack-cli";

function mockStackCLI(stackRoot: string, stackPrograms: string): StackCLI {
  const stack = new StackCLI("stack.yaml", []);

  jest
    .spyOn(stack, "read")
    .mockImplementation((args: string[]): Promise<string> => {
      if (args[0] !== "path") {
        throw new Error("StackCLI.read() is only mocked for path");
      }

      switch (args[1]) {
        case "--stack-root":
          return Promise.resolve(stackRoot);
        case "--programs":
          return Promise.resolve(stackPrograms);
        default:
          throw new Error(
            "StackCLI.read(path) is only mocked for --stack-root or --programs",
          );
      }
    });

  return stack;
}

describe("getStackDirectories", () => {
  test("stackRoot, stackPrograms", async () => {
    const stackYaml = parseStackYaml("resolver: lts-22\n");
    const stack = mockStackCLI(
      "/home/me/.stack",
      "/home/me/.stack/programs/x86_64-linux",
    );

    const stackDirectories = await getStackDirectories(stackYaml, stack, "");

    expect(stackDirectories.stackRoot).toEqual("/home/me/.stack");
    expect(stackDirectories.stackPrograms).toEqual(
      "/home/me/.stack/programs/x86_64-linux",
    );
  });

  describe("stackWorks", () => {
    test("without packages", async () => {
      const stackYaml = parseStackYaml("resolver: lts-22\n");
      const stack = mockStackCLI("", "");

      const stackDirectories = await getStackDirectories(
        stackYaml,
        stack,
        "/home/me/code/project",
      );

      expect(stackDirectories.stackWorks).toEqual([
        "/home/me/code/project/.stack-work",
      ]);
    });

    test("with packages: [.]", async () => {
      const stackYaml = parseStackYaml("resolver: lts-22\npackages:\n- .");
      const stack = mockStackCLI("", "");

      const stackDirectories = await getStackDirectories(
        stackYaml,
        stack,
        "/home/me/code/project",
      );

      expect(stackDirectories.stackWorks).toEqual([
        "/home/me/code/project/.stack-work",
      ]);
    });

    test("with subpackages", async () => {
      const stackYaml = parseStackYaml(
        [
          "resolver: lts-22",
          "packages:",
          "  - subproject1",
          "  - subproject2",
        ].join("\n"),
      );
      const stack = mockStackCLI("", "");

      const stackDirectories = await getStackDirectories(
        stackYaml,
        stack,
        "/home/me/code/project",
      );

      expect(stackDirectories.stackWorks).toEqual([
        "/home/me/code/project/.stack-work",
        "/home/me/code/project/subproject1/.stack-work",
        "/home/me/code/project/subproject2/.stack-work",
      ]);
    });
  });
});
