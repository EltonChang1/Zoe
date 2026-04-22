/**
 * Short relative time used in editorial chrome ("3h", "2d", "just now").
 * Intentionally coarse — the editorial style avoids precise clock chatter.
 */
export function formatRelativeTime(iso: string | Date, now: Date = new Date()): string {
  const then = iso instanceof Date ? iso : new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  if (Number.isNaN(diffMs)) return "";
  const diffS = Math.max(0, Math.floor(diffMs / 1000));
  if (diffS < 45) return "just now";
  const diffMin = Math.floor(diffS / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  const diffW = Math.floor(diffD / 7);
  if (diffW < 5) return `${diffW}w`;
  const diffMo = Math.floor(diffD / 30);
  if (diffMo < 12) return `${diffMo}mo`;
  const diffY = Math.floor(diffD / 365);
  return `${diffY}y`;
}
