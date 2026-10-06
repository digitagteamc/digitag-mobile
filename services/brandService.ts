import { ApiRequestError, authHeaders, request } from './userService';

/* ────────────────────────── TYPES ───────────────────────── */

export type BrandApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AdRequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'IN_PROGRESS' | 'COMPLETED';
export type ChannelType = 'TV' | 'YOUTUBE' | 'RADIO' | 'OTT' | 'PRINT' | 'DIGITAL' | 'OTHER';

export interface BrandProfile {
    id: string;
    userId: string;
    name: string | null;
    profilePicture: string | null;
    email: string | null;
    pan: string | null;
    gstin: string | null;
    city: string | null;
    state: string | null;
    website: string | null;
    industry: string | null;
    bio: string | null;
    tagId: string | null;
    approvalStatus: BrandApprovalStatus;
    rejectionReason: string | null;
}

export interface BrandStatus {
    hasProfile: boolean;
    status: BrandApprovalStatus | null;
    rejectionReason: string | null;
}

export interface AdTypeItem { id: string; name: string; iconUrl: string | null; accentColor: string | null; description: string | null }
export interface ChannelAdTypeSummary { id: string; name: string; itemCount: number; startingPrice: string | null }
export interface Channel {
    id: string;
    name: string;
    type: ChannelType;
    logoUrl: string | null;
    subscriberCount: number;
    category: string | null;
    description?: string | null;
    languages?: string[];
    region?: string | null;
    isVerified: boolean;
    adTypes?: ChannelAdTypeSummary[];
    startingPrice?: string | null;
}
export interface Celebrity { id: string; name: string; photoUrl: string | null; role: string | null; followerCount: number; isVerified: boolean; profileUrl: string | null }
export interface BrandHome { youtubeChannels: Channel[]; adTypes: AdTypeItem[]; celebrities: Celebrity[] }

export interface CatalogItem {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    price: string;
    currency: string;
    minQuantity: number;
    slot: string | null;
    durationSeconds: number | null;
    adType: { id: string; name: string; iconUrl: string | null; accentColor: string | null };
}

export interface AdRequestItem { id: string; itemName: string; adTypeName: string; unit: string; unitPrice: string; quantity: number; lineTotal: string; notes: string | null }
export interface AdRequestEvent { id: string; actor: 'BRAND' | 'CHANNEL' | 'SYSTEM'; actorName: string | null; fromStatus: AdRequestStatus | null; toStatus: AdRequestStatus | null; note: string | null; createdAt: string }
export interface AdRequest {
    id: string;
    status: AdRequestStatus;
    campaignName: string | null;
    brief: string | null;
    startDate: string | null;
    endDate: string | null;
    budget: string | null;
    totalAmount: string;
    currency: string;
    channelNote: string | null;
    createdAt: string;
    channel: { id: string; name: string; type: ChannelType; logoUrl: string | null };
    items?: AdRequestItem[];
    events?: AdRequestEvent[];
    _count?: { items: number };
}

export interface Paged<T> { items: T[]; meta: { total: number; page: number; totalPages: number; hasNextPage: boolean } | null }

type Result<T> = { success: true; data: T } | { success: false; error: string; code?: string };

/* ────────────────────────── HELPERS ───────────────────────── */

function fail(error: any): { success: false; error: string; code?: string } {
    const details = error instanceof ApiRequestError ? error.details : null;
    const message = Array.isArray(details) && details.length
        ? details.map((d: any) => d?.message).filter(Boolean).join('\n')
        : error?.message || 'Something went wrong';
    return { success: false, error: message, code: details?.code };
}

async function get<T>(token: string, path: string): Promise<Result<T>> {
    try {
        const body = await request(path, { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data as T };
    } catch (e) { return fail(e); }
}

async function getPaged<T>(token: string, path: string): Promise<Result<Paged<T>>> {
    try {
        const body = await request(path, { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: { items: (body?.data ?? []) as T[], meta: body?.meta ?? null } };
    } catch (e) { return fail(e); }
}

async function send<T>(token: string, path: string, method: 'POST' | 'PUT' | 'PATCH', payload?: any): Promise<Result<T>> {
    try {
        const body = await request(path, { method, headers: authHeaders(token), body: payload ? JSON.stringify(payload) : undefined });
        return { success: true, data: body?.data as T };
    } catch (e) { return fail(e); }
}

function qs(params: Record<string, string | number | undefined | null>) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '') as [string, string][];
    const s = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
    return s ? `?${s}` : '';
}

export function formatMoney(value: string | number | null | undefined, currency = 'INR') {
    const n = Number(value ?? 0);
    const symbol = currency === 'INR' ? '₹' : `${currency} `;
    return `${symbol}${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatCount(n: number | null | undefined) {
    const v = Number(n || 0);
    if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(1).replace(/\.0$/, '')}Cr`;
    if (v >= 100_000) return `${(v / 100_000).toFixed(1).replace(/\.0$/, '')}L`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(v);
}

export const AD_REQUEST_STATUS_LABEL: Record<AdRequestStatus, string> = {
    PENDING: 'Sent',
    UNDER_REVIEW: 'Under review',
    ACCEPTED: 'Accepted',
    REJECTED: 'Declined',
    CANCELLED: 'Cancelled',
    IN_PROGRESS: 'Live',
    COMPLETED: 'Completed',
};

export const AD_REQUEST_STATUS_COLOR: Record<AdRequestStatus, string> = {
    PENDING: '#60A5FA',
    UNDER_REVIEW: '#F59E0B',
    ACCEPTED: '#22C55E',
    REJECTED: '#EF4444',
    CANCELLED: '#8A8A99',
    IN_PROGRESS: '#A78BFA',
    COMPLETED: '#22C55E',
};

/* ────────────────────────── PROFILE / APPROVAL ───────────────────────── */

export const getBrandStatus = (token: string) => get<BrandStatus>(token, '/brands/status');
export const getMyBrandProfile = (token: string) => get<BrandProfile>(token, '/brands/profile/me');
export const createBrandProfile = (token: string, data: Partial<BrandProfile>) => send<BrandProfile>(token, '/brands/profile', 'POST', data);
export const updateBrandProfile = (token: string, data: Partial<BrandProfile>) => send<BrandProfile>(token, '/brands/profile', 'PUT', data);

/** Where a signed-in brand should land: registration form, the pending /
 *  rejected screen, or the app itself once approved. */
export async function brandLandingRoute(token: string): Promise<string> {
    const res = await getBrandStatus(token);
    if (!res.success) return '/(tabs)';
    if (!res.data.hasProfile) return '/signup/brand';
    if (res.data.status !== 'APPROVED') return '/signup/pending?role=BRAND';
    return '/(tabs)';
}

/* ────────────────────────── BRAND HOME ───────────────────────── */

export const getBrandHome = (token: string) => get<BrandHome>(token, '/brands/home');
export const getBrandDashboard = (token: string) =>
    get<{ posts: Record<string, number>; applicants: Record<string, number>; adRequests: Record<string, number>; unreadNotifications: number }>(token, '/brands/dashboard');
export const listCelebrities = (token: string, params: { page?: number; search?: string } = {}) =>
    getPaged<Celebrity>(token, `/brands/celebrities${qs({ limit: 30, ...params })}`);

/* ────────────────────────── CHANNELS / CATALOG ───────────────────────── */

export const listChannels = (token: string, params: { type?: ChannelType; adTypeId?: string; search?: string; page?: number } = {}) =>
    getPaged<Channel>(token, `/channels${qs({ limit: 30, ...params })}`);
export const getChannel = (token: string, id: string) => get<Channel>(token, `/channels/${id}`);
export const getChannelCatalog = (token: string, id: string, adTypeId?: string) =>
    get<CatalogItem[]>(token, `/channels/${id}/catalog${qs({ adTypeId })}`);
export const listAdTypes = (token: string) => get<AdTypeItem[]>(token, '/channels/ad-types');

/* ────────────────────────── AD REQUESTS ───────────────────────── */

export interface NewAdRequest {
    channelId: string;
    campaignName?: string;
    brief?: string;
    startDate?: string | null;
    endDate?: string | null;
    budget?: number | null;
    items: { catalogItemId: string; quantity: number; notes?: string }[];
}

export const createAdRequest = (token: string, data: NewAdRequest) => send<AdRequest>(token, '/ad-requests', 'POST', data);
export const listAdRequests = (token: string, params: { status?: AdRequestStatus; page?: number } = {}) =>
    getPaged<AdRequest>(token, `/ad-requests${qs({ limit: 30, ...params })}`);
export const getAdRequest = (token: string, id: string) => get<AdRequest>(token, `/ad-requests/${id}`);
export const cancelAdRequest = (token: string, id: string, note?: string) => send<AdRequest>(token, `/ad-requests/${id}/cancel`, 'POST', { note });
export const addAdRequestNote = (token: string, id: string, note: string) => send<AdRequest>(token, `/ad-requests/${id}/notes`, 'POST', { note });

/* ────────────────────────── REQUIREMENT POSTS ───────────────────────── */

export interface RequirementPayload {
    title: string;
    description: string;
    category?: string;
    collaborationType: 'PAID' | 'UNPAID';
    budget?: string;
    location?: string;
    freelancerRequired: boolean;
}

export const createRequirement = (token: string, data: RequirementPayload) => send<any>(token, '/posts', 'POST', data);
export const listMyRequirements = (token: string, params: { status?: 'OPEN' | 'COMPLETED' | 'CLOSED'; page?: number } = {}) =>
    getPaged<any>(token, `/brands/posts${qs({ limit: 30, ...params })}`);
export const listApplicants = (token: string, postId: string) => get<any[]>(token, `/brands/posts/${postId}/applicants`);

/** Creator / Freelancer side: brand requirements visible to me. */
export const listBrandRequirements = (token: string, params: { search?: string; page?: number } = {}) =>
    getPaged<any>(token, `/brands/requirements${qs({ limit: 20, ...params })}`);
