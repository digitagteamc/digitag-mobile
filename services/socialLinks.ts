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
