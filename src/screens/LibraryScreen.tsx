import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getUserPlaylists, getPlaylistTracks, getUserHistory, getStyleRecommend, getStyleTags, getAiRecommend, Playlist, Song, StyleTag } from '../api/music';

type SubPage = { type: 'playlist'; playlist: Playlist } | { type: 'history' } | { type: 'style'; tag?: StyleTag } | { type: 'ai' };

interface Props {
  onPlay: (song: Song, queue: Song[]) => void;
  currentHash?: string;
  currentAlbumAudioId?: string;
}

export function LibraryScreen({ onPlay, currentHash, currentAlbumAudioId }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [styleTags, setStyleTags] = useState<StyleTag[]>([]);
  const [subPage, setSubPage] = useState<SubPage | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const trackCache = useRef<Record<string, Song[]>>({});

  useEffect(() => {
    Promise.all([
      getUserPlaylists().then(setPlaylists),
      getStyleTags().then(setStyleTags),
    ]).finally(() => setLoading(false));
  }, []);

  const openPlaylist = async (p: Playlist) => {
    setSubPage({ type: 'playlist', playlist: p });
    if (trackCache.current[p.gcid]) {
      setTracks(trackCache.current[p.gcid]);
      return;
    }
    setLoadingTracks(true);
    const t = await getPlaylistTracks(p.gcid);
    trackCache.current[p.gcid] = t;
    setTracks(t);
    setLoadingTracks(false);
  };

  const openHistory = async () => {
    setSubPage({ type: 'history' });
    setLoadingTracks(true);
    setTracks(await getUserHistory());
    setLoadingTracks(false);
  };

  const openAiRecommend = async () => {
    if (!currentAlbumAudioId) return;
    setSubPage({ type: 'ai' });
    setLoadingTracks(true);
    setTracks(await getAiRecommend(currentAlbumAudioId));
    setLoadingTracks(false);
  };

  const openStyle = async (tag?: StyleTag) => {
    setSubPage({ type: 'style', tag });
    setLoadingTracks(true);
    setTracks(await getStyleRecommend(tag?.id));
    setLoadingTracks(false);
  };

  const goBack = () => { setSubPage(null); setTracks([]); };

  useEffect(() => {
    if (!subPage) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => handler.remove();
  }, [subPage]);

  const parseName = (fileName: string) => {
    const parts = fileName.split(' - ');
    return { artist: parts[0] || '', title: parts[1] || fileName };
  };

  if (subPage) {
    const title = subPage.type === 'playlist' ? subPage.playlist.name
      : subPage.type === 'history' ? '最近播放'
      : subPage.type === 'ai' ? '猜你喜欢'
      : subPage.tag ? subPage.tag.name : '风格推荐';

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.6}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {tracks.length > 0 && (
            <TouchableOpacity
              onPress={() => onPlay(tracks[0], tracks)}
              style={styles.playAllBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="play" size={16} color={colors.bg} />
            </TouchableOpacity>
          )}
        </View>

        {loadingTracks ? (
          <ActivityIndicator color={colors.textSecondary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={tracks}
            keyExtractor={(item, i) => `${item.hash}-${i}`}
            contentContainerStyle={{ paddingBottom: 180 }}
            renderItem={({ item, index }) => {
              const { artist, title: t } = parseName(item.fileName);
              const isPlaying = item.hash === currentHash;
              return (
                <TouchableOpacity style={styles.trackRow} onPress={() => onPlay(item, tracks)} activeOpacity={0.6}>
                  <Text style={styles.trackIndex}>{index + 1}</Text>
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, isPlaying && { color: colors.playing }]} numberOfLines={1}>{t}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{artist}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>音乐库</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.textSecondary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <TouchableOpacity style={styles.menuRow} onPress={openHistory} activeOpacity={0.6}>
              <View style={[styles.menuIcon, { backgroundColor: '#1a2a1a' }]}>
                <Ionicons name="time-outline" size={20} color={colors.playing} />
              </View>
              <Text style={styles.menuText}>最近播放</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            {currentAlbumAudioId && (
              <TouchableOpacity style={styles.menuRow} onPress={openAiRecommend} activeOpacity={0.6}>
                <View style={[styles.menuIcon, { backgroundColor: '#1a1a2a' }]}>
                  <Ionicons name="sparkles-outline" size={20} color={colors.accent} />
                </View>
                <Text style={styles.menuText}>猜你喜欢</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuRow} onPress={() => openStyle()} activeOpacity={0.6}>
              <View style={[styles.menuIcon, { backgroundColor: '#2a1a2a' }]}>
                <Ionicons name="color-palette-outline" size={20} color="#c084fc" />
              </View>
              <Text style={styles.menuText}>风格推荐</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            {styleTags.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll} contentContainerStyle={styles.tagsContainer}>
                {styleTags.map(tag => (
                  <TouchableOpacity key={tag.id} style={styles.tagChip} onPress={() => openStyle(tag)} activeOpacity={0.6}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.sectionTitle}>我的歌单</Text>
            {playlists.map(p => (
              <TouchableOpacity key={p.gcid} style={styles.playlistRow} onPress={() => openPlaylist(p)} activeOpacity={0.6}>
                <View style={styles.playlistIcon}>
                  <Ionicons name="musical-notes-outline" size={18} color={colors.textSecondary} />
                </View>
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.playlistCount}>{p.count} 首</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  topTitle: { fontSize: 28, fontWeight: '700', color: colors.text },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuText: { flex: 1, fontSize: 16, color: colors.text },
  tagsScroll: { marginTop: 4, marginBottom: 8 },
  tagsContainer: { paddingHorizontal: 20, gap: 8 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 13, color: colors.textSecondary },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  playlistIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  playlistInfo: { flex: 1 },
  playlistName: { fontSize: 15, color: colors.text, marginBottom: 2 },
  playlistCount: { fontSize: 12, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: colors.text },
  playAllBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  trackIndex: {
    width: 28,
    fontSize: 13,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 16, color: colors.text, marginBottom: 2 },
  trackArtist: { fontSize: 13, color: colors.textSecondary },
});
