import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local multi-draft storage for Create Post. Drafts are private, unpublished
 * work — kept on-device (AsyncStorage) rather than server-side, so nothing
 * half-written ever leaves the phone. Listed in My Posts > Drafts.
 */

const DRAFTS_KEY = '@digitag_post_drafts';
// Pre-drafts-list versions stored exactly one draft under this key.
const LEGACY_DRAFT_KEY = '@digitag_post_draft';

export interface PostDraft {
    id: string;
    title: string;
    body: string;
    location: string;
    collab: 'PAID' | 'UNPAID' | null;
    category: string | null;
    budget: string;
    savedAt: string;
}

export function newDraftId() {
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** All drafts, newest first. Migrates the legacy single-draft slot on first read. */
export async function listDrafts(): Promise<PostDraft[]> {
    let drafts: PostDraft[] = [];
    try {
        const raw = await AsyncStorage.getItem(DRAFTS_KEY);
        if (raw) drafts = JSON.parse(raw);
    } catch { /* corrupted store — treat as empty */ }

    try {
        const legacyRaw = await AsyncStorage.getItem(LEGACY_DRAFT_KEY);
        if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw);
            if (legacy.title || legacy.body) {
                drafts.unshift({
                    id: newDraftId(),
                    title: legacy.title || '',
                    body: legacy.body || '',
                    location: legacy.location || '',
                    collab: legacy.collab || null,
                    category: legacy.category || null,
                    budget: legacy.budget || '',
                    savedAt: new Date().toISOString(),
                });
                await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
            }
            await AsyncStorage.removeItem(LEGACY_DRAFT_KEY);
        }
    } catch { /* corrupted legacy draft — drop it */ }

    return drafts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

/** Insert or update (by id). */
export async function saveDraft(draft: PostDraft): Promise<void> {
    const drafts = await listDrafts();
    const next = [{ ...draft, savedAt: new Date().toISOString() }, ...drafts.filter((d) => d.id !== draft.id)];
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
}

export async function getDraft(id: string): Promise<PostDraft | null> {
    const drafts = await listDrafts();
    return drafts.find((d) => d.id === id) || null;
}

export async function deleteDraft(id: string): Promise<void> {
    const drafts = await listDrafts();
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.filter((d) => d.id !== id)));
}
