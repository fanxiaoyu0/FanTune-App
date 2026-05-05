import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { search, Song } from '../api/music';

interface Props {
  onPlay: (song: Song, queue: Song[]) => void;
  currentHash?: string;
}

export function SearchScreen({ onPlay, currentHash }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await search(query.trim());
    setResults(res.songs);
    setLoading(false);
  };

  const parseName = (fileName: string) => {
    const parts = fileName.split(' - ');
    return { artist: parts[0] || '', title: parts[1] || fileName };
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="搜索歌曲、歌手..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textSecondary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.hash}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => {
            const { artist, title } = parseName(item.fileName);
            const isPlaying = item.hash === currentHash;
            return (
              <TouchableOpacity style={styles.row} onPress={() => onPlay(item, results)} activeOpacity={0.6}>
                <View style={styles.songInfo}>
                  <Text style={[styles.title, isPlaying && { color: colors.playing }]} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
                </View>
                <Text style={styles.duration}>
                  {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                </Text>
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
  searchBar: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  songInfo: { flex: 1 },
  title: { fontSize: 16, color: colors.text, marginBottom: 2 },
  artist: { fontSize: 13, color: colors.textSecondary },
  duration: { fontSize: 13, color: colors.textTertiary, marginLeft: 12 },
});
