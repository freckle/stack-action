import { getCacheKeys } from "./get-cache-keys";
import { DEFAULT_CACHE_OPTIONS, withCache } from "./with-cache";

const core = {
  info: jest.fn(),
};

const cache = {
  restoreCache: jest.fn(),
  saveCache: jest.fn(),
};

const TEST_CACHE_OPTIONS = {
  ...DEFAULT_CACHE_OPTIONS,
  coreDelegate: core,
  cacheDelegate: cache,
};

async function testFunction(): Promise<number> {
  return 42;
}

async function testFunctionThrows(): Promise<number> {
  throw new Error("Boom");
}

function simulateCacheHit(
  _paths: string[],
  primaryKey: string,
  _restoreKeys: string[],
): string {
  return primaryKey;
}

function simulateCacheMiss(
  _paths: string[],
  primaryKey: string,
  _restoreKeys: string[],
): string {
  return primaryKey.replace(/-*$/, "-XXX");
}

test("withCache skips on primary-key hit", async () => {
  const cachePaths = ["/a", "/b"];
  const cacheKeys = getCacheKeys(["a-b", "c", "d"]);
  cache.restoreCache.mockImplementation(simulateCacheHit);

  const result = await withCache(
    cachePaths,
    cacheKeys,
    testFunction,
    TEST_CACHE_OPTIONS,
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
  cache.restoreCache.mockImplementation(simulateCacheMiss);

  const result = await withCache(
    cachePaths,
    cacheKeys,
    testFunction,
    TEST_CACHE_OPTIONS,
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
  cache.restoreCache.mockImplementation(simulateCacheHit);

  const result = await withCache(cachePaths, cacheKeys, testFunction, {
    ...TEST_CACHE_OPTIONS,
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
  cache.restoreCache.mockImplementation(simulateCacheMiss);

  await expect(async () => {
    await withCache(
      cachePaths,
      cacheKeys,
      testFunctionThrows,
      TEST_CACHE_OPTIONS,
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
  cache.restoreCache.mockImplementation(simulateCacheMiss);

  await expect(async () => {
    await withCache(cachePaths, cacheKeys, testFunctionThrows, {
      ...TEST_CACHE_OPTIONS,
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
