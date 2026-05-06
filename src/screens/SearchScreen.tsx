import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { search, searchSuggest, Song } from '../api/music';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onPlay: (song: Song, queue: Song[]) => void;
  currentHash?: string;
}

export function SearchScreen({ onPlay, currentHash }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressSuggestRef = useRef(false);

  const handleSearch = async (q?: string) => {
    const keyword = (q || query).trim();
    if (!keyword) return;
    suppressSuggestRef.current = true;
    setShowSuggestions(false);
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    const res = await search(keyword);
    setResults(res.songs);
    setLoading(false);
  };

  const handleTextChange = useCallback((text: string) => {
    setQuery(text);
    suppressSuggestRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const s = await searchSuggest(text.trim());
      if (!suppressSuggestRef.current) {
        setSuggestions(s);
        setShowSuggestions(s.length > 0);
      }
    }, 300);
  }, []);

  const handleSuggestionTap = (hint: string) => {
    setQuery(hint);
    setShowSuggestions(false);
    setSuggestions([]);
    handleSearch(hint);
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
          onChangeText={handleTextChange}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((hint, i) => (
            <TouchableOpacity
              key={`${hint}-${i}`}
              style={styles.suggestionRow}
              onPress={() => handleSuggestionTap(hint)}
              activeOpacity={0.6}
            >
              <Ionicons name="search-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.suggestionText} numberOfLines={1}>{hint}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.textSecondary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.hash}
          contentContainerStyle={{ paddingBottom: 180 }}
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
  suggestionsContainer: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  suggestionText: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
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
