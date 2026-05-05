import { api } from './client';

export interface Song {
  hash: string;
  fileName: string;
  albumAudioId: string;
  duration: number;
  albumId?: string;
  imgUrl?: string;
}

export interface SearchResult {
  total: number;
  songs: Song[];
}

export async function search(keywords: string, page = 1): Promise<SearchResult> {
  const res = await api('/search', { keywords, page, pagesize: 30 });
  const lists = res?.data?.lists || [];
  return {
    total: res?.data?.total || 0,
    songs: lists.map((item: any) => ({
      hash: item.FileHash || item.Hash,
      fileName: item.FileName || '',
      albumAudioId: item.AlbumAudioId || item.album_audio_id || '',
      duration: item.Duration || 0,
      albumId: item.AlbumID || '',
      imgUrl: item.Image?.replace('{size}', '480') || '',
    })),
  };
}

export interface SongUrl {
  url: string;
  bitRate: number;
  extName: string;
  fileSize: number;
}

export async function getSongUrl(hash: string, albumAudioId?: string, quality = '320'): Promise<SongUrl | null> {
  const params: Record<string, string | number> = { hash, quality };
  if (albumAudioId) params.album_audio_id = albumAudioId;
  const res = await api('/song/url', params);
  const data = res?.data || res;
  if (!data?.url) return null;
  const url = Array.isArray(data.url) ? data.url[0] : data.url;
  return {
    url,
    bitRate: data.bitRate || 0,
    extName: data.extName || 'mp3',
    fileSize: data.fileSize || 0,
  };
}

export interface LyricLine {
  time: number;
  text: string;
}

export async function getLyric(hash: string, albumAudioId?: string): Promise<LyricLine[]> {
  try {
    const searchParams: Record<string, string | number> = { hash };
    if (albumAudioId) searchParams.album_audio_id = albumAudioId;
    const searchRes = await api('/search/lyric', searchParams);
    const candidates = searchRes?.candidates || [];
    if (candidates.length === 0) return [];

    const { id, accesskey } = candidates[0];
    const lyricRes = await api('/lyric', { id, accesskey, fmt: 'lrc', decode: 'true' });
    const lrc = lyricRes?.decodeContent || '';
    return parseLrc(lrc);
  } catch {
    return [];
  }
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(lrc)) !== null) {
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const ms = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
    const text = match[4].trim();
    if (text) {
      lines.push({ time: min * 60000 + sec * 1000 + ms, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}
