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

async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, options);
    let json: any = null;
    try { json = await res.json(); } catch { /* empty body */ }
    if (!res.ok) {
        throw new ApiRequestError(
            json?.message || `Request failed: ${res.status}`,
            res.status,
            json?.details ?? null,
        );
    }
    return json;
}

function authHeaders(token: string): Headers {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

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
        console.error('❌ requestOtp error:', error.message);
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
        console.error('❌ verifyOtp error:', error.message);
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
export const getUserStats = async (token: string, id?: string) => {
    try {
        const path = id ? `/users/${id}/stats` : '/users/me/stats';
        const body = await request(path, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data as { followerCount: number; followingCount: number; collabCount: number } | null };
    } catch (error: any) {
        return { success: false, data: null, error: error.message };
    }
};

/** GET /users/:id */
export const getUserById = async (id: string, token: string) => {
    try {
        const body = await request(`/users/${id}`, {
            method: 'GET',
            headers: authHeaders(token),
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
        console.error('❌ submitCreatorApplication error:', error.message);
        return { success: false, error: error.message };
    }
};

/** PUT /creators/profile */
export const updateCreatorProfile = async (data: any, token: string) => {
    try {
        const body = await request('/creators/profile', {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
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
        return { success: false, error: error.message };
    }
};

/** PUT /freelancers/profile */
export const updateFreelancerProfile = async (data: any, token: string) => {
    try {
        const body = await request('/freelancers/profile', {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify(data),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
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
};

/**
 * POST /posts — accepts an optional local image file URI that will be sent
 * via multipart/form-data (field name "image"). Without an image, sends JSON.
 */
export const createPost = async (
    payload: PostPayload,
    token: string,
    imageFile?: { uri: string; name?: string; type?: string },
) => {
    try {
        const url = `${API_BASE_URL}/posts`;
        let res: Response;
        if (imageFile) {
            const form = new FormData();
            form.append('description', payload.description);
            if (payload.location) form.append('location', payload.location);
            if (payload.collaborationType) form.append('collaborationType', payload.collaborationType);
            form.append('image', {
                uri: imageFile.uri,
                name: imageFile.name || 'upload.jpg',
                type: imageFile.type || 'image/jpeg',
            } as any);
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
    token: string,
    params: Record<string, string> = {},
) => {
    try {
        const qs = new URLSearchParams(params);
        const path = `/posts/user/${userId}${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET', headers: authHeaders(token) });
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
export const getPostById = async (id: string, token: string) => {
    try {
        const body = await request(`/posts/${id}`, {
            method: 'GET',
            headers: authHeaders(token),
        });
        return { success: true, data: body?.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/* ───────────────────────── FEED ───────────────────────────── */

/** GET /feed */
export const getFeed = async (token: string, params: Record<string, string> = {}) => {
    try {
        const qs = new URLSearchParams(params);
        const path = `/feed${qs.toString() ? `?${qs}` : ''}`;
        const body = await request(path, { method: 'GET', headers: authHeaders(token) });
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
) => {
    try {
        const form = new FormData();
        form.append('image', {
            uri: file.uri,
            name: file.name || 'upload.jpg',
            type: file.type || 'image/jpeg',
        } as any);
        const res = await fetch(`${API_BASE_URL}/uploads/image`, {
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

/** GET /collaborations/with/:userId — latest collab between me and other user (or null) */
export const getCollaborationWith = async (token: string, userId: string) => {
    try {
        const body = await request(`/collaborations/with/${userId}`, {
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

/** POST /conversations/:id/messages */
export const sendMessage = async (token: string, conversationId: string, content: string) => {
    try {
        const body = await request(`/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ content }),
        });
        return { success: true, data: body?.data };
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
