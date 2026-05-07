"use server";

import { auth } from "@/auth";

const rateLimitStore = new Map<string, { attempts: number; lastTry: number; blockedUntil?: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const now = Date.now();
  const windowStart = now - WINDOW_MINUTES * 60 * 1000;

  let record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, { attempts: 1, lastTry: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    return { allowed: false, remainingAttempts: 0 };
  }

  if (record.lastTry < windowStart) {
    record = { attempts: 1, lastTry: now };
    rateLimitStore.set(identifier, record);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  const newAttempts = record.attempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    const blockedUntil = now + WINDOW_MINUTES * 60 * 1000;
    record = { attempts: newAttempts, lastTry: now, blockedUntil };
    rateLimitStore.set(identifier, record);
    return { allowed: false, remainingAttempts: 0 };
  }

  record.attempts = newAttempts;
  record.lastTry = now;
  rateLimitStore.set(identifier, record);

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - newAttempts };
}

export async function resetRateLimit(identifier: string): Promise<void> {
  rateLimitStore.delete(identifier);
}