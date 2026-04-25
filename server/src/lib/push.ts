import { env } from "../env.js";
import { logger } from "../logger.js";
import { prisma } from "../db.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_REGEX = /^ExponentPushToken\[[A-Za-z0-9\-_]+\]$/;
const CHUNK_SIZE = 100;

export function isExpoPushToken(value: string) {
  return EXPO_TOKEN_REGEX.test(value.trim());
}

type PushPayload = {
  toUserId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function sendPushToUser(input: PushPayload): Promise<void> {
  if (!env.PUSH_NOTIFICATIONS_ENABLED) return;

  const rows = await prisma.pushToken.findMany({
    where: { userId: input.toUserId, disabledAt: null },
    select: { token: true },
  });
  const tokens = rows
    .map((r) => r.token.trim())
    .filter((token) => isExpoPushToken(token));
  if (tokens.length === 0) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (env.EXPO_PUSH_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${env.EXPO_PUSH_ACCESS_TOKEN}`;
  }

  for (const chunk of chunkTokens(tokens, CHUNK_SIZE)) {
    const messages = chunk.map((to) => ({
      to,
      sound: "default",
      priority: "high",
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        logger.warn(
          { status: res.status, statusText: res.statusText },
          "expo push send failed",
        );
        continue;
      }
      const payload = (await res.json()) as {
        data?: Array<{ status: "ok" | "error"; details?: { error?: string } }>;
      };
      const stale: string[] = [];
      for (let i = 0; i < (payload.data?.length ?? 0); i += 1) {
        const item = payload.data?.[i];
        if (item?.status !== "error") continue;
        if (item.details?.error === "DeviceNotRegistered") {
          const token = chunk[i];
          if (token) stale.push(token);
        }
      }
      if (stale.length > 0) {
        await prisma.pushToken.updateMany({
          where: { token: { in: stale } },
          data: { disabledAt: new Date() },
        });
      }
    } catch (err) {
      logger.warn({ err }, "expo push send exception");
    }
  }
}

function chunkTokens(tokens: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < tokens.length; i += size) {
    out.push(tokens.slice(i, i + size));
  }
  return out;
}
