import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useIAP, type Purchase, type ProductSubscription } from 'expo-iap';
import { verifyApplePurchase } from '../services/userService';

// Must exactly match the subscription product id created in App Store
// Connect (Features > In-App Purchases). Placeholder until that product
// exists — purchases will fail with a clear "product not found" error from
// StoreKit until then, not a silent crash.
export const APPLE_PREMIUM_PRODUCT_ID = 'premium_monthly';

type PurchaseState = 'idle' | 'connecting' | 'purchasing' | 'verifying';

// expo-iap's transactionId is deprecated in favor of the unified `id` field —
// both are populated for iOS purchases today, but `id` is the field the spec
// is migrating to, so prefer it and fall back for safety.
function transactionIdOf(purchase: Purchase): string | null {
    return purchase.transactionId ?? purchase.id ?? null;
}

/** Owns the whole StoreKit purchase lifecycle: connection, product fetch,
 *  purchase request, backend verification, and finishing the transaction.
 *  iOS only — Android/web use the existing Razorpay flow. expo-iap's useIAP
 *  hook auto-connects to the store on mount regardless of platform (it's a
 *  real cross-platform Expo Module, unlike the old Nitro-based
 *  react-native-iap which isn't supported under Expo Dev Client at all) —
 *  the `enabled`/Platform.OS gates below only decide whether *we* act on it,
 *  not whether the hook itself is mounted (Rules of Hooks). */
export function useApplePurchase(token: string | null, enabled: boolean) {
    const [state, setState] = useState<PurchaseState>('idle');
    const [error, setError] = useState<string | null>(null);
    const onPremiumRef = useRef<((isPremium: boolean) => void) | null>(null);
    const tokenRef = useRef(token);
    tokenRef.current = token;
    const finishRef = useRef<(purchase: Purchase) => Promise<void>>(async () => {});
    const restoringRef = useRef(false);

    const {
        connected,
        subscriptions,
        fetchProducts,
        requestPurchase,
        finishTransaction,
        getAvailablePurchases,
        availablePurchases,
    } = useIAP({
        onPurchaseSuccess: async (purchase: Purchase) => {
            const transactionId = transactionIdOf(purchase);
            if (!tokenRef.current || !transactionId) return;
            setState('verifying');
            try {
                const res = await verifyApplePurchase(tokenRef.current, transactionId);
                if (res.success && res.data?.isPremium) {
                    onPremiumRef.current?.(true);
                    // Tells StoreKit we've delivered the goods — must happen only
                    // after our backend confirms Premium is actually active, or a
                    // failed verification would still let StoreKit stop redelivering
                    // the purchase event on next app launch.
                    await finishRef.current(purchase);
                } else {
                    setError(res.error || 'Could not verify this purchase.');
                }
            } catch (e: any) {
                setError(e?.message || 'Could not verify this purchase.');
            } finally {
                setState('idle');
            }
        },
        onPurchaseError: (e) => {
            // User cancelling the native sheet is not a real error.
            if (!/cancel/i.test(e.message || '')) setError(e.message || 'Purchase failed.');
            setState('idle');
        },
    });

    useEffect(() => {
        finishRef.current = (purchase) => finishTransaction({ purchase, isConsumable: false });
    }, [finishTransaction]);

    useEffect(() => {
        // Also gated on the remote PREMIUM_ENABLED flag — while Premium is
        // paused, never fetch the product at all.
        if (Platform.OS !== 'ios' || !enabled || !connected) return;
        fetchProducts({ skus: [APPLE_PREMIUM_PRODUCT_ID], type: 'subs' }).catch((e: any) => {
            setError(e?.message || 'Could not connect to the App Store.');
        });
    }, [enabled, connected, fetchProducts]);

    // getAvailablePurchases() resolves to void and updates `availablePurchases`
    // state asynchronously (per expo-iap's own hook semantics) — reading that
    // state right after awaiting the call would see a stale closure, so restore
    // logic reacts to the state change instead of the call's own resolution.
    useEffect(() => {
        if (!restoringRef.current) return;
        restoringRef.current = false;
        (async () => {
            const mine = availablePurchases.filter((p) => p.productId === APPLE_PREMIUM_PRODUCT_ID);
            if (!mine.length) {
                setError('No previous purchase found for this Apple ID.');
                setState('idle');
                return;
            }
            for (const p of mine) {
                const transactionId = transactionIdOf(p);
                if (!transactionId || !tokenRef.current) continue;
                const res = await verifyApplePurchase(tokenRef.current, transactionId);
                if (res.success && res.data?.isPremium) onPremiumRef.current?.(true);
            }
            setState('idle');
        })();
    }, [availablePurchases]);

    const product: ProductSubscription | null =
        subscriptions.find((s) => s.id === APPLE_PREMIUM_PRODUCT_ID) ?? null;

    const purchase = useCallback(async (onPremium: (isPremium: boolean) => void) => {
        if (Platform.OS !== 'ios' || !enabled) return;
        onPremiumRef.current = onPremium;
        setError(null);
        setState('purchasing');
        try {
            await requestPurchase({
                type: 'subs',
                request: { ios: { sku: APPLE_PREMIUM_PRODUCT_ID } },
            });
            // Resolution happens in onPurchaseSuccess above, not here —
            // requestPurchase only confirms the native sheet was shown.
        } catch (e: any) {
            if (!/cancel/i.test(e?.message || '')) setError(e?.message || 'Could not start checkout.');
            setState('idle');
        }
    }, [enabled, requestPurchase]);

    /** Apple requires a way to restore prior purchases (a fresh install, or a
     *  user who reinstalled) — re-verifies every still-active purchase found. */
    const restore = useCallback(async (onPremium: (isPremium: boolean) => void) => {
        if (Platform.OS !== 'ios' || !token || !enabled) return;
        onPremiumRef.current = onPremium;
        setError(null);
        setState('verifying');
        restoringRef.current = true;
        try {
            await getAvailablePurchases();
        } catch (e: any) {
            restoringRef.current = false;
            setError(e?.message || 'Could not restore purchases.');
            setState('idle');
        }
    }, [token, enabled, getAvailablePurchases]);

    return { state, error, product, purchase, restore };
}
