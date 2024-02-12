const REGEXP = new RegExp("\\$([A-Z_]+)|\\$\\{([A-Z_]+)\\}");

function replacer(_match: string, p1: string, p2: string): string {
  return process.env[p2 ?? p1] ?? "";
}

/* replace environment variables in an input string, like envsubst(1) */
export function envsubst(str: string): string {
  return str.replace(REGEXP, replacer);
}
