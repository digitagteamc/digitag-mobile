import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export async function downloadImageToGallery(url: string): Promise<{ success: boolean; error?: string }> {
    try {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (!perm.granted) {
            return { success: false, error: 'permission_denied' };
        }

        const file = await File.downloadFileAsync(url, Paths.cache);
        await MediaLibrary.saveToLibraryAsync(file.uri);
        file.delete();
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err?.message || 'download_failed' };
    }
}
