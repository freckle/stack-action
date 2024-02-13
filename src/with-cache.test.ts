import * as core from "@actions/core";
import * as cache from "@actions/cache";

import { getCacheKeys } from "./get-cache-keys";
import { DEFAULT_CACHE_OPTIONS, withCache } from "./with-cache";

const restoreCacheMock = jest.spyOn(cache, "restoreCache");
jest.spyOn(cache, "saveCache");
jest.spyOn(core, "info");

async function testFunction(): Promise<number> {
  return 42;
}

async function testFunctionThrows(): Promise<number> {
  throw new Error("Boom");
}

function simulateCacheHit(
  _paths: string[],
  primaryKey: string,
  _restoreKeys?: string[],
): Promise<string | undefined> {
  return Promise.resolve(primaryKey);
}

function simulateCacheMiss(
  _paths: string[],
  primaryKey: string,
  _restoreKeys?: string[],
): Promise<string | undefined> {
  return Promise.resolve(primaryKey.replace(/-*$/, "-XXX"));
}

test("withCache skips on primary-key hit", async () => {
  const cachePaths = ["/a", "/b"];
  const cacheKeys = getCacheKeys(["a-b", "c", "d"]);
  restoreCacheMock.mockImplementation(simulateCacheHit);

  const result = await withCache(
    cachePaths,
    cacheKeys,
    testFunction,
    DEFAULT_CACHE_OPTIONS,
  );

  expect(result).toBeUndefined();
  expect(cache.restoreCache).toHaveBeenCalledWith(
    cachePaths,
    cacheKeys.primaryKey,
    cacheKeys.restoreKeys,
  );
  expect(cache.saveCache).not.toHaveBeenCalled();
});

test("withCache acts and saves if no primary-key hit", async () => {
  const cachePaths = ["/a", "/b"];
  const cacheKeys = getCacheKeys(["a-b", "c", "d"]);
  restoreCacheMock.mockImplementation(simulateCacheMiss);

  const result = await withCache(
    cachePaths,
    cacheKeys,
    testFunction,
    DEFAULT_CACHE_OPTIONS,
  );

  expect(result).toEqual(42);
  expect(cache.restoreCache).toHaveBeenCalledWith(
    cachePaths,
    cacheKeys.primaryKey,
    cacheKeys.restoreKeys,
  );
  expect(cache.saveCache).toHaveBeenCalledWith(
    cachePaths,
    cacheKeys.primaryKey,
  );
});

test("withCache can be configured to act and save anyway", async () => {
  const cachePaths = ["/a", "/b"];
  const cacheKeys = getCacheKeys(["a-b", "c", "d"]);
  restoreCacheMock.mockImplementation(simulateCacheHit);

  const result = await withCache(cachePaths, cacheKeys, testFunction, {
    ...DEFAULT_CACHE_OPTIONS,
    skipOnHit: false,
  });

  expect(result).toEqual(42);
  expect(cache.restoreCache).toHaveBeenCalledWith(
    cachePaths,
    cacheKeys.primaryKey,
    cacheKeys.restoreKeys,
  );

  // This step is still skipped
  expect(cache.saveCache).not.toHaveBeenCalled();
});

test("withCache does not save on error", async () => {
  const cachePaths = ["/a", "/b"];
  const cacheKeys = getCacheKeys(["a-b", "c", "d"]);
  restoreCacheMock.mockImplementation(simulateCacheMiss);

  await expect(async () => {
    await withCache(
      cachePaths,
      cacheKeys,
      testFunctionThrows,
      DEFAULT_CACHE_OPTIONS,
    );
  }).rejects.toThrow();

  expect(cache.restoreCache).toHaveBeenCalledWith(
    cachePaths,
    cacheKeys.primaryKey,
    cacheKeys.restoreKeys,
  );

  // This step is skipped
  expect(cache.saveCache).not.toHaveBeenCalled();
});

test("withCache can be configured to save on error", async () => {
  const cachePaths = ["/a", "/b"];
  const cacheKeys = getCacheKeys(["a-b", "c", "d"]);
  restoreCacheMock.mockImplementation(simulateCacheMiss);

  await expect(async () => {
    await withCache(cachePaths, cacheKeys, testFunctionThrows, {
      ...DEFAULT_CACHE_OPTIONS,
      saveOnError: true,
    });
  }).rejects.toThrow();

  expect(cache.restoreCache).toHaveBeenCalledWith(
    cachePaths,
    cacheKeys.primaryKey,
    cacheKeys.restoreKeys,
  );

  expect(cache.saveCache).toHaveBeenCalledWith(
    cachePaths,
    cacheKeys.primaryKey,
  );
});
