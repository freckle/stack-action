import { getCacheKeys } from "./get-cache-keys";

test("getCacheKeys", () => {
  const keys = getCacheKeys(["prefix-os-compiler", "package", "source"]);

  expect(keys.primaryKey).toEqual("prefix-os-compiler-package-source");
  expect(keys.restoreKeys).toEqual([
    "prefix-os-compiler-package-",
    "prefix-os-compiler-",
  ]);
});
