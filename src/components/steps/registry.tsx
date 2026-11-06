'use client';
import type { ComponentType } from 'react';
import type { StepKind } from '@/lib/types';
import type { AdminProps, StepProps } from '../ui';
import { ClosePlayer, CloseStage, EntryPlayer, EntryStage, PlainAdmin, ResultPlayer, ResultStage } from './basic';
import { HumAdmin, HumPlayer, HumStage } from './hum';
import { AmenAdmin, AmenPlayer, AmenStage } from './amen';
import { OneVoiceAdmin, OneVoicePlayer, OneVoiceStage } from './oneVoice';
import { SheepAdmin, SheepPlayer, SheepStage } from './sheep';

export interface StepModule {
  Player: ComponentType<StepProps>;
  Stage: ComponentType<StepProps>;
  Admin: ComponentType<AdminProps>;
}

/** 스텝 추가 = 파일 하나 + 여기에 한 줄 */
export const STEP_MODULES: Record<StepKind, StepModule> = {
  entry: { Player: EntryPlayer, Stage: EntryStage, Admin: PlainAdmin },
  roster_close: { Player: ClosePlayer, Stage: CloseStage, Admin: PlainAdmin },
  hum_team: { Player: HumPlayer, Stage: HumStage, Admin: HumAdmin },
  amen: { Player: AmenPlayer, Stage: AmenStage, Admin: AmenAdmin },
  one_voice: { Player: OneVoicePlayer, Stage: OneVoiceStage, Admin: OneVoiceAdmin },
  sheep_voice: { Player: SheepPlayer, Stage: SheepStage, Admin: SheepAdmin },
  part1_result: { Player: ResultPlayer, Stage: ResultStage, Admin: PlainAdmin },
};
