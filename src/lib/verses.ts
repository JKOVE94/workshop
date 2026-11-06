import type { StepKind } from './types';

export interface Verse {
  /** 1→2→3 으로 쌓이는 가치 순서 */
  order: 1 | 2 | 3;
  value: string;
  tagline: string;
  /** 본문 (참조 + 말씀) */
  passages: { ref: string; text: string }[];
}

/** 활동 → 가치·말씀. 허밍 팀 찾기는 팀 결성이라 가치에서 제외 (docs/01-기획.md) */
export const VERSES: Partial<Record<StepKind, Verse>> = {
  amen: {
    order: 1,
    value: '서로를 받아들이고 존중한다',
    tagline: '칭찬을 그대로 받아들이는 것이 존중의 시작이에요',
    passages: [
      { ref: '롬 12:10', text: '형제를 사랑하여 서로 우애하고 존경하기를 서로 먼저 하며' },
    ],
  },
  one_voice: {
    order: 2,
    value: '한마음과 한 입으로',
    tagline: '서로 뜻이 같아야 한 단어가 완성돼요',
    passages: [
      { ref: '롬 15:5-6', text: '이제 인내와 위로의 하나님이 너희로 그리스도 예수를 본받아 서로 뜻이 같게 하여 주사 한마음과 한 입으로 하나님 곧 우리 주 예수 그리스도의 아버지께 영광을 돌리게 하려 하노라' },
    ],
  },
  sheep_voice: {
    order: 3,
    value: '예수님의 인도하심을 따라간다',
    tagline: '시야가 좁은 양도 목자의 음성은 구분해서 따라가요',
    passages: [{ ref: '요 10:27', text: '내 양은 내 음성을 들으며 나는 그들을 알며 그들은 나를 따르느니라' }],
  },
};

export const JOURNEY = [
  { order: 1, label: '받아들임', kind: 'amen' },
  { order: 2, label: '한마음', kind: 'one_voice' },
  { order: 3, label: '인도하심', kind: 'sheep_voice' },
] as const;

export interface GuideStep { icon: string; text: string }
export interface Guide { title: string; steps: GuideStep[] }

/** 활동 설명 (그림 위주 · 진행자가 말로 보충하므로 짧게) */
export const GUIDES: Partial<Record<StepKind, Guide>> = {
  hum_team: {
    title: '허밍으로 팀 찾기',
    steps: [
      { icon: '📱', text: '폰에 곡 제목이 떠요' },
      { icon: '🤫', text: '말·가사 금지! 허밍만' },
      { icon: '🎵👂', text: '같은 곡 사람 찾기' },
      { icon: '👥🎉', text: '모이면 팀 완성!' },
    ],
  },
  amen: {
    title: '아멘 게임',
    steps: [
      { icon: '🗣️', text: '“너 다니엘처럼 용감한 거 알지?” 성경 인물로 칭찬' },
      { icon: '🙌', text: '받는 사람은 “아멘!”' },
      { icon: '⏱️', text: '5초 안에!' },
      { icon: '🚫', text: '같은 특성은 금지' },
      { icon: '🏆', text: '더 많이 성공한 팀이 승리' },
    ],
  },
  one_voice: {
    title: '한마음과 한 입으로',
    steps: [
      { icon: '🔤', text: '한 글자씩 이어 말해요' },
      { icon: '🧑‍🤝‍🧑➡️', text: '정해진 순서대로' },
      { icon: '📖✨', text: '성경 단어를 완성!' },
      { icon: '🔄', text: '시작하는 사람은 돌아가며' },
    ],
  },
  sheep_voice: {
    title: '내 양은 내 음성을 들으며',
    steps: [
      { icon: '🧢🐑', text: '양: 고깔모자를 앞으로 쓰고' },
      { icon: '📢', text: '목자(팀원)가 단어를 외쳐요' },
      { icon: '🃏', text: '테이블에서 카드를 찾아' },
      { icon: '🙋', text: '진행자에게 제출!' },
      { icon: '⭕❌', text: '정답은 득점, 함정은 감점' },
      { icon: '🚶', text: '걷기만! 뛰지 않기' },
    ],
  },
};
