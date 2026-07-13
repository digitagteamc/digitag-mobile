import * as ImageManipulator from 'expo-image-manipulator';

// Modern phone cameras (48MP+ is now common on both iOS and Android) can produce
// files well over the backend's 5MB upload limit even after ImagePicker's JPEG
// quality compression, since quality alone doesn't shrink pixel dimensions. Downscaling
// to a sane max width before upload keeps every picked photo comfortably under the
// limit regardless of source resolution or platform.
const MAX_DIMENSION = 1280;

/** Resize + re-compress a picked image so it reliably fits the backend's upload
 *  size limit. Same behavior on iOS and Android — expo-image-manipulator is a
 *  single cross-platform API, no OS-specific branching needed.
 *
 *  `width`/`height` should come from the ImagePicker asset when available, so a
 *  photo already smaller than MAX_DIMENSION is only re-compressed, never
 *  upscaled (upscaling would grow the file for no quality benefit). */
export async function prepareImageForUpload(uri: string, width?: number, height?: number): Promise<string> {
    try {
        const needsResize = !width || !height || Math.max(width, height) > MAX_DIMENSION;
        const actions = needsResize ? [{ resize: { width: MAX_DIMENSION } }] : [];
        const result = await ImageManipulator.manipulateAsync(
            uri,
            actions,
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        return result.uri;
    } catch {
        // If manipulation fails for any reason, fall back to the original —
        // better to attempt the upload than to block the user entirely.
        return uri;
    }
}
