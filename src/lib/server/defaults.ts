import type { StepKind } from '../types';

export const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];
export const TEAM_NAMES = ['A팀', 'B팀', 'C팀', 'D팀', 'E팀'];

export const ONE_VOICE_WORDS = [
  '모세', '다윗', '요나', '이삭', '야곱', '에스더', '룻',
  '베드로', '갈릴리', '여호와', '다니엘', '사무엘', '스데반', '바울이',
  '아브라함', '예루살렘', '오병이어', '십자가상', '골리앗왕',
  '예수그리스', '하나님나라',
];

export const DEFAULT_STEPS: { kind: StepKind; title: string; config: Record<string, any>; state?: Record<string, any> }[] = [
  { kind: 'entry', title: '입장', config: {} },
  { kind: 'roster_close', title: '1부 명단 마감', config: {} },
  { kind: 'hum_team', title: '허밍으로 팀 찾기', config: { songs: ['곡 1 (수정하세요)', '곡 2 (수정하세요)', '곡 3 (수정하세요)'], timerSeconds: 180 } },
  {
    kind: 'amen',
    title: '아멘 게임',
    config: {
      points: { win: 3, draw: 1, loss: 0 },
      dupMode: 'figure_trait', // 'figure_trait' | 'trait_only'
      failEndsMatch: true,
      turnSeconds: 5,
      matchSeconds: 120,
    },
  },
  { kind: 'one_voice', title: '한마음과 한 입으로', config: { words: ONE_VOICE_WORDS, pointsPerSuccess: 1, letterMode: true } },
  { kind: 'sheep_voice', title: '내 양은 내 음성을 들으며', config: { correct: 1, wrong: -1 } },
  { kind: 'part1_result', title: '1부 결과', config: {} },
];
