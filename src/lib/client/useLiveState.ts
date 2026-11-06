'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicState, Role } from '../types';

/**
 * revision 폴링 동기화. 와이파이가 불안정해도 마지막 상태를 유지하고 '연결 끊김'만 표시한다.
 * clockOffset: 서버 시각 - 내 시각 (타이머를 서버 기준으로 맞추기 위해 사용)
 */
export function useLiveState(view: Role, intervalMs = 2000) {
  const [state, setState] = useState<PublicState | null>(null);
  const [offline, setOffline] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const rev = useRef(-1);
  const offset = useRef(0);
  const inflight = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const t0 = Date.now();
      const res = await fetch(`/api/state?view=${view}&rev=${force ? -1 : rev.current}`, { cache: 'no-store' });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'error');
      offset.current = data.now - (t0 + Date.now()) / 2;
      if (!data.unchanged) {
        rev.current = data.rev;
        setState(data);
      }
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      inflight.current = false;
    }
  }, [view]);

  useEffect(() => {
    const first = setTimeout(() => refresh(true), 0);
    const id = setInterval(() => refresh(), intervalMs);
    const onVis = () => document.visibilityState === 'visible' && refresh(true); // 화면 꺼짐 복귀 시 재동기화
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onVis);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onVis);
    };
  }, [refresh, intervalMs]);

  const serverNow = useCallback(() => Date.now() + offset.current, []);
  return { state, offline, unauthorized, refresh, serverNow };
}

/** 서버 시각 기준 현재 시간(ms)을 intervalMs마다 갱신 */
export function useNow(serverNow: () => number, intervalMs = 200) {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), intervalMs);
    return () => clearInterval(id);
  }, [serverNow, intervalMs]);
  return now;
}
