import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { PlayState } from '../hooks/usePlayer';
import { Song, LyricLine } from '../api/music';
import { ProgressBar } from './ProgressBar';

interface Props {
  song: Song | null;
  state: PlayState;
  position: number;
  duration: number;
  lyrics: LyricLine[];
  onPause: () => void;
  onResume: () => void;
  onSeek: (ms: number) => void;
  onPress: () => void;
  onNext: () => void;
}

function parseName(fileName: string) {
  const parts = fileName.split(' - ');
  return { artist: parts[0] || '', title: parts[1] || fileName };
}

export function MiniPlayer({ song, state, position, duration, lyrics, onPause, onResume, onSeek, onPress, onNext }: Props) {
  if (!song || state === 'idle') return null;

  const { artist, title } = parseName(song.fileName);
  const progress = duration > 0 ? position / duration : 0;

  const currentLyric = useMemo(() => {
    if (lyrics.length === 0) return '';
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (position >= lyrics[i].time) return lyrics[i].text;
    }
    return '';
  }, [lyrics, position]);

  return (
    <View style={styles.wrapper}>
      <ProgressBar
        progress={progress}
        onSeek={(ratio) => onSeek(ratio * duration)}
        height={2}
        fillColor={colors.accent}
      />
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.lyric} numberOfLines={1}>
            {currentLyric || artist}
          </Text>
        </View>
        <TouchableOpacity
          onPress={state === 'playing' ? onPause : onResume}
          style={styles.btn}
          activeOpacity={0.6}
        >
          {state === 'loading' ? (
            <Ionicons name="hourglass-outline" size={22} color={colors.text} />
          ) : state === 'playing' ? (
            <Ionicons name="pause" size={22} color={colors.text} />
          ) : (
            <Ionicons name="play" size={22} color={colors.text} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={styles.btn} activeOpacity={0.6}>
          <Ionicons name="play-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  info: { flex: 1 },
  title: { fontSize: 14, color: colors.text, fontWeight: '500' },
  lyric: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  btn: { padding: 8 },
});
