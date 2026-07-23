const RAW_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\s+/g, '');
// const API_BASE_URL = RAW_BASE && !/\/api\/v\d+\/?$/.test(RAW_BASE)
//     ? `${RAW_BASE.replace(/\/+$/, '')}/api/v1`
//     : RAW_BASE.replace(/\/+$/, '');
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');

if (!RAW_BASE) {
    console.warn('EXPO_PUBLIC_API_BASE_URL is not defined in .env');
}

type Headers = Record<string, string>;

/** Thrown from `request()` so callers can inspect structured error details
 *  (retry-after seconds, attempts remaining, etc.) — not just the message. */
export class ApiRequestError extends Error {
    status: number;
    details: any;
    constructor(message: string, status: number, details?: any) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

// Token refresh callback — set by AuthContext to avoid circular imports
let _refreshTokenFn: (() => Promise<string | null>) | null = null;
export function setRefreshTokenCallback(fn: () => Promise<string | null>) {
    _refreshTokenFn = fn;
}

async function request(path: string, options: RequestInit = {}, _retry = true) {
    const res = await fetch(`${API_BASE_URL}${path}`, options);
    let json: any = null;
    try { json = await res.json(); } catch { /* empty body */ }

    // Auto-refresh on 401 (expired access token)
    if (res.status === 401 && _retry && _refreshTokenFn) {
        const newToken = await _refreshTokenFn();
        if (newToken) {
            const newOptions = {
                ...options,
                headers: {
                    ...(options.headers as Record<string, string> || {}),
                    Authorization: `Bearer ${newToken}`,
                },
            };
            return request(path, newOptions, false);
        }
    }

    if (!res.ok) {
        throw new ApiRequestError(
            json?.message || `Request failed: ${res.status}`,
            res.status,
            json?.details ?? null,
        );
    }
    return json;
}

export const authHeaders = (token: string): Headers => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
});

// Same as authHeaders, but for endpoints a guest (no token) can also call —
// omits Authorization entirely instead of sending "Bearer null".
export const optionalAuthHeaders = (token?: string | null): Headers => {
    const { Authorization, ...rest } = authHeaders(token || '');
    return token ? { ...rest, Authorization } : rest;
};

/** GET /config — remote feature flags, no auth required. Currently just
 *  premiumEnabled: a server-side kill switch for the whole Premium surface
 *  so it can be shown/hidden without an app rebuild. */
export const getRemoteConfig = async (token?: string | null) => {
    try {
        // Authenticated so the backend can apply the Apple-reviewer override
        // (that account always sees Premium regardless of the global flag) —
        // an unauthenticated call only ever gets the global flag.
        const body = await request('/config', { method: 'GET', headers: optionalAuthHeaders(token) });
        return { success: true, data: body?.data as { premiumEnabled: boolean } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────────── AUTH ─────────────────────────── */

/** POST /auth/send-otp — backend returns OTP policy (cooldown, expiry, length). */
export const requestOtp = async (
    phoneNumber: string,
    role: 'CREATOR' | 'FREELANCER' = 'CREATOR',
) => {
    try {
        console.log(`📱 Requesting OTP for ${phoneNumber} as ${role}...`);
        const body = await request('/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber: phoneNumber, role }),
        });
        return { success: true, ...(body?.data ?? {}) };
    } catch (error: any) {
        console.warn('❌ requestOtp error:', error.message);
        const details = error instanceof ApiRequestError ? error.details : null;
        return {
            success: false,
            error: error.message,
            retryAfterSeconds: details?.retryAfterSeconds ?? undefined,
        };
    }
};

/** POST /auth/verify-otp — backend returns profile map + active role. */
export const verifyOtp = async (
    phoneNumber: string,
    otp: string,
    role: 'CREATOR' | 'FREELANCER' = 'CREATOR',
) => {
    try {
        console.log(`🔐 Verifying OTP for ${phoneNumber} as ${role}...`);
        const body = await request('/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber: phoneNumber, code: otp, role }),
        });
        const data = body?.data ?? {};
        const token = data?.tokens?.accessToken ?? '';
        console.log(`✅ OTP verified. Token: ${token ? 'yes' : 'NOT PROVIDED'}`);
        return {
            success: true,
            token,
            refreshToken: data?.tokens?.refreshToken,
            user: data?.user,
            isNewUser: data?.isNewUser,
            activeRole: data?.activeRole as 'CREATOR' | 'FREELANCER' | undefined,
            profiles: data?.profiles as { CREATOR: boolean; FREELANCER: boolean } | undefined,
            availableRoles: (data?.availableRoles || []) as Array<'CREATOR' | 'FREELANCER'>,
            isProfileCompleted: data?.isProfileCompleted,
        };
    } catch (error: any) {
        console.warn('❌ verifyOtp error:', error.message);
        const details = error instanceof ApiRequestError ? error.details : null;
        return {
            success: false,
            error: error.message,
            attemptsRemaining: details?.attemptsRemaining as number | undefined,
        };
    }
};

/** POST /auth/verify-firebase — backend returns profile map + active role using Firebase idToken. */
export const verifyFirebaseToken = async (
    idToken: string,
    role: 'CREATOR' | 'FREELANCER' = 'CREATOR',
) => {
    try {
        console.log(`🔐 Verifying Firebase token for role ${role}...`);
        const body = await request('/auth/verify-firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, role }),
        });
        const data = body?.data ?? {};
        const token = data?.tokens?.accessToken ?? '';
        console.log(`✅ Firebase OTP verified. Token: ${token ? 'yes' : 'NOT PROVIDED'}`);
        return {
            success: true,
            token,
            refreshToken: data?.tokens?.refreshToken,
            user: data?.user,
            isNewUser: data?.isNewUser,
            activeRole: data?.activeRole as 'CREATOR' | 'FREELANCER' | undefined,
            profiles: data?.profiles as { CREATOR: boolean; FREELANCER: boolean } | undefined,
            availableRoles: (data?.availableRoles || []) as Array<'CREATOR' | 'FREELANCER'>,
            isProfileCompleted: data?.isProfileCompleted,
        };
    } catch (error: any) {
        console.warn('❌ verifyFirebaseToken error:', error.message);
        const details = error instanceof ApiRequestError ? error.details : null;
        return {
            success: false,
            error: error.message,
            attemptsRemaining: details?.attemptsRemaining as number | undefined,
        };
    }
};

/** POST /auth/switch-role — change the active role for the current account. */
export const switchRole = async (token: string, role: 'CREATOR' | 'FREELANCER') => {
    try {
        const body = await request('/auth/switch-role', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ role }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /auth/refresh-token */
export const refreshToken = async (rToken: string) => {
    try {
        const body = await request('/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rToken }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /auth/logout */
export const logoutSession = async (rToken?: string) => {
    try {
        await request('/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rToken }),
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * GET /auth/me — current authenticated user with nested profile.
 * Returns shape `{ profile, role, user }` for screen compatibility; the
 * nested `profile` is the role-specific creator/freelancer profile (or the
 * raw user if no role profile exists yet).
 */
export const getFullProfile = async (token: string) => {
    try {
        const body = await request('/auth/me', {
            method: 'GET',
            headers: authHeaders(token),
        });
        const user = body?.data ?? null;
        // Pick the profile matching the active role so dual-role accounts don't
        // accidentally show the "wrong" nested profile.
        const active = user?.activeRole || user?.role;
        const profile =
            (active === 'FREELANCER' ? user?.freelancerProfile : user?.creatorProfile)
            || user?.creatorProfile
            || user?.freelancerProfile
            || user;
        return {
            success: true,
            data: {
                profile,
                role: active,
                user,
                profiles: user?.profiles as { CREATOR: boolean; FREELANCER: boolean } | undefined,
                availableRoles: (user?.availableRoles || []) as Array<'CREATOR' | 'FREELANCER'>,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────────── USER ─────────────────────────── */

/** GET /users/onboarding-status */
export const getOnboardingStatus = async (token: string) => {
    try {
        const body = await request('/users/onboarding-status', {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * Derives creator approval-style status from /users/onboarding-status so
 * existing screens that expect `{ creatorStatus: 'APPROVED' | 'PENDING' }`
 * keep working. Backend no longer has an approval flow.
 */
export const checkCreatorStatus = async (token: string) => {
    const res = await getOnboardingStatus(token);
    if (!res.success) return res;
    const status = res.data?.isProfileCompleted ? 'APPROVED' : 'PENDING';
    return { success: true, data: { ...res.data, creatorStatus: status, status } };
};

/** GET /users/:id/stats — followerCount, followingCount, collabCount */
export const getUserStats = async (token: string | null, id?: string) => {
    try {
        const path = id ? `/users/${id}/stats` : '/users/me/stats';
        const body = await request(path, {
            method: 'GET',
            headers: optionalAuthHeaders(token),
        });
        return { success: true, data: body?.data as { followerCount: number; followingCount: number; collabCount: number } | null };
    } catch (error: any) {
        return { success: false, data: null, error: error.message };
    }
};

/** GET /users/by-tag/:tagId — resolves a public tagId (share-link handle) to a userId. Works for guests too. */
export const getUserIdByTag = async (token: string | null, tagId: string) => {
    try {
        const body = await request(`/users/by-tag/${encodeURIComponent(tagId)}`, {
            method: 'GET',
            headers: optionalAuthHeaders(token),
        });
        return { success: true, data: body?.data as { userId: string } | null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /users/:id — public profile browsing, works with or without a token */
export const getUserById = async (id: string, token: string | null) => {
    try {
        const body = await request(`/users/${id}`, {
            method: 'GET',
            headers: optionalAuthHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────── CATEGORIES ───────────────────────── */

/** GET /categories */
export const getCategories = async (opts: { role?: string; search?: string } = {}) => {
    try {
        const qs = new URLSearchParams();
        if (opts.role) qs.set('role', opts.role);
        if (opts.search) qs.set('search', opts.search);
        const path = `/categories${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET' });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ──────────────────────── CREATORS ────────────────────────── */

/** GET /creators/profile/me */
export const getMyCreatorProfile = async (token: string) => {
    try {
        const body = await request('/creators/profile/me', {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * POST /creators/profile — create creator profile for the authenticated user.
 * Accepts legacy callsite shape; maps `instagram` handle → `instagramLink` URL.
 * Note: backend expects `categoryId` (UUID). Pass it when the UI switches to
 * a category selector fed by GET /categories.
 */
export const submitCreatorApplication = async (formData: any, token: string) => {
    try {
        console.log('🚀 Submitting Creator Profile...');
        const body = await request('/creators/profile', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(formData),
        });
        console.log('✅ Creator profile created');
        return { success: true, data: body?.data };
    } catch (error: any) {
        const details = error instanceof ApiRequestError ? error.details : null;
        console.warn('❌ submitCreatorApplication error:', error.message, details);
        return { success: false, error: details ? `${error.message}\n${JSON.stringify(details, null, 2)}` : error.message };
    }
};

/** PUT /creators/profile */
export const updateCreatorProfile = async (data: any, token: string) => {
    console.log('🚀 Updating Creator Profile... Payload:', JSON.stringify(data, null, 2));
    try {
        const body = await request('/creators/profile', {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        });
        console.log('✅ Creator Profile updated successfully');
        return { success: true, data: body?.data };
    } catch (error: any) {
        const details = error instanceof ApiRequestError ? error.details : null;
        console.warn('❌ updateCreatorProfile error:', error.message, details);
        return { success: false, error: details ? `${error.message}\n${JSON.stringify(details, null, 2)}` : error.message };
    }
};

/** GET /creators/:id */
export const getCreatorById = async (id: string, token: string) => {
    try {
        const body = await request(`/creators/${id}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────── FREELANCERS ──────────────────────── */

/** GET /freelancers/profile/me */
export const getMyFreelancerProfile = async (token: string) => {
    try {
        const body = await request('/freelancers/profile/me', {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /freelancers/profile */
export const createFreelancerProfile = async (data: any, token: string) => {
    try {
        const body = await request('/freelancers/profile', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        const details = error instanceof ApiRequestError ? error.details : null;
        return { success: false, error: details ? `${error.message}\n${JSON.stringify(details, null, 2)}` : error.message };
    }
};

/** PUT /freelancers/profile */
export const updateFreelancerProfile = async (data: any, token: string) => {
    console.log('🚀 Updating Freelancer Profile... Payload:', JSON.stringify(data, null, 2));
    try {
        const body = await request('/freelancers/profile', {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        });
        console.log('✅ Freelancer Profile updated successfully');
        return { success: true, data: body?.data };
    } catch (error: any) {
        const details = error instanceof ApiRequestError ? error.details : null;
        console.warn('❌ updateFreelancerProfile error:', error.message, details);
        return { success: false, error: details ? `${error.message}\n${JSON.stringify(details, null, 2)}` : error.message };
    }
};

/** GET /freelancers/:id */
export const getFreelancerById = async (id: string, token: string) => {
    try {
        const body = await request(`/freelancers/${id}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ───────────────────────── POSTS ──────────────────────────── */

type PostPayload = {
    description: string;
    location?: string;
    collaborationType?: 'PAID' | 'UNPAID';
    imageUrl?: string;
    imageKey?: string;
    category?: string;
    budget?: string;
    /** Omit entirely to keep the post live forever. */
    boostHours?: 4 | 12 | 24 | 48;
};

/**
 * POST /posts — accepts up to 3 local image file URIs (portfolio-category
 * posts), sent via multipart/form-data as repeated "images" fields — the
 * backend accepts .array('images', 3), and every non-portfolio post just
 * sends one. Without any images, sends JSON.
 */
export const createPost = async (
    payload: PostPayload,
    token: string,
    imageFiles?: { uri: string; name?: string; type?: string }[],
) => {
    try {
        const url = `${API_BASE_URL}/posts`;
        let res: Response;
        if (imageFiles && imageFiles.length > 0) {
            const form = new FormData();
            form.append('description', payload.description);
            if (payload.location) form.append('location', payload.location);
            if (payload.collaborationType) form.append('collaborationType', payload.collaborationType);
            if (payload.category) form.append('category', payload.category);
            if (payload.budget) form.append('budget', payload.budget);
            if (payload.boostHours) form.append('boostHours', String(payload.boostHours));
            imageFiles.forEach((imageFile, i) => {
                form.append('images', {
                    uri: imageFile.uri,
                    name: imageFile.name || `upload-${i}.jpg`,
                    type: imageFile.type || 'image/jpeg',
                } as any);
            });
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form,
            });
        } else {
            res = await fetch(url, {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify(payload),
            });
        }
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || `Request failed: ${res.status}`);
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** PUT /posts/:id */
export const updatePost = async (
    id: string,
    payload: Partial<PostPayload> & { isActive?: boolean },
    token: string,
) => {
    try {
        const body = await request(`/posts/${id}`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(payload),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** DELETE /posts/:id */
export const deletePost = async (id: string, token: string) => {
    try {
        await request(`/posts/${id}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /posts/user/:userId — posts authored by a specific user */
export const getUserPosts = async (
    userId: string,
    token: string | null,
    params: Record<string, string> = {},
) => {
    try {
        const qs = new URLSearchParams(params);
        const path = `/posts/user/${userId}${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET', headers: optionalAuthHeaders(token) });
        return { success: true, data: body?.data ?? [], meta: body?.meta };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /posts/me */
export const getMyPosts = async (token: string, params: Record<string, string> = {}) => {
    try {
        const qs = new URLSearchParams(params);
        const path = `/posts/me${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data ?? [], meta: body?.meta };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /posts/:id */
export const getPostById = async (id: string, token: string | null) => {
    try {
        const body = await request(`/posts/${id}`, {
            method: 'GET',
            headers: optionalAuthHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const toggleSavePost = async (postId: string, token: string, currentlySaved: boolean) => {
    try {
        const body = await request(`/posts/${postId}/save`, {
            method: currentlySaved ? 'DELETE' : 'POST',
            headers: authHeaders(token),
        });
        return { success: true, saved: !currentlySaved, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const getSavedPostIds = async (token: string) => {
    try {
        const body = await request('/posts/saved/ids', { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data as string[] };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] as string[] };
    }
};

export const getSavedPosts = async (token: string) => {
    try {
        const body = await request('/posts/saved/list', { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ───────────────────────── FEED ───────────────────────────── */

/** GET /feed */
export const getFeed = async (token: string | null, params: Record<string, string> = {}) => {
    try {
        const qs = new URLSearchParams(params);
        const path = `/feed${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET', headers: optionalAuthHeaders(token) });
        return { success: true, data: body?.data ?? [], meta: body?.meta };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ──────────────────────── UPLOADS ─────────────────────────── */

/** POST /uploads/image — multipart upload; returns { key, url } */
export const uploadImage = async (
    file: { uri: string; name?: string; type?: string },
    token: string,
    folder: 'profiles' | 'posts' | 'chat' = 'profiles',
) => {
    try {
        const form = new FormData();
        form.append('image', {
            uri: file.uri,
            name: file.name || 'upload.jpg',
            type: file.type || 'image/jpeg',
        } as any);
        const res = await fetch(`${API_BASE_URL}/uploads/image?folder=${folder}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form,
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || `Upload failed: ${res.status}`);
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /uploads/presigned */
export const getPresignedUpload = async (
    payload: { originalName: string; mimeType: string; prefix?: string },
    token: string,
) => {
    try {
        const body = await request('/uploads/presigned', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(payload),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────── COLLABORATIONS ───────────────────── */

/** POST /collaborations — send a collab request */
export const sendCollaboration = async (
    token: string,
    payload: { receiverId: string; postId?: string; message?: string },
) => {
    try {
        const body = await request('/collaborations', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(payload),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /collaborations?direction=incoming|outgoing&status=... */
export const listCollaborations = async (
    token: string,
    params: {
        direction?: 'incoming' | 'outgoing' | 'all';
        status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
    } = {},
) => {
    try {
        const qs = new URLSearchParams(params as any);
        const path = `/collaborations${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /collaborations/with/:userId — collab between me and other user (or null).
 *  Pass postId when the caller cares about one specific post's collaboration
 *  state (e.g. post-detail) rather than the most recent collab overall. */
export const getCollaborationWith = async (token: string, userId: string, postId?: string) => {
    try {
        const qs = postId ? `?postId=${encodeURIComponent(postId)}` : '';
        const body = await request(`/collaborations/with/${userId}${qs}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** PATCH /collaborations/:id  { action: 'ACCEPT' | 'DECLINE' } */
export const respondCollaboration = async (
    token: string,
    id: string,
    action: 'ACCEPT' | 'DECLINE',
) => {
    try {
        const body = await request(`/collaborations/${id}`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ action }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** DELETE /collaborations/:id — sender cancels a pending request */
export const cancelCollaboration = async (token: string, id: string) => {
    try {
        const body = await request(`/collaborations/${id}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** PATCH /collaborations/:id { action: 'COMPLETE' } — creator marks work done */
export const completeCollab = async (token: string, id: string) => {
    try {
        const body = await request(`/collaborations/${id}`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ action: 'COMPLETE' }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /collaborations/quota — free-tier monthly collab-request usage.
 *  limit is null for Premium (unlimited). */
export const getCollabRequestQuota = async (token: string) => {
    try {
        const body = await request('/collaborations/quota', { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data as { used: number; limit: number | null; remaining: number | null } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ───────────────────── PREMIUM: BOOST ─────────────────────── */

/** POST /posts/:id/boost — Premium only, jumps the post to the top of feeds for 24h */
export const boostPost = async (token: string, postId: string) => {
    try {
        const body = await request(`/posts/${postId}/boost`, { method: 'POST', headers: authHeaders(token) });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** PATCH /posts/:id/status — owner-only. OPEN|COMPLETED|CLOSED. COMPLETED
 *  keeps the post visible but blocks new collab requests from anyone; CLOSED
 *  hides it from feeds (reversible by setting back to OPEN). */
export const updatePostStatus = async (token: string, postId: string, status: 'OPEN' | 'COMPLETED' | 'CLOSED') => {
    try {
        const body = await request(`/posts/${postId}/status`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ status }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /posts/boost/quota — Premium monthly boost allowance (3/month) */
export const getBoostQuota = async (token: string) => {
    try {
        const body = await request('/posts/boost/quota', { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data as { isPremium: boolean; used: number; limit: number; remaining: number } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────── PREMIUM: PROFILE VIEWS ───────────────── */

/** GET /users/me/profile-viewers — Premium only, most-recent-first */
export const getProfileViewers = async (token: string) => {
    try {
        const body = await request('/users/me/profile-viewers', { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────── CONVERSATIONS ────────────────────── */

/** GET /conversations — list my conversations with last message + unread count */
export const listConversations = async (token: string) => {
    try {
        const body = await request('/conversations', {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /conversations/:id */
export const getConversation = async (token: string, id: string) => {
    try {
        const body = await request(`/conversations/${id}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /conversations/:id/messages — paginated (cursor) */
export const listMessages = async (
    token: string,
    conversationId: string,
    params: { cursor?: string; limit?: number } = {},
) => {
    try {
        const qs = new URLSearchParams();
        if (params.cursor) qs.set('cursor', params.cursor);
        if (params.limit != null) qs.set('limit', String(params.limit));
        const path = `/conversations/${conversationId}/messages${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data ?? [], meta: body?.meta };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /conversations/:id/calls — call history between the two participants,
 *  rendered inline in the chat thread rather than a separate screen. */
export const getConversationCalls = async (token: string, conversationId: string) => {
    try {
        const body = await request(`/conversations/${conversationId}/calls`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

/** POST /conversations/:id/messages */
export const sendMessage = async (
    token: string,
    conversationId: string,
    content: string,
    imageUrl?: string,
    replyToId?: string,
    location?: { lat: number; lng: number },
) => {
    try {
        const body = await request(`/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({
                content: content || '',
                ...(imageUrl ? { imageUrl } : {}),
                ...(replyToId ? { replyToId } : {}),
                ...(location ? { locationLat: location.lat, locationLng: location.lng } : {}),
            }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** PATCH /conversations/:convId/messages/:msgId */
export const editMessage = async (token: string, conversationId: string, messageId: string, content: string) => {
    try {
        const body = await request(`/conversations/${conversationId}/messages/${messageId}`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ content }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /conversations/:convId/messages/:msgId/react — toggles the caller's
 *  reaction (add if not already reacted with this emoji, remove if so). */
export const reactToMessage = async (token: string, conversationId: string, messageId: string, emoji: string) => {
    try {
        const body = await request(`/conversations/${conversationId}/messages/${messageId}/react`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ emoji }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const deleteMessage = async (token: string, conversationId: string, messageId: string) => {
    try {
        const body = await request(`/conversations/${conversationId}/messages/${messageId}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /uploads/image — upload an image for use in chat messages. */
export const uploadMessageImage = async (token: string, asset: { uri: string; mimeType?: string | null; fileName?: string | null }) => {
    try {
        const formData = new FormData();
        formData.append('image', {
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName || `chat_${Date.now()}.jpg`,
        } as any);
        const res = await fetch(`${(process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/+$/, '')}/uploads/image?folder=chat`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) return { success: false, error: json?.message || 'Upload failed' };
        return { success: true, data: json?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * POST /conversations/open — open/create a conversation with another user.
 * Backend requires an accepted collaboration between the two users.
 */
export const openConversationWith = async (token: string, userId: string) => {
    try {
        const body = await request('/conversations/open', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ userId }),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ────────────────────────── FOLLOWS ───────────────────────── */

/** POST /follows/:userId */
export const followUser = async (token: string, userId: string) => {
    try {
        const body = await request(`/follows/${userId}`, {
            method: 'POST',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** DELETE /follows/:userId */
export const unfollowUser = async (token: string, userId: string) => {
    try {
        const body = await request(`/follows/${userId}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /follows/:userId/status */
export const getFollowStatus = async (token: string, userId: string) => {
    try {
        const body = await request(`/follows/${userId}/status`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? { isFollowing: false } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────────── BLOCKS ──────────────────────── */

/** POST /blocks/:userId */
export const blockUser = async (token: string, userId: string) => {
    try {
        const body = await request(`/blocks/${userId}`, {
            method: 'POST',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** DELETE /blocks/:userId */
export const unblockUser = async (token: string, userId: string) => {
    try {
        const body = await request(`/blocks/${userId}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /blocks/:userId/status */
export const getBlockStatus = async (token: string, userId: string) => {
    try {
        const body = await request(`/blocks/${userId}/status`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? { isBlocked: false } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /blocks */
export const getBlockedUsers = async (token: string) => {
    try {
        const body = await request('/blocks', {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

/* ─────────────────────────── REPORTS ─────────────────────── */

/** POST /reports */
export const createReport = async (
    token: string,
    payload: { type: 'USER' | 'POST'; targetId: string; targetName: string; reason: string },
) => {
    try {
        const body = await request('/reports', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(payload),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /reports/issue — app bug/feedback report (lands in the admin Reports queue). */
export const submitIssueReport = async (
    token: string,
    payload: { category: string; severity: 'low' | 'medium' | 'high'; description: string; screenshotUrl?: string },
) => {
    try {
        const body = await request('/reports/issue', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify(payload),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /waitlist — "Notify Me" launch waitlist; works for guests too. */
export const joinWaitlist = async (mobileNumber: string, token?: string | null) => {
    try {
        await request('/waitlist', {
            method: 'POST',
            headers: optionalAuthHeaders(token),
            body: JSON.stringify({ mobileNumber }),
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /reports/status?type=&targetId= */
export const getReportStatus = async (token: string, type: 'USER' | 'POST', targetId: string) => {
    try {
        const body = await request(`/reports/status?type=${type}&targetId=${targetId}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? { reported: false } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** GET /follows/followers (own) or /follows/:userId/followers (another user's) */
export const getFollowers = async (token: string, userId?: string) => {
    try {
        const path = userId ? `/follows/${userId}/followers` : '/follows/followers';
        const body = await request(path, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

/** GET /follows/following (own) or /follows/:userId/following (another user's) */
export const getFollowing = async (token: string, userId?: string) => {
    try {
        const path = userId ? `/follows/${userId}/following` : '/follows/following';
        const body = await request(path, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] };
    }
};

/** GET /follows/suggestions?limit=20 */
export const getFollowSuggestions = async (token: string, limit: number = 20) => {
    try {
        const body = await request(`/follows/suggestions?limit=${limit}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ───────────────────────── SEARCH ─────────────────────────── */

/** GET /search?q=<query>&limit=20 */
export const searchProfiles = async (token: string, q: string, limit: number = 20) => {
    try {
        const qs = new URLSearchParams({ q, limit: String(limit) });
        const body = await request(`/search?${qs}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? { users: [], posts: [] } };
    } catch (error: any) {
        return { success: false, error: error.message, data: { users: [], posts: [] } };
    }
};

/* ───────────────────────── INSTAGRAM VERIFICATION ─────────────────────────── */

/**
 * POST /instagram/start-verification
 * Starts an Instagram DM verification session.
 * Returns { id, code, instagramUsername, expiresAt, digiTagInstagram }
 */
export const startInstagramVerification = async (token: string, instagramUrl: string) => {
    try {
        const body = await request('/instagram/start-verification', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ instagramUrl }),
        });
        return { success: true, data: body?.data ?? null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

/**
 * GET /instagram/verification-status/:id
 * Polls the verification status. Returns { id, status, verifiedAt, instagramUsername }
 * status is one of: PENDING | VERIFIED | EXPIRED | FAILED
 */
export const getInstagramVerificationStatus = async (token: string, id: string) => {
    try {
        const body = await request(`/instagram/verification-status/${id}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

/* ───────────────────────── SOCIAL (YOUTUBE / FACEBOOK) VERIFICATION ─────────────────────────── */

/**
 * POST /social-verifications/start
 * Starts an OAuth verification session for YouTube or Facebook.
 * Returns { id, platform, authorizationUrl, expiresAt }
 */
export const startSocialVerification = async (token: string, platform: 'YOUTUBE' | 'FACEBOOK') => {
    try {
        const body = await request('/social-verifications/start', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ platform }),
        });
        return { success: true, data: body?.data ?? null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

/**
 * GET /social-verifications/status/:id
 * Polls the verification status. Returns { id, status, socialAccountId, accountName }
 * status is one of: PENDING | VERIFIED | EXPIRED | FAILED
 */
export const getSocialVerificationStatus = async (token: string, id: string) => {
    try {
        const body = await request(`/social-verifications/status/${id}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

/* ───────────────────────── CALLS ─────────────────────────── */

export const registerFcmToken = async (token: string, fcmToken: string, platform?: string) => {
    try {
        await request('/calls/fcm-token', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ fcmToken, platform }),
        });
    } catch {}
};

/** Remove this device's push token so calls/messages stop after logout. */
export const unregisterFcmToken = async (token: string, fcmToken: string) => {
    try {
        await request('/calls/fcm-token', {
            method: 'DELETE',
            headers: authHeaders(token),
            body: JSON.stringify({ fcmToken }),
        });
    } catch {}
};

export const initiateCall = async (token: string, calleeId: string) => {
    try {
        const body = await request('/calls/initiate', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ calleeId }),
        });
        return { success: true, data: body?.data ?? null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

/** GET /calls/:id — check a call's current status (e.g. still RINGING?). */
export const getCall = async (token: string, callId: string) => {
    try {
        const body = await request(`/calls/${callId}`, { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data ?? null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

export const acceptCall = async (token: string, callId: string) => {
    try {
        const body = await request(`/calls/${callId}/accept`, {
            method: 'POST',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data ?? null };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

export const declineCall = async (token: string, callId: string) => {
    try {
        await request(`/calls/${callId}/decline`, { method: 'POST', headers: authHeaders(token) });
    } catch {}
};

export const endCall = async (token: string, callId: string) => {
    try {
        await request(`/calls/${callId}/end`, { method: 'POST', headers: authHeaders(token) });
    } catch {}
};

export const deleteAccount = async (token: string) => {
    try {
        await request('/auth/account', { method: 'DELETE', headers: authHeaders(token) });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────── PRIVACY SETTINGS ─────────────────────── */

export interface PrivacySettings {
    isDiscoverable: boolean;
    showOnlineStatus: boolean;
    shareDataForPersonalization: boolean;
    pushNotificationsEnabled: boolean;
    notifyCategoryPosts: boolean;
    preferredLanguage: string;
}

export const getPrivacySettings = async (token: string) => {
    try {
        const body = await request('/users/me/privacy-settings', { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: body?.data as PrivacySettings };
    } catch (error: any) {
        return { success: false, error: error.message, data: null };
    }
};

export const updatePrivacySettings = async (token: string, data: Partial<PrivacySettings>) => {
    try {
        const body = await request('/users/me/privacy-settings', {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        });
        return { success: true, data: body?.data as PrivacySettings };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * "Download My Data" — fetches the export JSON directly (not through the
 * shared request() helper, since that unwraps { data } and this response
 * is the raw export itself, not the standard API envelope), saves it to a
 * temp file, and opens the native share sheet so the user can save/send it
 * — there's no browser "Downloads" folder concept on mobile.
 */
export const downloadMyData = async (token: string) => {
    try {
        const res = await fetch(`${API_BASE_URL}/users/me/export`, { headers: authHeaders(token) });
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        const json = await res.text();

        const { File, Paths } = await import('expo-file-system');
        const Sharing = await import('expo-sharing');
        const file = new File(Paths.document, 'digitag-my-data.json');
        file.write(json);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Your DigiTag data' });
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ─────────────────────── NOTIFICATIONS ─────────────────────── */

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, string> | null;
    isRead: boolean;
    createdAt: string;
}

/** GET /notifications — durable history of every push sent to this user
 *  (new message, collab request/accepted/declined, new post). */
export const getNotifications = async (token: string, params: { cursor?: string; limit?: number } = {}) => {
    try {
        const qs = new URLSearchParams(params as any);
        const path = `/notifications${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET', headers: authHeaders(token) });
        return { success: true, data: (body?.data ?? []) as AppNotification[], nextCursor: body?.meta?.nextCursor ?? null };
    } catch (error: any) {
        return { success: false, error: error.message, data: [] as AppNotification[], nextCursor: null };
    }
};

export const markAllNotificationsRead = async (token: string) => {
    try {
        await request('/notifications/read-all', { method: 'POST', headers: authHeaders(token) });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const getUnreadNotificationCount = async (token: string) => {
    try {
        const body = await request('/notifications/unread-count', { method: 'GET', headers: authHeaders(token) });
        return { success: true, count: (body?.data?.count ?? 0) as number };
    } catch (error: any) {
        return { success: false, error: error.message, count: 0 };
    }
};

/* ─────────────────────── SUBSCRIPTIONS (Razorpay) ─────────────────────── */

export const createSubscription = async (token: string) => {
    try {
        const body = await request('/subscriptions', { method: 'POST', headers: authHeaders(token) });
        return { success: true, data: body?.data as { subscriptionId: string; keyId: string } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const getMySubscription = async (token: string) => {
    try {
        const body = await request('/subscriptions/me', { method: 'GET', headers: authHeaders(token) });
        return {
            success: true,
            data: body?.data as { isPremium: boolean; subscription: { status: string; currentStart: string | null; currentEnd: string | null } | null },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/** POST /subscriptions/apple/verify — after a StoreKit purchase, hands the
 *  transactionId to the backend, which asks Apple's own servers for the
 *  authoritative record rather than trusting anything the client claims. */
export const verifyApplePurchase = async (token: string, transactionId: string) => {
    try {
        const body = await request('/subscriptions/apple/verify', {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ transactionId }),
        });
        return { success: true, data: body?.data as { status: string; isPremium: boolean } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};