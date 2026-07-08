import { useEffect, useRef, useState } from 'react';

export interface LocationSuggestion {
  id: string;
  label: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// Nominatim's usage policy asks callers to identify themselves via User-Agent/email
// rather than anonymous scraping — this is a free, keyless public API.
const CONTACT_EMAIL = 'support@thedigitag.ai';

function formatSuggestion(item: any): string {
  const a = item.address || {};
  const primary = a.city || a.town || a.village || a.county || a.state_district
    || (item.display_name as string | undefined)?.split(',')[0];
  const parts = [primary, a.state, a.country].filter(Boolean);
  return Array.from(new Set(parts)).join(', ');
}

// Debounced, abortable OpenStreetMap Nominatim place search — shared by every
// free-text location field in the app (create-post, signup forms, etc).
export function useLocationSuggestions(query: string, { minLength = 3, debounceMs = 400 } = {}) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < minLength) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q,
          format: 'json',
          addressdetails: '1',
          limit: '6',
          email: CONTACT_EMAIL,
        });
        const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            'User-Agent': `DigitagApp/1.0 (${CONTACT_EMAIL})`,
            'Accept-Language': 'en',
          },
        });
        const data = await res.json();
        const items: LocationSuggestion[] = Array.isArray(data)
          ? data.map((d: any) => ({ id: String(d.place_id), label: formatSuggestion(d) }))
          : [];
        // Nominatim can return near-duplicate rows for the same place at different
        // zoom levels — collapse them so the dropdown doesn't repeat itself.
        const seen = new Set<string>();
        const deduped = items.filter((s) => {
          if (seen.has(s.label)) return false;
          seen.add(s.label);
          return true;
        });
        setSuggestions(deduped);
      } catch (err: any) {
        if (err?.name !== 'AbortError') setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [query, minLength, debounceMs]);

  return { suggestions, loading };
}
