import { jest } from "@jest/globals";

import { getCacheKeys } from "./get-cache-keys.js";

test("getCacheKeys", () => {
  const keys = getCacheKeys(["prefix-os-compiler", "package", "source"]);

  expect(keys.primaryKey).toEqual("prefix-os-compiler-package-source");
  expect(keys.restoreKeys).toEqual([
    "prefix-os-compiler-package-",
    "prefix-os-compiler-",
  ]);
});
