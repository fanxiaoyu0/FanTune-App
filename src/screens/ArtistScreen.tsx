import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { searchArtist, getArtistSongs, Artist, Song } from '../api/music';

interface Props {
  artistName: string;
  onPlay: (song: Song, queue: Song[]) => void;
  onClose: () => void;
  currentHash?: string;
}

export function ArtistScreen({ artistName, onPlay, onClose, currentHash }: Props) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const a = await searchArtist(artistName);
      setArtist(a);
      if (a) {
        const s = await getArtistSongs(a.id);
        setSongs(s);
      }
      setLoading(false);
    })();
  }, [artistName]);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => { onClose(); return true; });
    return () => handler.remove();
  }, [onClose]);

  const parseName = (fileName: string) => {
    const parts = fileName.split(' - ');
    return { artist: parts[0] || '', title: parts[1] || fileName };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        {artist?.avatar ? (
          <Image source={{ uri: artist.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{artist?.name || artistName}</Text>
          <Text style={styles.headerSub}>
            {artist ? `${artist.songCount} 首 · ${Math.floor(artist.fansCount / 10000)}万粉丝` : ''}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textSecondary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item, i) => `${item.hash}-${i}`}
          contentContainerStyle={{ paddingBottom: 180 }}
          ListHeaderComponent={
            songs.length > 0 ? (
              <TouchableOpacity style={styles.playAllRow} onPress={() => onPlay(songs[0], songs)} activeOpacity={0.6}>
                <Ionicons name="play-circle" size={20} color={colors.text} />
                <Text style={styles.playAllText}>播放全部 ({songs.length})</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item, index }) => {
            const { title } = parseName(item.fileName);
            const isPlaying = item.hash === currentHash;
            return (
              <TouchableOpacity style={styles.row} onPress={() => onPlay(item, songs)} activeOpacity={0.6}>
                <Text style={styles.index}>{index + 1}</Text>
                <Text style={[styles.title, isPlaying && { color: colors.playing }]} numberOfLines={1}>{title}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 20,
    gap: 14,
  },
  backBtn: { padding: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  playAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playAllText: { fontSize: 15, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  index: { width: 28, fontSize: 13, color: colors.textTertiary, fontVariant: ['tabular-nums'] },
  title: { flex: 1, fontSize: 16, color: colors.text },
});
