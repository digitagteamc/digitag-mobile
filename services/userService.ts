const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.warn('EXPO_PUBLIC_API_BASE_URL is not defined in .env');
}

/** 1. Request OTP */
export const requestOtp = async (phoneNumber: string) => {
    try {
        console.log(`📱 Requesting OTP for ${phoneNumber}...`);
        const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to request OTP");
        console.log(`✅ OTP requested successfully`);
        return { success: true, ...data };
    } catch (error: any) {
        console.error("❌ requestOtp error:", error.message);
        return { success: false, error: error.message };
    }
};

/** Fetch full user profile */
export const getFullProfile = async (token: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/user/me/full`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        }
        return { success: false, error: "Failed to fetch profile" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/** 2. Verify OTP & Get Token */
export const verifyOtp = async (phoneNumber: string, otp: string) => {
    try {
        console.log(`🔐 Verifying OTP for ${phoneNumber}...`);
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, otp }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Invalid OTP");

        const resAny = data as any;
        const token = resAny.token || resAny.accessToken || resAny.access_token || resAny.jwt || '';

        console.log(`✅ OTP verified. Token: ${token ? 'yes' : 'NOT PROVIDED'}`);
        console.log(`   isNewUser: ${resAny.isNewUser}, needsRegistration: ${resAny.needsRegistration}`);

        return {
            success: true,
            token,
            user: resAny.user,
            isNewUser: resAny.isNewUser,
            needsRegistration: resAny.isNewUser || resAny.needsRegistration,
        };
    } catch (error: any) {
        console.error("❌ verifyOtp error:", error.message);
        return { success: false, error: error.message };
    }
};

/**
 * 3. Register User Role
 * Must be called BEFORE registerBrand (brand backend requires user with BRAND role to exist)
 * For creators, this is called inside submitCreatorApplication on the backend
 */
export const registerUserRole = async (phoneNumber: string, role: 'CREATOR' | 'BRAND', token: string) => {
    try {
        console.log(`👤 Registering role ${role} for ${phoneNumber}...`);
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ phoneNumber, role }),
        });

        const data = await response.json();
        console.log(`📡 Register response (${response.status}):`, JSON.stringify(data));

        if (!response.ok) throw new Error(data.message || "Failed to register role");

        const userId = data.userId || data.id || (data.user && data.user.id);
        console.log(`✅ Role registered. userId: ${userId}`);

        return { success: true, userId, data };
    } catch (error: any) {
        console.error("❌ Role Registration Error:", error.message);
        throw error;
    }
};

/** 4. Submit Creator Application (backend also creates the User if needed) */
export const submitCreatorApplication = async (formData: any, token: string) => {
    try {
        console.log("🚀 Submitting Creator Application...");
        console.log("   Payload:", JSON.stringify(formData, null, 2));

        const response = await fetch(`${API_BASE_URL}/creators/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("❌ Creator Submission Failed:", JSON.stringify(result));
            throw new Error(result.message || "Creator submission failed.");
        }

        console.log("✅ Creator application submitted:", JSON.stringify(result));
        return { success: true, data: result };
    } catch (error: any) {
        console.error("❌ submitCreatorApplication error:", error.message);
        return { success: false, error: error.message };
    }
};

/**
 * 5. Register Brand Profile
 * Backend requires: User must already exist with BRAND role
 * So always call registerUserRole FIRST, then this
 */
export const registerBrand = async (formData: {
    phoneNumber: string;
    brandName: string;
    pan: string;
    gstin?: string;
    city?: string;
    state?: string;
}, token: string) => {
    try {
        console.log("🏢 Submitting Brand Registration...");
        console.log("   Payload:", JSON.stringify(formData, null, 2));

        const response = await fetch(`${API_BASE_URL}/brands/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();
        console.log(`📡 Brand register response (${response.status}):`, JSON.stringify(data));

        if (!response.ok) throw new Error(data.message || "Brand registration failed");

        return { success: true, data };
    } catch (error: any) {
        console.error("❌ registerBrand error:", error.message);
        return { success: false, error: error.message };
    }
};

/** 6. Check Creator Status (PENDING/APPROVED/REJECTED) */
export const checkCreatorStatus = async (token: string) => {
    try {
        console.log("🔍 Checking creator status...");
        const response = await fetch(`${API_BASE_URL}/creators/me/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const result = await response.json();
            console.log("✅ Creator status:", JSON.stringify(result));
            return { success: true, data: result };
        }

        console.warn(`⚠️ Creator status check failed: ${response.status}`);
        return { success: false, error: `Status check failed (${response.status})` };
    } catch (error: any) {
        console.error("❌ checkCreatorStatus error:", error.message);
        return { success: false, error: error.message };
    }
};

/** 7. Check Brand Status (PENDING/APPROVED/REJECTED) */
export const checkBrandStatus = async (token: string) => {
    try {
        console.log("🔍 Checking brand status...");
        const response = await fetch(`${API_BASE_URL}/brands/me/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const result = await response.json();
            console.log("✅ Brand status:", JSON.stringify(result));
            return { success: true, data: result };
        }

        console.warn(`⚠️ Brand status check failed: ${response.status}`);
        return { success: false, error: `Status check failed (${response.status})` };
    } catch (error: any) {
        console.error("❌ checkBrandStatus error:", error.message);
        return { success: false, error: error.message };
    }

};

/** 8. Submit Collaboration Request (Brand -> Creator) */
export const submitCollabRequest = async (token: string, payload: {
    creatorId: string;
    requirement: string;
    budget?: string;
    timeline?: string;
    message?: string;
}) => {
    try {
        console.log("📨 Submitting collaboration request...");
        const response = await fetch(`${API_BASE_URL}/collaborations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to send collab request");

        return { success: true, data: result };
    } catch (error: any) {
        console.error("❌ submitCollabRequest error:", error.message);
        return { success: false, error: error.message };
    }
};

/** 9. Check Collaboration Status (Brand -> Creator) */
export const checkCollabStatus = async (token: string, creatorId: string) => {
    try {
        console.log(`🔍 Checking collab status with ${creatorId}...`);
        const response = await fetch(`${API_BASE_URL}/collaborations/check/${creatorId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }
        return { success: false, error: "Failed to check status" };
    } catch (error: any) {
        console.error("❌ checkCollabStatus error:", error.message);
        return { success: false, error: error.message };
    }
};

/** 10. Fetch Collab Inbox (For Creators) */
export const fetchCollabInbox = async (token: string) => {
    try {
        console.log("📥 Fetching collaboration inbox...");
        const response = await fetch(`${API_BASE_URL}/collaborations/inbox`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            const result = await response.json();
            return { success: true, data: result };
        }
        return { success: false, error: "Failed to fetch inbox" };
    } catch (error: any) {
        console.error("❌ fetchCollabInbox error:", error.message);
        return { success: false, error: error.message };
    }
};

/** 11. Respond to Collab (Approve/Reject) */
export const respondToCollab = async (token: string, requestId: string, action: 'approve' | 'reject') => {
    try {
        console.log(`📡 Responding to collab ${requestId} with ${action}...`);
        const response = await fetch(`${API_BASE_URL}/collaborations/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to respond");

        return { success: true, data };
    } catch (error: any) {
        console.error("❌ respondToCollab error:", error.message);
        return { success: false, error: error.message };
    }
};