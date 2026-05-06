import { api } from './client';

export interface Song {
  hash: string;
  fileName: string;
  albumAudioId: string;
  duration: number;
  albumId?: string;
  imgUrl?: string;
  mixSongId?: string;
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
      mixSongId: String(item.MixSongID || item.album_audio_id || ''),
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

export interface Playlist {
  name: string;
  listid: string;
  count: number;
  gcid: string;
}

export async function getUserPlaylists(): Promise<Playlist[]> {
  const res = await api('/user/playlist');
  const info = res?.data?.info || res?.data || [];
  if (!Array.isArray(info)) return [];
  return info.map((p: any) => ({
    name: p.name || '',
    listid: String(p.listid || ''),
    count: p.count || p.total || 0,
    gcid: p.global_collection_id || '',
  }));
}

export async function getPlaylistTracks(gcid: string, page = 1): Promise<Song[]> {
  const res = await api('/playlist/track/all', { id: gcid, page, pagesize: 50 });
  const songs = res?.data?.songs || [];
  return songs.map((s: any) => ({
    hash: s.hash || '',
    fileName: s.name || s.filename || '',
    albumAudioId: String(s.add_mixsongid || s.album_audio_id || ''),
    duration: s.duration || Math.round((s.size || 0) / 16000),
    albumId: String(s.album_id || ''),
    imgUrl: '',
  }));
}

export async function getUserHistory(): Promise<Song[]> {
  const res = await api('/user/history');
  const songs = res?.data?.songs || [];
  return songs.map((s: any) => {
    const info = s.info || {};
    const singer = info.singername || '';
    const name = info.name || '';
    return {
      hash: info.hash || '',
      fileName: singer && name ? `${singer} - ${name}` : name || singer,
      albumAudioId: String(s.mxid || ''),
      duration: info.duration || Math.round((info.size || 0) / 16000),
      albumId: '',
      imgUrl: '',
    };
  });
}

export async function getStyleRecommend(tagids?: string): Promise<Song[]> {
  const params: Record<string, string | number> = {};
  if (tagids) params.tagids = tagids;
  const res = await api('/everyday/style/recommend', params);
  const songs = res?.data?.song_list || [];
  return songs.map((s: any) => {
    const singer = s.author_name || '';
    const name = s.songname || '';
    return {
      hash: s.hash || '',
      fileName: singer && name ? `${singer} - ${name}` : name || singer,
      albumAudioId: String(s.album_audio_id || s.mixsongid || ''),
      duration: 0,
      albumId: String(s.album_id || ''),
      imgUrl: '',
    };
  });
}

export interface StyleTag {
  id: string;
  name: string;
}

export async function getStyleTags(): Promise<StyleTag[]> {
  const res = await api('/everyday/style/recommend');
  const tagInfo = res?.data?.tag_info || [];
  const tags: StyleTag[] = [];
  for (const group of tagInfo) {
    for (const child of (group.child || [])) {
      tags.push({ id: child.id || '', name: child.name || '' });
    }
  }
  return tags;
}

export async function getAiRecommend(albumAudioId: string): Promise<Song[]> {
  const res = await api('/ai/recommend', { album_audio_id: albumAudioId });
  const songs = res?.data?.info || res?.data || [];
  if (!Array.isArray(songs)) return [];
  return songs.map((s: any) => ({
    hash: s.hash || s.Hash || '',
    fileName: s.filename || s.FileName || s.name || '',
    albumAudioId: String(s.album_audio_id || s.mixsongid || ''),
    duration: s.duration || s.Duration || 0,
    albumId: String(s.album_id || ''),
    imgUrl: '',
  }));
}

export async function getSongClimax(hash: string): Promise<number | null> {
  try {
    const res = await api('/song/climax', { hash });
    const data = Array.isArray(res?.data) ? res.data[0] : res?.data;
    const start = data?.start_time || data?.start_ms || data?.start;
    return start ? Number(start) : null;
  } catch { return null; }
}

export async function submitPlayHistory(mxid: string) {
  try {
    await api('/playhistory/upload', { mxid });
  } catch {}
}

export interface Artist {
  id: number;
  name: string;
  avatar: string;
  songCount: number;
  fansCount: number;
}

export async function searchArtist(name: string): Promise<Artist | null> {
  try {
    const res = await api('/search', { keywords: name, type: 'author', pagesize: 1 });
    const a = res?.data?.lists?.[0];
    if (!a) return null;
    return {
      id: a.AuthorId || 0,
      name: a.AuthorName || name,
      avatar: a.Avatar || '',
      songCount: a.AudioCount || 0,
      fansCount: a.FansNum || 0,
    };
  } catch { return null; }
}

export async function getArtistSongs(id: number, page = 1): Promise<Song[]> {
  const res = await api('/artist/audios', { id, page, pagesize: 30, sort: 'hot' });
  const songs = res?.data?.info || [];
  return songs.map((s: any) => ({
    hash: s.hash || '',
    fileName: s.filename || '',
    albumAudioId: String(s.album_audio_id || ''),
    duration: s.duration || 0,
    albumId: String(s.album_id || ''),
    imgUrl: '',
  }));
}

export async function getAlbumSongs(albumId: string): Promise<{ name: string; songs: Song[] }> {
  const [detailRes, songsRes] = await Promise.all([
    api('/album/detail', { id: albumId }).catch(() => null),
    api('/album/songs', { id: albumId, pagesize: 50 }),
  ]);
  const songs = songsRes?.data?.info || [];
  return {
    name: detailRes?.data?.albumname || '',
    songs: songs.map((s: any) => ({
      hash: s.hash || '',
      fileName: s.filename || '',
      albumAudioId: String(s.album_audio_id || ''),
      duration: s.duration || 0,
      albumId: albumId,
      imgUrl: '',
    })),
  };
}

export interface Comment {
  id: string;
  userName: string;
  content: string;
  likeCount: number;
  time: string;
}

export async function getSongComments(mixsongid: string, page = 1): Promise<{ total: number; comments: Comment[] }> {
  const res = await api('/comment/music', { mixsongid, page, pagesize: 30 });
  const list = res?.list || [];
  return {
    total: res?.count || 0,
    comments: list.map((c: any) => ({
      id: String(c.id || c.tid || ''),
      userName: c.user_name || '',
      content: c.content || '',
      likeCount: c.like?.count || 0,
      time: c.addtime || '',
    })),
  };
}

export async function searchSuggest(keywords: string): Promise<string[]> {
  if (!keywords.trim()) return [];
  try {
    const res = await api('/search/suggest', { keywords });
    const records = res?.data?.[0]?.RecordDatas || [];
    return records.map((r: any) => r.HintInfo).filter(Boolean).slice(0, 8);
  } catch {
    return [];
  }
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
