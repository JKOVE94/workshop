/** 풀리그 대진: 3팀이면 A-B, A-C, B-C */
export function leagueMatches<T>(teams: readonly T[]): [T, T][] {
  const out: [T, T][] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) out.push([teams[i], teams[j]]);
  }
  return out;
}

/**
 * 팀이 이미 다른 경기에 출전시킨 사람 id 집합.
 * 한 사람이 두 경기에 나올 수 없다.
 */
export function usedPlayers(
  matches: readonly { id: string; team_a: string; team_b: string; player_a: string | null; player_b: string | null }[],
  teamId: string,
  exceptMatchId?: string,
): Set<string> {
  const used = new Set<string>();
  for (const m of matches) {
    if (m.id === exceptMatchId) continue;
    if (m.team_a === teamId && m.player_a) used.add(m.player_a);
    if (m.team_b === teamId && m.player_b) used.add(m.player_b);
  }
  return used;
}
