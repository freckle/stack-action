import { parseStackYaml, getStackDirectories } from "./stack-yaml";
import { StackCLI } from "./stack-cli";

const testStackRoot = "/home/me/.stack";
const testPrograms = `${testStackRoot}/programs/x86_64-linux`;
const testStackPathYaml = `
stack-root: ${testStackRoot}
programs: ${testPrograms}
`;

function mockStackCLI(): StackCLI {
  const stack = new StackCLI([]);

  jest
    .spyOn(stack, "read")
    .mockImplementation((args: string[]): Promise<string> => {
      // Stringify to avoid array-comparison pitfalls
      const expected = ["path", "--stack-root", "--programs"].toString();
      const given = args.toString();

      if (given !== expected) {
        throw new Error(
          `StackCLI.read() is only mocked for ${expected}, saw ${given}`,
        );
      }

      return Promise.resolve(testStackPathYaml);
    });

  return stack;
}

describe("getStackDirectories", () => {
  test("stackRoot, stackPrograms", async () => {
    const stackYaml = parseStackYaml("resolver: lts-22\n");
    const stack = mockStackCLI();

    const stackDirectories = await getStackDirectories(stackYaml, stack, "");

    expect(stackDirectories.stackRoot).toEqual(testStackRoot);
    expect(stackDirectories.stackPrograms).toEqual(testPrograms);
  });

  describe("stackWorks", () => {
    test("without packages", async () => {
      const stackYaml = parseStackYaml("resolver: lts-22\n");
      const stack = mockStackCLI();

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
      const stack = mockStackCLI();

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
      const stack = mockStackCLI();

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
