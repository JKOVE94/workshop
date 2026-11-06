import { randomBytes } from 'node:crypto';

export interface ParsedCard {
  word: string;
  isTrap: boolean;
}

/** 줄 단위 입력. 앞에 `*`가 붙으면 함정 단어. 빈 줄·중복 제거. */
export function parseCardWords(text: string): ParsedCard[] {
  const seen = new Set<string>();
  const out: ParsedCard[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const isTrap = line.startsWith('*');
    const word = (isTrap ? line.slice(1) : line).trim();
    if (!word || seen.has(word)) continue;
    seen.add(word);
    out.push({ word, isTrap });
  }
  return out;
}

export function newToken(): string {
  return randomBytes(9).toString('base64url');
}
