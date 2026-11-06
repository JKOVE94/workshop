import { describe, expect, it } from 'vitest';
import { shuffle, splitEvenly, smallestGroup } from '../balance';
import { leagueMatches, usedPlayers } from '../league';
import { isDuplicateTrait } from '../traits';
import { amenOutcome, rank } from '../scoring';
import { letterCount, speakingOrder, pickWord, letters } from '../oneVoice';

describe('balance', () => {
  it('13명을 3팀으로 5/4/4', () => {
    const g = splitEvenly(Array.from({ length: 13 }, (_, i) => i), 3);
    expect(g.map((x) => x.length).sort()).toEqual([4, 4, 5]);
    expect(g.flat().sort((a, b) => a - b)).toEqual(Array.from({ length: 13 }, (_, i) => i));
  });
  it('shuffle은 원본을 바꾸지 않는다', () => {
    const src = [1, 2, 3];
    shuffle(src);
    expect(src).toEqual([1, 2, 3]);
  });
  it('smallestGroup', () => expect(smallestGroup([5, 4, 4])).toBe(1));
});

describe('league', () => {
  it('3팀 → 3경기', () => expect(leagueMatches(['A', 'B', 'C'])).toEqual([['A', 'B'], ['A', 'C'], ['B', 'C']]));
  it('이미 출전한 사람 집합', () => {
    const ms = [
      { id: 'm1', team_a: 'A', team_b: 'B', player_a: 'a1', player_b: 'b1' },
      { id: 'm2', team_a: 'A', team_b: 'C', player_a: null, player_b: 'c1' },
    ];
    expect([...usedPlayers(ms, 'A')]).toEqual(['a1']);
    expect([...usedPlayers(ms, 'A', 'm1')]).toEqual([]);
  });
});

describe('traits', () => {
  const hist = [{ figure: '다니엘', trait: '용감한' }];
  it('같은 인물+특성은 중복', () => expect(isDuplicateTrait(hist, { figure: '다니엘', trait: '용감한' })).toBe(true));
  it('같은 인물 다른 특성은 허용', () => expect(isDuplicateTrait(hist, { figure: '다니엘', trait: '리더십 뛰어난' })).toBe(false));
  it('인물이 다르면 기본 모드에서 허용', () => expect(isDuplicateTrait(hist, { figure: '다윗', trait: '용감한' })).toBe(false));
  it('trait_only 모드는 인물 달라도 중복', () => expect(isDuplicateTrait(hist, { figure: '다윗', trait: '용감한' }, 'trait_only')).toBe(true));
  it('공백·어미 차이를 흡수', () => expect(isDuplicateTrait(hist, { figure: '다니엘', trait: ' 용감 ' })).toBe(true));
});

describe('scoring', () => {
  it('성공 수 비교', () => expect(amenOutcome(3, 1, null)).toEqual({ winner: 'a', pointsA: 3, pointsB: 0 }));
  it('무승부', () => expect(amenOutcome(2, 2, null)).toEqual({ winner: 'draw', pointsA: 1, pointsB: 1 }));
  it('실패하면 즉시 패배', () => expect(amenOutcome(5, 0, 'a')).toEqual({ winner: 'b', pointsA: 0, pointsB: 3 }));
  it('동점이면 tiebreak', () => {
    const r = rank([{ id: 1, total: 3, tiebreak: 2 }, { id: 2, total: 3, tiebreak: 5 }, { id: 3, total: 4 }]);
    expect(r.map((x) => x.id)).toEqual([3, 2, 1]);
  });
});

describe('oneVoice', () => {
  it('N은 최소 팀 인원', () => expect(letterCount([3, 4, 4])).toBe(3));
  it('0명 팀은 무시', () => expect(letterCount([0, 4])).toBe(4));
  it('말하는 순서가 라운드마다 회전', () => {
    const m = ['a', 'b', 'c'];
    expect(speakingOrder(m, 3, 0)).toEqual(['a', 'b', 'c']);
    expect(speakingOrder(m, 3, 1)).toEqual(['b', 'c', 'a']);
    expect(speakingOrder(m, 3, 2)).toEqual(['c', 'a', 'b']);
    expect(speakingOrder(m, 3, 3)).toEqual(['a', 'b', 'c']);
  });
  it('팀원이 N보다 많으면 출전자가 교대', () => {
    const m = ['a', 'b', 'c', 'd'];
    expect(speakingOrder(m, 3, 0)).toEqual(['a', 'b', 'c']);
    expect(new Set(speakingOrder(m, 3, 1))).toEqual(new Set(['d', 'a', 'b']));
  });
  it('팀원이 부족하면 빈 배열', () => expect(speakingOrder(['a'], 3, 0)).toEqual([]));
  it('글자 수에 맞는 단어', () => {
    expect(pickWord(['베드로', '모세', '갈릴리'], 3, 0)).toBe('베드로');
    expect(pickWord(['베드로', '모세', '갈릴리'], 3, 1)).toBe('갈릴리');
    expect(pickWord(['모세'], 3, 0)).toBeNull();
    expect(letters('베 드로')).toEqual(['베', '드', '로']);
  });
});
