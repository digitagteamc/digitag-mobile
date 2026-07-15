import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
    endConnection,
    finishTransaction,
    getAvailablePurchases,
    getSubscriptions,
    initConnection,
    Purchase,
    purchaseErrorListener,
    purchaseUpdatedListener,
    requestSubscription,
    Subscription,
} from 'react-native-iap';
import { verifyApplePurchase } from '../services/userService';

// Must exactly match the subscription product id created in App Store
// Connect (Features > In-App Purchases). Placeholder until that product
// exists — purchases will fail with a clear "product not found" error from
// StoreKit until then, not a silent crash.
export const APPLE_PREMIUM_PRODUCT_ID = 'premium_monthly';

type PurchaseState = 'idle' | 'connecting' | 'purchasing' | 'verifying';

/** Owns the whole StoreKit purchase lifecycle: connection, product fetch,
 *  purchase request, backend verification, and finishing the transaction.
 *  iOS only — Android/web use the existing Razorpay flow. */
export function useApplePurchase(token: string | null, enabled: boolean) {
    const [state, setState] = useState<PurchaseState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [product, setProduct] = useState<Subscription | null>(null);
    const onPremiumRef = useRef<((isPremium: boolean) => void) | null>(null);

    useEffect(() => {
        // Also gated on the remote PREMIUM_ENABLED flag — while Premium is
        // paused, never touch the native IAP module at all. Matters doubly
        // right now: no real subscription product exists in App Store Connect
        // yet, so there's nothing productive an early connection would do.
        if (Platform.OS !== 'ios' || !enabled) return;
        let mounted = true;

        const verifyAndFinish = async (purchase: Purchase) => {
            if (!token || !purchase.transactionId) return;
            setState('verifying');
            try {
                const res = await verifyApplePurchase(token, purchase.transactionId);
                if (res.success && res.data?.isPremium) {
                    onPremiumRef.current?.(true);
                    // Tells StoreKit we've delivered the goods — must happen only
                    // after our backend confirms Premium is actually active, or a
                    // failed verification would still let StoreKit stop redelivering
                    // the purchase event on next app launch.
                    await finishTransaction({ purchase, isConsumable: false });
                } else {
                    setError(res.error || 'Could not verify this purchase.');
                }
            } catch (e: any) {
                setError(e?.message || 'Could not verify this purchase.');
            } finally {
                if (mounted) setState('idle');
            }
        };

        initConnection()
            .then(() => getSubscriptions({ skus: [APPLE_PREMIUM_PRODUCT_ID] }))
            .then((subs) => { if (mounted && subs?.[0]) setProduct(subs[0]); })
            .catch((e) => { if (mounted) setError(e?.message || 'Could not connect to the App Store.'); });

        const updateSub = purchaseUpdatedListener(verifyAndFinish);
        const errorSub = purchaseErrorListener((e) => {
            // User cancelling the native sheet is not a real error.
            if (mounted && !/cancel/i.test(e.message || '')) setError(e.message || 'Purchase failed.');
            if (mounted) setState('idle');
        });

        return () => {
            mounted = false;
            updateSub.remove();
            errorSub.remove();
            endConnection();
        };
    }, [token, enabled]);

    const purchase = useCallback(async (onPremium: (isPremium: boolean) => void) => {
        if (Platform.OS !== 'ios' || !enabled) return;
        onPremiumRef.current = onPremium;
        setError(null);
        setState('purchasing');
        try {
            await requestSubscription({ sku: APPLE_PREMIUM_PRODUCT_ID });
            // Resolution happens in purchaseUpdatedListener above, not here —
            // requestSubscription only confirms the native sheet was shown.
        } catch (e: any) {
            if (!/cancel/i.test(e?.message || '')) setError(e?.message || 'Could not start checkout.');
            setState('idle');
        }
    }, [enabled]);

    /** Apple requires a way to restore prior purchases (a fresh install, or a
     *  user who reinstalled) — re-verifies every still-active purchase found. */
    const restore = useCallback(async (onPremium: (isPremium: boolean) => void) => {
        if (Platform.OS !== 'ios' || !token || !enabled) return;
        setError(null);
        setState('verifying');
        try {
            const purchases = await getAvailablePurchases();
            const mine = purchases.filter((p) => p.productId === APPLE_PREMIUM_PRODUCT_ID);
            if (!mine.length) {
                setError('No previous purchase found for this Apple ID.');
                return;
            }
            for (const p of mine) {
                if (!p.transactionId) continue;
                const res = await verifyApplePurchase(token, p.transactionId);
                if (res.success && res.data?.isPremium) onPremium(true);
            }
        } catch (e: any) {
            setError(e?.message || 'Could not restore purchases.');
        } finally {
            setState('idle');
        }
    }, [token, enabled]);

    return { state, error, product, purchase, restore };
}
