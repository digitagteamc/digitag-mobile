import { useEffect, useState } from 'react';
import { getRemoteConfig } from '../services/userService';

type Config = { premiumEnabled: boolean };

// Cache keyed per-identity (token, or 'guest') — the backend applies an
// Apple-reviewer override to one specific account, so the flag value can
// differ per user, not just once per app session. A bare global cache would
// keep serving whichever identity fetched first to everyone after.
const cache = new Map<string, Config>();
const inFlight = new Map<string, Promise<Config>>();

async function fetchOnce(token: string | null): Promise<Config> {
    const key = token || 'guest';
    if (cache.has(key)) return cache.get(key)!;
    if (!inFlight.has(key)) {
        inFlight.set(key, getRemoteConfig(token).then((res) => {
            // Fail safe to "everything off" — a network hiccup must never
            // accidentally expose a feature that was deliberately hidden.
            const config = res.success && res.data ? res.data : { premiumEnabled: false };
            cache.set(key, config);
            return config;
        }));
    }
    return inFlight.get(key)!;
}

/** Remote feature flags (currently just premiumEnabled). Defaults to
 *  premiumEnabled: false until the first fetch resolves, so the Premium
 *  surface never flashes visible-then-hidden on a cold start. Re-fetches
 *  whenever the identity (token) changes, e.g. logging in as a different
 *  account, or logging out. */
export function useRemoteConfig(token: string | null = null) {
    const [config, setConfig] = useState<Config>(cache.get(token || 'guest') || { premiumEnabled: false });

    useEffect(() => {
        let mounted = true;
        fetchOnce(token).then((c) => { if (mounted) setConfig(c); });
        return () => { mounted = false; };
    }, [token]);

    return config;
}
