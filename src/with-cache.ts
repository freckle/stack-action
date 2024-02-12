import * as core from "@actions/core";
import * as cache from "@actions/cache";
import type { CacheKeys } from "./get-cache-keys";

export type CacheOptions = {
  skipOnHit: boolean;
  saveOnError: boolean;
};

export const DEFAULT_CACHE_OPTIONS = {
  skipOnHit: true,
  saveOnError: false,
};

export async function withCache<T>(
  paths: string[],
  keys: CacheKeys,
  fn: () => Promise<T>,
  options: CacheOptions = DEFAULT_CACHE_OPTIONS,
): Promise<T | undefined> {
  const { skipOnHit, saveOnError } = options;

  core.info(`Cached paths:\n - ${paths.join("\n - ")}`);
  core.info(`Cache key: ${keys.primaryKey}`);
  core.info(`Cache restore keys:\n - ${keys.restoreKeys.join("\n - ")}`);

  const restoredKey = await cache.restoreCache(
    paths,
    keys.primaryKey,
    keys.restoreKeys,
  );

  const primaryKeyHit = restoredKey == keys.primaryKey;

  if (restoredKey) {
    core.info(`Cache restored from key: ${restoredKey}`);
  } else {
    core.warning("No cache found");
  }

  if (primaryKeyHit && skipOnHit && !saveOnError) {
    core.info("Skipping due to primary key hit");
    return;
  }

  let result: T;

  try {
    result = await fn();

    if (!primaryKeyHit) {
      await cache.saveCache(paths, keys.primaryKey);
    }
  } catch (ex) {
    if (saveOnError && !primaryKeyHit) {
      await cache.saveCache(paths, keys.primaryKey);
    }

    throw ex;
  }

  return result;
}
