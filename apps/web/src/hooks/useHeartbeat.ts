import { useEffect } from 'react';
import { playerClient, type PlayerState } from '../api/client';

export function useHeartbeat(onHeartbeat: (state: PlayerState) => void, refresh: () => Promise<void>, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const sendHeartbeat = async () => {
      try {
        onHeartbeat(await playerClient.sendHeartbeat());
      } catch {
        // The next heartbeat or focus refresh can recover from a transient failure.
      }
    };
    const handleFocus = async () => {
      await sendHeartbeat();
      await refresh();
    };
    const intervalId = window.setInterval(() => { void sendHeartbeat(); }, 30_000);

    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, onHeartbeat, refresh]);
}
