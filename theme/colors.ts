/**
 * Centralized color tokens. Any new screen or component should pull colors
 * from here (or via `useRoleTheme`) rather than hard-coding hex values.
 *
 * Role themes:
 *   - Creator    → purple
 *   - Freelancer → orange
 *
 * Role-agnostic surfaces (backgrounds, typography, borders, semantic colors)
 * live under `palette`.
 */

export type Role = 'CREATOR' | 'FREELANCER';

export interface RolePalette {
    primary: string;     // solid action color
    hover: string;       // darker action for pressed/hover
    soft: string;        // tinted background (translucent)
    softStrong: string;  // tinted background (opaque-ish)
    border: string;      // translucent border tint
    onPrimary: string;   // text color on primary surface
}

export const rolePalettes: Record<Role, RolePalette> = {
    CREATOR: {
        primary: '#7352DD',
        hover: '#5C3DC4',
        soft: 'rgba(115, 82, 221, 0.12)',
        softStrong: 'rgba(115, 82, 221, 0.20)',
        border: 'rgba(115, 82, 221, 0.55)',
        onPrimary: '#FFFFFF',
    },
    FREELANCER: {
        primary: '#F26930',
        hover: '#DE5518',
        soft: 'rgba(242, 105, 48, 0.12)',
        softStrong: 'rgba(242, 105, 48, 0.20)',
        border: 'rgba(242, 105, 48, 0.55)',
        onPrimary: '#FFFFFF',
    },
};

export const palette = {
    // Surfaces
    background: '#0A0A10',
    surface: '#1C1C24',
    surfaceAlt: '#14141C',
    surfaceRaised: '#1E1E28',

    // Borders
    border: '#262631',
    borderSoft: 'rgba(255, 255, 255, 0.08)',
    borderStrong: '#30303A',

    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B8C6',
    textMuted: '#8A8A99',
    textSubtle: '#6B6B7A',

    // Semantic
    success: '#00A401',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#60A5FA',
};

/** Font family tokens. */
export const fonts = {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_600SemiBold',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
};

/** Spacing scale — use these instead of magic numbers. */
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
};

export const radii = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
};

/** Default viewer role theme when no profile is visible (home, explore, messages, etc.).
 *  We pick purple as the neutral app accent. */
export const DEFAULT_ROLE: Role = 'CREATOR';
