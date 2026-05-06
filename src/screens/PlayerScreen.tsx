import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { ProgressBar } from '../components/ProgressBar';
import { Lyrics } from '../components/Lyrics';
import { PlayState, PlayMode } from '../hooks/usePlayer';
import { Song, LyricLine } from '../api/music';

interface Props {
  song: Song | null;
  state: PlayState;
  position: number;
  duration: number;
  lyrics: LyricLine[];
  climax: number | null;
  playMode: PlayMode;
  quality: string;
  onPause: () => void;
  onResume: () => void;
  onSeek: (ms: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlayMode: () => void;
  onSetQuality: (q: string) => void;
  onClose: () => void;
  onArtistPress?: (name: string) => void;
}

const QUALITY_OPTIONS = ['128', '320', 'flac'] as const;

const PLAY_MODE_CONFIG: Record<PlayMode, { icon: keyof typeof Ionicons.glyphMap }> = {
  loop: { icon: 'repeat-outline' },
  one: { icon: 'repeat-outline' },
  shuffle: { icon: 'shuffle-outline' },
};

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function parseName(fileName: string) {
  const parts = fileName.split(' - ');
  return { artist: parts[0] || '', title: parts[1] || fileName };
}

export function PlayerScreen({
  song, state, position, duration, lyrics, climax,
  playMode, quality,
  onPause, onResume, onSeek, onNext, onPrev,
  onTogglePlayMode, onSetQuality, onClose, onArtistPress,
}: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [onClose]);

  if (!song) return null;

  const { artist, title } = parseName(song.fileName);
  const progress = duration > 0 ? position / duration : 0;
  const modeConfig = PLAY_MODE_CONFIG[playMode];

  return (
    <View style={styles.container}>
      <View style={styles.lyricsArea}>
        {lyrics.length > 0 ? (
          <Lyrics lyrics={lyrics} position={position} onSeek={(ms) => onSeek(ms)} />
        ) : (
          <View style={styles.emptyLyrics}>
            <Ionicons name="musical-notes" size={64} color={colors.textTertiary} />
          </View>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
        <View style={styles.songRow}>
          <View style={styles.songInfo}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <TouchableOpacity onPress={() => onArtistPress?.(artist)} activeOpacity={0.6}>
              <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badges}>
            {climax !== null && (
              <TouchableOpacity style={styles.climaxBtn} onPress={() => onSeek(climax)} activeOpacity={0.6}>
                <Ionicons name="flame-outline" size={12} color="#f97316" />
              </TouchableOpacity>
            )}
            {QUALITY_OPTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.qBadge, quality === q && styles.qBadgeActive]}
                onPress={() => onSetQuality(q)}
                activeOpacity={0.6}
              >
                <Text style={[styles.qText, quality === q && styles.qTextActive]}>
                  {q.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.progressArea}>
          <ProgressBar progress={progress} onSeek={(ratio) => onSeek(ratio * duration)} height={3} fillColor={colors.accent} />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={onTogglePlayMode} style={styles.sideBtn} activeOpacity={0.6}>
            <Ionicons name={modeConfig.icon} size={20} color={colors.textSecondary} />
            {playMode === 'one' && <Text style={styles.oneLabel}>1</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={onPrev} style={styles.ctrlBtn} activeOpacity={0.6}>
            <Ionicons name="play-skip-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={state === 'playing' ? onPause : onResume}
            style={styles.playBtn}
            activeOpacity={0.7}
          >
            {state === 'loading' ? (
              <Ionicons name="hourglass-outline" size={24} color={colors.bg} />
            ) : state === 'playing' ? (
              <Ionicons name="pause" size={24} color={colors.bg} />
            ) : (
              <Ionicons name="play" size={24} color={colors.bg} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onNext} style={styles.ctrlBtn} activeOpacity={0.6}>
            <Ionicons name="play-skip-forward" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.sideBtn} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  lyricsArea: {
    flex: 1,
    paddingTop: 56,
  },
  emptyLyrics: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  artist: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  climaxBtn: {
    borderWidth: 1,
    borderColor: '#f9731640',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  qBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  qBadgeActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  qText: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: '700',
  },
  qTextActive: {
    color: colors.bg,
  },
  progressArea: {
    marginBottom: 28,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  time: {
    fontSize: 11,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ctrlBtn: {
    padding: 8,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oneLabel: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    color: colors.textSecondary,
    bottom: 4,
    right: 4,
  },
});
