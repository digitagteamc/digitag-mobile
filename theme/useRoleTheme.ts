import { useAuth } from '../context/AuthContext';
import { DEFAULT_ROLE, Role, RolePalette, rolePalettes } from './colors';

/**
 * Returns the color palette for the logged-in user's role.
 * Theme always follows the viewer's own role — Creator=purple, Freelancer=orange —
 * regardless of whose profile is being viewed.
 * Pass an explicit role only in rare admin/preview contexts.
 */
export function useRoleTheme(explicitRole?: Role | string | null): RolePalette {
    const { userRole } = useAuth();
    const resolved = normalizeRole(explicitRole) ?? normalizeRole(userRole) ?? DEFAULT_ROLE;
    return rolePalettes[resolved];
}

/** Resolve a raw role string (or null) to a valid Role, or null if unknown. */
export function normalizeRole(value: string | null | undefined): Role | null {
    if (!value) return null;
    const upper = value.toUpperCase();
    if (upper === 'CREATOR' || upper === 'FREELANCER') return upper;
    return null;
}

/** Non-hook variant for use in places where hooks aren't available. */
export function getRoleTheme(role: Role | string | null | undefined): RolePalette {
    return rolePalettes[normalizeRole(role) ?? DEFAULT_ROLE];
}
