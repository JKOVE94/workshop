# 라난 찬양팀 워크샵 · 1부 앱

1부 레크레이션(허밍 팀 찾기 → 아멘 게임 → 한마음과 한 입으로 → 내 양은 내 음성을 들으며 → 결과)을 진행하는 웹앱.
범위와 규칙은 `docs/03-1부-MVP-스코프.md`(우선), `docs/01-기획.md`, `docs/02-개발-방향성.md` 참고.
Next.js(App Router) + Supabase(Postgres) + Vercel.

## 화면

| 경로 | 용도 |
| --- | --- |
| `/` | 참가자 입장 (이름만) |
| `/play` | 참가자 폰 (현재 스텝 따라 자동 전환) |
| `/stage` | 빔 화면 (읽기 전용, 인증 없음) |
| `/admin` | 진행·점수 수동 입력·참가자 관리·봇·초기화 (비밀번호) |

## 세팅

1. Supabase 프로젝트 생성 → SQL Editor에서 `supabase/schema.sql` 실행
2. `.env.example`을 `.env.local`로 복사하고 값 채우기
   (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `ADMIN_PASSWORD`)
3. `npm install && npm run dev` → `/admin` 로그인
4. Vercel에 레포를 연결하고 같은 4개 환경변수를 등록 (Supabase 키는 서버 전용이라 `NEXT_PUBLIC_` 접두사 없음)

## 구조

- `src/lib/game/*` 순수 로직(균등 팀 분배, 리그 대진, 특성 중복, 승점, 말하기 순서) — `npm test`
- `src/lib/server/actions.ts` 관리자 동작 디스패처. 스텝 진입 부수효과(`onEnter`)는 멱등
- `src/lib/server/state.ts` 역할별(player/stage/admin) 상태 뷰. 함정 카드·다른 팀 곡은 여기서 걸러냄
- `src/components/steps/*` 스텝 하나 = Player/Stage/Admin 3종 컴포넌트, `registry.tsx`에 한 줄 등록
- 동기화: `events.revision` 폴링(2초). 끊기면 마지막 상태 유지 + "연결 끊김" 표시
- 보안: RLS ON·정책 없음, 모든 접근은 Route Handler(service_role)

## 미확정 규칙(config로 조정)

`/admin` → 해당 스텝 → "스텝 설정(config JSON)": 아멘 승점·특성 중복 기준(`dupMode`)·실패 시 즉시 종료(`failEndsMatch`),
한마음 단어 목록·점수·글자 공개(`letterMode`), 내 양은 내 음성을 들으며의 정답/함정 득점, 게임별 `winPoints`. 허밍 곡은 스텝 화면에서 수정.

## 당일 장애 대응

점수는 게임별 '승리 점수' 방식이다. 게임 내 득점(아멘 승점, 한마음 성공, 카드 스캔)으로 승자가 정해지고, 관리자가 `/admin`에서 "승리 확정"을 누르면 그 게임의 승리 점수가 팀 누적 점수에 더해진다. 자동 판정이 어려우면 "승리 팀 직접 선택"으로 확정한다. 종이 점수판을 백업으로 준비한다.
행사 후 Supabase 프로젝트를 정리한다.
