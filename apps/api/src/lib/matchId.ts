// Utilities for public match ID handling (8-char base62)

export const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const MATCH_ID_REGEX = /^[a-zA-Z0-9]{8}$/;

export function isValidMatchId(s: string | undefined | null): s is string {
  return !!s && typeof s === 'string' && MATCH_ID_REGEX.test(s);
}

// Basic UUID v4-ish validator (compat for legacy routes)
export function isLikelyUuid(s: string | undefined | null): s is string {
  if (!s || typeof s !== 'string') return false;
  // 8-4-4-4-12 hex with dashes
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s);
}

export function generateMatchId(random: () => number = Math.random): string {
  let out = '';
  // 8 chars from base62
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor(random() * BASE62.length);
    out += BASE62[idx];
  }
  return out;
}
