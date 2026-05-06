import * as FileSystem from 'expo-file-system';

const CACHE_DIR = `${FileSystem.cacheDirectory}audio/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
}

function cacheKey(hash: string, quality: string) {
  return `${hash}_${quality}`;
}

export async function getCachedAudioUri(hash: string, quality: string, remoteUrl: string): Promise<string> {
  await ensureDir();
  const key = cacheKey(hash, quality);
  const ext = quality === 'flac' ? 'flac' : 'mp3';
  const localPath = `${CACHE_DIR}${key}.${ext}`;

  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists && info.size && info.size > 0) {
    return localPath;
  }

  const download = await FileSystem.downloadAsync(remoteUrl, localPath);
  return download.uri;
}
