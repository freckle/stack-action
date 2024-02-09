import { parseStackQuery } from "./parse-stack-query";

const EXAMPLE = [
  "compiler:",
  "  actual: ghc-9.2.7",
  "  wanted: ghc-9.2.7",
  "locals:",
  "  core:",
  "    path: /home/patrick/code/freckle/megarepo/backend/core/",
  "    version: 0.0.0",
  "  entities:",
  "    path: /home/patrick/code/freckle/megarepo/backend/entities/",
  "    version: 0.0.0",
  "  fancy-api:",
  "    path: /home/patrick/code/freckle/megarepo/backend/fancy-api/",
  "    version: 0.0.0",
].join("\n");

test("parseStackQuery", () => {
  const stackQuery = parseStackQuery(EXAMPLE);
  expect(stackQuery.compiler.actual).toBe("ghc-9.2.7");
  expect(stackQuery.compiler.wanted).toBe("ghc-9.2.7");
});
