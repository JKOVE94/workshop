/** 팀 인원 중 최솟값 = 글자 수 N (0명 팀은 무시) */
export function letterCount(teamSizes: readonly number[]): number {
  const sizes = teamSizes.filter((s) => s > 0);
  return sizes.length ? Math.min(...sizes) : 0;
}

/**
 * 라운드 r의 말하는 순서. 출전자는 팀원 중 N명(라운드마다 한 칸씩 밀려 교대 출전),
 * 시작자는 r mod N 로 바뀐다.
 * 예) N=3, members=[a,b,c]: r0 a→b→c, r1 b→c→a, r2 c→a→b
 */
export function speakingOrder<T>(members: readonly T[], n: number, round: number): T[] {
  if (n <= 0 || members.length < n) return [];
  const m = members.length;
  // 출전자 창: 팀원이 N보다 많으면 라운드마다 창이 이동
  const offset = m > n ? (round * n) % m : 0;
  const players = Array.from({ length: n }, (_, i) => members[(offset + i) % m]);
  const start = round % n;
  return [...players.slice(start), ...players.slice(0, start)];
}

/** 한글 음절 단위 분해 (조합형 대비 NFC) */
export function letters(word: string): string[] {
  return Array.from(word.normalize('NFC').replace(/\s+/g, ''));
}

export function pickWord(words: readonly string[], n: number, round: number): string | null {
  const pool = words.filter((w) => letters(w).length === n);
  if (!pool.length) return null;
  return pool[round % pool.length];
}
