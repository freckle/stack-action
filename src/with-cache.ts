import * as core from "@actions/core";
import * as cache from "@actions/cache";
import type { CacheKeys } from "./get-cache-keys";

export interface CoreDelegate {
  info: (msg: string) => void;
}

export interface CacheDelegate {
  restoreCache: (
    paths: string[],
    primaryKey: string,
    restoreKeys: string[],
  ) => Promise<string | undefined>;
  saveCache: (paths: string[], primaryKey: string) => Promise<number>;
}

export type CacheOptions = {
  skipOnHit: boolean;
  coreDelegate: CoreDelegate;
  cacheDelegate: CacheDelegate;
};

export const DEFAULT_CACHE_OPTIONS = {
  skipOnHit: true,
  coreDelegate: core,
  cacheDelegate: cache,
};

// TODO: unit tests (the reason for the delegate options)
export async function withCache<T>(
  paths: string[],
  keys: CacheKeys,
  fn: () => Promise<T>,
  options: CacheOptions = DEFAULT_CACHE_OPTIONS,
): Promise<T | undefined> {
  const { skipOnHit, coreDelegate, cacheDelegate } = options;

  coreDelegate.info(`Paths:\n - ${paths.join("\n - ")}`);
  coreDelegate.info(`Primary key: ${keys.primaryKey}`);
  coreDelegate.info(`Restore keys:\n - ${keys.restoreKeys.join("\n - ")}`);

  const restoredKey = await cacheDelegate.restoreCache(
    paths,
    keys.primaryKey,
    keys.restoreKeys,
  );

  const primaryKeyHit = restoredKey == keys.primaryKey;
  coreDelegate.info(`Restored key: ${restoredKey ?? "<none>"}`);

  if (primaryKeyHit && skipOnHit) {
    coreDelegate.info("Skipping due to primary key hit");
    return;
  }

  let result: T;

  try {
    result = await fn();
  } finally {
    if (!primaryKeyHit) {
      await cacheDelegate.saveCache(paths, keys.primaryKey);
    }
  }

  return result;
}
