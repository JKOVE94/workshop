export interface AmenPoints {
  win: number;
  draw: number;
  loss: number;
}
export const DEFAULT_AMEN_POINTS: AmenPoints = { win: 3, draw: 1, loss: 0 };

export type Side = 'a' | 'b';

export interface AmenOutcome {
  winner: Side | 'draw';
  pointsA: number;
  pointsB: number;
}

/**
 * 한 경기 결과.
 * - failedSide가 있으면 그쪽이 즉시 패배 (성공 수와 무관).
 * - 없으면(시간 종료) 성공한 칭찬이 많은 쪽 승, 같으면 무승부.
 */
export function amenOutcome(successA: number, successB: number, failedSide: Side | null, pts: AmenPoints = DEFAULT_AMEN_POINTS): AmenOutcome {
  let winner: Side | 'draw';
  if (failedSide) winner = failedSide === 'a' ? 'b' : 'a';
  else if (successA > successB) winner = 'a';
  else if (successB > successA) winner = 'b';
  else winner = 'draw';
  if (winner === 'draw') return { winner, pointsA: pts.draw, pointsB: pts.draw };
  return winner === 'a' ? { winner, pointsA: pts.win, pointsB: pts.loss } : { winner, pointsA: pts.loss, pointsB: pts.win };
}

/** 순위: 점수 내림차순, 동점이면 tiebreak(성공 칭찬 수) 내림차순 */
export function rank<T extends { total: number; tiebreak?: number }>(rows: readonly T[]): T[] {
  return [...rows].sort((x, y) => y.total - x.total || (y.tiebreak ?? 0) - (x.tiebreak ?? 0));
}
