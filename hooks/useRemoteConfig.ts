import { useEffect, useState } from 'react';
import { getRemoteConfig } from '../services/userService';

// Module-level cache — every screen that calls this hook shares one fetch
// per app session instead of each re-requesting /config on its own mount.
let cached: { premiumEnabled: boolean } | null = null;
let inFlight: Promise<{ premiumEnabled: boolean }> | null = null;

async function fetchOnce(): Promise<{ premiumEnabled: boolean }> {
    if (cached) return cached;
    if (!inFlight) {
        inFlight = getRemoteConfig().then((res) => {
            // Fail safe to "everything off" — a network hiccup must never
            // accidentally expose a feature that was deliberately hidden.
            cached = res.success && res.data ? res.data : { premiumEnabled: false };
            return cached;
        });
    }
    return inFlight;
}

/** Remote feature flags (currently just premiumEnabled). Defaults to
 *  premiumEnabled: false until the first fetch resolves, so the Premium
 *  surface never flashes visible-then-hidden on a cold start. */
export function useRemoteConfig() {
    const [config, setConfig] = useState(cached || { premiumEnabled: false });

    useEffect(() => {
        let mounted = true;
        fetchOnce().then((c) => { if (mounted) setConfig(c); });
        return () => { mounted = false; };
    }, []);

    return config;
}
