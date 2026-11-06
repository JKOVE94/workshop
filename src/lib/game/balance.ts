/** 배열을 섞는다 (Fisher-Yates). rng 주입으로 테스트 가능. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 균등 분배: 인원 차이는 최대 1. 예) 13명/3팀 → 5/4/4 */
export function splitEvenly<T>(items: readonly T[], groups: number, rng: () => number = Math.random): T[][] {
  if (groups < 1) throw new Error('groups must be >= 1');
  const out: T[][] = Array.from({ length: groups }, () => []);
  shuffle(items, rng).forEach((it, i) => out[i % groups].push(it));
  return out;
}

/** 가장 인원이 적은 팀 인덱스 (동률이면 앞쪽) */
export function smallestGroup(sizes: readonly number[]): number {
  let best = 0;
  sizes.forEach((s, i) => {
    if (s < sizes[best]) best = i;
  });
  return best;
}
