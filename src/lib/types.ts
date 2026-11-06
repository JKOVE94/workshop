export type StepKind = 'entry' | 'roster_close' | 'hum_team' | 'amen' | 'one_voice' | 'sheep_voice' | 'part1_result' | 'team_board' | 'awards';

export const STEP_KINDS: { kind: StepKind; label: string }[] = [
  { kind: 'entry', label: '입장' },
  { kind: 'roster_close', label: '1부 명단 마감' },
  { kind: 'hum_team', label: '허밍으로 팀 찾기' },
  { kind: 'amen', label: '아멘 게임' },
  { kind: 'one_voice', label: '한마음과 한 입으로' },
  { kind: 'sheep_voice', label: '내 양은 내 음성을 들으며' },
  { kind: 'part1_result', label: '1부 결과' },
  { kind: 'team_board', label: '팀 현황판' },
  { kind: 'awards', label: '시상식' },
];

export interface StepRow {
  id: string;
  event_id: string;
  sort: number;
  kind: StepKind;
  title: string;
  config: Record<string, any>;
  state: Record<string, any>;
  status: 'pending' | 'active' | 'done';
}
export interface ParticipantRow { id: string; event_id: string; name: string; created_at: string }
export interface TeamRow { id: string; event_id: string; name: string; color: string; sort: number; name_locked: boolean }
export interface MemberRow { participant_id: string; team_id: string; sort: number }
export interface ScoreRow { id: string; event_id: string; team_id: string; step_id: string | null; delta: number; reason: string; meta: Record<string, any>; created_at: string }
export interface SongRow { id: string; event_id: string; title: string; team_id: string | null; sort: number }
export interface MatchRow {
  id: string; event_id: string; step_id: string; sort: number;
  team_a: string; team_b: string; player_a: string | null; player_b: string | null;
  status: 'pending' | 'live' | 'done'; meta: Record<string, any>;
}
export interface TraitRow {
  id: string; match_id: string; side: 'a' | 'b'; speaker_id: string | null;
  figure: string; trait: string; ok: boolean; dup: boolean; note: string; created_at: string;
}
export interface CardRow { id: string; event_id: string; word: string; is_trap: boolean; qr_token: string; sort: number }
export interface ScanRow { id: string; card_id: string; team_id: string; step_id: string | null; round: number; ok: boolean; created_at: string }

export interface EventRow { id: string; name: string; current_step_id: string | null; revision: number }

export interface Snapshot {
  event: EventRow;
  steps: StepRow[];
  participants: ParticipantRow[];
  teams: TeamRow[];
  members: MemberRow[];
  scores: ScoreRow[];
  songs: SongRow[];
  matches: MatchRow[];
  traits: TraitRow[];
  cards: CardRow[];
  scans: ScanRow[];
}

export type Role = 'player' | 'stage' | 'admin';

// ---- 클라이언트로 내려가는 상태 ----
export interface PubTeam { id: string; name: string; color: string; nameLocked: boolean; /** 누적 승리 점수 */ total: number; /** 동점 시 기준: 게임 내 득점 합 */ tiebreak: number; /** 지금 게임 내 득점 */ gamePoints: number; memberIds: string[] }
export interface PubParticipant { id: string; name: string; teamId: string | null }
export interface PubStep { id: string; kind: StepKind; title: string; status: StepRow['status']; sort: number }

export interface PubMatch {
  id: string; teamA: string; teamB: string; playerA: string | null; playerB: string | null;
  status: MatchRow['status']; meta: Record<string, any>;
  traits: Pick<TraitRow, 'id' | 'side' | 'figure' | 'trait' | 'ok' | 'dup' | 'note'>[];
  successA: number; successB: number; failedSide: 'a' | 'b' | null;
  /** 팀별로 이미 다른 경기에 나간 사람 (출전자 선택 차단용) */
  blockedA: string[]; blockedB: string[];
}

export interface PubOneVoice {
  n: number; round: number; wordLen: number;
  orders: { teamId: string; playerIds: string[] }[];
  results: Record<string, boolean>; // teamId -> ok (현재 라운드)
  word?: string; // admin 항상, stage는 showWord일 때, player는 내 글자만
  myLetter?: string; myIndex?: number;
  showWord: boolean;
}

export interface PubSheep {
  round: number;
  cardCount: number; trapCount: number;
  scans: { word: string; teamId: string; ok: boolean; at: string; round: number }[];
  adminCards?: { id: string; word: string; isTrap: boolean; scanned: boolean }[];
}

export interface PublicState {
  rev: number;
  now: number;
  empty: boolean;
  step: { id: string; kind: StepKind; title: string; config: Record<string, any>; state: Record<string, any> } | null;
  steps: PubStep[];
  participants: PubParticipant[];
  teams: PubTeam[];
  me?: { id: string; name: string; teamId: string | null } | null;
  hum?: { mySong?: string; songs?: { id: string; title: string; teamId: string | null }[]; revealed: boolean; timerEnd: number | null };
  amen?: { matches: PubMatch[]; points: { win: number; draw: number; loss: number }; dupMode: string };
  oneVoice?: PubOneVoice;
  sheep?: PubSheep;
  /** 게임(스텝)별 팀 득점과 우승팀 */
  gameResults?: { stepId: string; title: string; kind: StepKind; points: Record<string, number>; winners: string[]; finalized: boolean; winPoints: number; leaders: string[] }[];
}
