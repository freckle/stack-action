export type CacheKeys = {
  primaryKey: string;
  restoreKeys: string[];
};

export function getCacheKeys(parts: string[]): CacheKeys {
  const primaryKey = parts.join("-");
  const restoreKeys: string[] = [];

  let restoreParts = parts.slice(0, -1);

  while (restoreParts.length > 0) {
    restoreKeys.push(`${restoreParts.join("-")}-`);
    restoreParts = restoreParts.slice(0, -1);
  }

  return { primaryKey, restoreKeys };
}
