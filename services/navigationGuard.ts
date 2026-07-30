import { router } from 'expo-router';

// Rapid multi-tap on a button/card fires several onPress calls before the
// first navigation actually transitions the screen, so each one queues its
// own router.push/replace/navigate — stacking duplicate screens (tap
// "Create Post" 3 times fast, get 3 Create Post screens on the stack).
//
// useRouter() and the imperative `router` import both resolve to this exact
// same singleton object (expo-router/build/hooks.js's useRouter() literally
// returns imperative-api.js's `router`), so patching it once here — imported
// for its side effect from app/_layout.tsx before anything else renders —
// debounces every navigation call in the app, regardless of which import
// style a given screen uses.
const NAV_DEBOUNCE_MS = 600;
let lastNavAt = 0;

function debounced<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
        const now = Date.now();
        if (now - lastNavAt < NAV_DEBOUNCE_MS) return;
        lastNavAt = now;
        return fn(...args);
    }) as T;
}

let installed = false;

export function installNavigationGuard() {
    if (installed) return;
    installed = true;
    router.push = debounced(router.push);
    router.replace = debounced(router.replace);
    router.navigate = debounced(router.navigate);
}
