import type { StepKind } from '../types';

export const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];
export const TEAM_NAMES = ['A팀', 'B팀', 'C팀', 'D팀', 'E팀'];

/** 허밍 팀 찾기 곡 (고정). 곡 수 = 팀 수 */
export const HUM_SONGS = ['좋으신 하나님 (You Are Good)', '감사함으로', '내 마음을 가득 채운'];

/** 게임별 승리 점수 기본값 (관리자 화면에서 수정 가능) */
export const DEFAULT_WIN_POINTS: Record<string, number> = { amen: 10, one_voice: 10, sheep_voice: 20 };
export const GAME_KINDS = ['amen', 'one_voice', 'sheep_voice'] as const;

export const ONE_VOICE_WORDS = [
  '모세', '다윗', '요나', '이삭', '야곱', '에스더', '룻',
  '베드로', '갈릴리', '여호와', '다니엘', '사무엘', '스데반', '바울이',
  '아브라함', '예루살렘', '오병이어', '십자가상', '골리앗왕',
  '예수그리스', '하나님나라',
];

export const DEFAULT_STEPS: { kind: StepKind; title: string; config: Record<string, any>; state?: Record<string, any> }[] = [
  { kind: 'entry', title: '입장', config: {} },
  { kind: 'roster_close', title: '1부 명단 마감', config: {} },
  { kind: 'hum_team', title: '허밍으로 팀 찾기', config: { timerSeconds: 180 } },
  { kind: 'team_board', title: '팀 현황판', config: {} },
  {
    kind: 'amen',
    title: '아멘 게임',
    config: {
      points: { win: 3, draw: 1, loss: 0 },
      dupMode: 'figure_trait', // 'figure_trait' | 'trait_only'
      failEndsMatch: true,
      turnSeconds: 5,
      matchSeconds: 120,
      winPoints: 10,
    },
  },
  { kind: 'one_voice', title: '한마음과 한 입으로', config: { words: ONE_VOICE_WORDS, pointsPerSuccess: 1, letterMode: true, winPoints: 10 } },
  { kind: 'sheep_voice', title: '내 양은 내 음성을 들으며', config: { correct: 1, wrong: -1, winPoints: 20 } },
  { kind: 'awards', title: '시상식', config: {} },
];
