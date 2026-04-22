/**
 * Minimal className joiner for NativeWind.
 * Accepts strings, falsy values, and arrays; trims + collapses whitespace.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
