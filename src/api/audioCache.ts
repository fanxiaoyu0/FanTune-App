import * as FileSystem from 'expo-file-system';

const CACHE_DIR = `${FileSystem.cacheDirectory}audio/`;
let dirReady = false;

async function ensureDir() {
  if (dirReady) return;
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  dirReady = true;
}

function cacheKey(hash: string, quality: string) {
  return `${hash}_${quality}`;
}

export async function getCachedUri(hash: string, quality: string): Promise<string | null> {
  try {
    await ensureDir();
    const ext = quality === 'flac' ? 'flac' : 'mp3';
    const localPath = `${CACHE_DIR}${cacheKey(hash, quality)}.${ext}`;
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists && info.size && info.size > 10000) {
      return localPath;
    }
  } catch {}
  return null;
}

export function cacheInBackground(hash: string, quality: string, remoteUrl: string) {
  ensureDir().then(() => {
    const ext = quality === 'flac' ? 'flac' : 'mp3';
    const localPath = `${CACHE_DIR}${cacheKey(hash, quality)}.${ext}`;
    FileSystem.downloadAsync(remoteUrl, localPath).catch(() => {});
  });
}
