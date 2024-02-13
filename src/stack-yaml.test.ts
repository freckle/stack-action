import { parseStackYaml, getStackDirectories } from "./stack-yaml";
import { StackCLI } from "./stack-cli";

describe("getStackDirectories", () => {
  test("without packages", async () => {
    const stackYaml = parseStackYaml("resolver: lts-22\n");
    const stack = new StackCLI("stack.yaml", []);

    jest
      .spyOn(stack, "read")
      .mockImplementation((_args: string[]): Promise<string> => {
        return Promise.resolve("/home/me/.stack");
      });

    const stackDirectories = await getStackDirectories(
      stackYaml,
      stack,
      "/home/me/code/project",
    );

    expect(stackDirectories.stackRoot).toEqual("/home/me/.stack");
    expect(stackDirectories.stackWorks).toEqual([
      "/home/me/code/project/.stack-work",
    ]);
  });

  test("with packages: [.]", async () => {
    const stackYaml = parseStackYaml("resolver: lts-22\npackages:\n- .");
    const stack = new StackCLI("stack.yaml", []);

    jest
      .spyOn(stack, "read")
      .mockImplementation((_args: string[]): Promise<string> => {
        return Promise.resolve("/home/me/.stack");
      });

    const stackDirectories = await getStackDirectories(
      stackYaml,
      stack,
      "/home/me/code/project",
    );

    expect(stackDirectories.stackRoot).toEqual("/home/me/.stack");
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
    const stack = new StackCLI("stack.yaml", []);

    jest
      .spyOn(stack, "read")
      .mockImplementation((_args: string[]): Promise<string> => {
        return Promise.resolve("/home/me/.stack");
      });

    const stackDirectories = await getStackDirectories(
      stackYaml,
      stack,
      "/home/me/code/project",
    );

    expect(stackDirectories.stackRoot).toEqual("/home/me/.stack");
    expect(stackDirectories.stackWorks).toEqual([
      "/home/me/code/project/.stack-work",
      "/home/me/code/project/subproject1/.stack-work",
      "/home/me/code/project/subproject2/.stack-work",
    ]);
  });
});
