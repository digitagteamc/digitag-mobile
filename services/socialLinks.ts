/**
 * Builds a working YouTube URL from whatever is stored in youtubeHandle:
 * a full URL (manual entry), an @handle or bare handle, or a UC… channel ID
 * (OAuth verification stores the channel ID when the channel has no handle —
 * channel IDs only resolve under /channel/, not /@).
 */
export const youtubeUrl = (handle: string) => {
    const v = handle.trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (/youtube\.com|youtu\.be/i.test(v)) return `https://${v}`;
    if (/^UC[\w-]{22}$/.test(v)) return `https://youtube.com/channel/${v}`;
    return `https://youtube.com/@${v.replace(/^@/, '')}`;
};

/**
 * Same idea for Facebook: OAuth verification stores the numeric account id
 * (facebook.com/<id> resolves it), manual/legacy data may be a username or URL.
 */
export const facebookUrl = (handle: string) => {
    const v = handle.trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (/facebook\.com|fb\.com/i.test(v)) return `https://${v}`;
    return `https://facebook.com/${v.replace(/^@/, '')}`;
};

/**
 * Instagram: users paste full profile links into the handle field, and the
 * old raw `instagram.com/${handle}` produced doubled, broken URLs for them
 * (while the same link under Portfolio opened fine — a visible mismatch).
 */
export const instagramUrl = (handle: string) => {
    const v = handle.trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (/instagram\.com/i.test(v)) return `https://${v}`;
    return `https://instagram.com/${v.replace(/^@/, '')}`;
};

/** X / Twitter — same normalization. */
export const twitterUrl = (handle: string) => {
    const v = handle.trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (/twitter\.com|x\.com/i.test(v)) return `https://${v}`;
    return `https://x.com/${v.replace(/^@/, '')}`;
};

export interface SocialLink {
    key: string;
    icon: string;
    color: string;
    url: string;
}

/**
 * Builds a Creator's social-links list (Instagram/YouTube/Facebook/Twitter)
 * from a fetched profile (the shape returned by getUserById/getFullProfile).
 * Used wherever "Portfolio" is tapped on a Creator's profile — creators don't
 * have a real portfolio the way freelancers do (no portfolio-image upload,
 * no portfolio URL field in creator signup), so their social accounts are
 * shown instead.
 */
export function buildCreatorSocialLinks(profileData: any): SocialLink[] {
    const links: SocialLink[] = [];
    const p = profileData?.creatorProfile || profileData?.freelancerProfile || {};
    const igAccounts = Array.isArray(profileData?.instagramAccounts) ? profileData.instagramAccounts : [];
    if (igAccounts.length > 0) {
        igAccounts.forEach((acc: { id?: string; instagramUsername: string }, i: number) => {
            links.push({ key: `ig-${acc.id || i}`, icon: 'logo-instagram', color: '#E4405F', url: instagramUrl(acc.instagramUsername) });
        });
    } else if (p.instagramHandle) {
        links.push({ key: 'ig', icon: 'logo-instagram', color: '#E4405F', url: instagramUrl(p.instagramHandle) });
    }
    if (p.youtubeHandle) links.push({ key: 'yt', icon: 'logo-youtube', color: '#FF0000', url: youtubeUrl(p.youtubeHandle) });
    if (p.facebookHandle) links.push({ key: 'fb', icon: 'logo-facebook', color: '#1877F2', url: facebookUrl(p.facebookHandle) });
    if (p.twitterHandle) links.push({ key: 'tw', icon: 'logo-twitter', color: '#000000', url: twitterUrl(p.twitterHandle) });
    return links;
}
