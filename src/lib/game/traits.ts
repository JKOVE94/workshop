export type DupMode = 'figure_trait' | 'trait_only';

/** 공백 제거 + 소문자 + 흔한 어미 제거로 느슨하게 비교 */
export function norm(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase().replace(/(한|운|인|적인|스러운|있는)$/u, '');
}

export interface TraitKey {
  figure: string;
  trait: string;
}

/**
 * 특성 중복 판정.
 * - figure_trait: 같은 인물 + 같은 특성만 중복 (기본)
 * - trait_only: 인물이 달라도 특성이 같으면 중복
 */
export function isDuplicateTrait(history: readonly TraitKey[], next: TraitKey, mode: DupMode = 'figure_trait'): boolean {
  const t = norm(next.trait);
  const f = norm(next.figure);
  if (!t) return false;
  return history.some((h) => {
    if (norm(h.trait) !== t) return false;
    return mode === 'trait_only' ? true : norm(h.figure) === f;
  });
}
