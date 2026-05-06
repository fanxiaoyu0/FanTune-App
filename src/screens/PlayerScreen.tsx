import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { ProgressBar } from '../components/ProgressBar';
import { Lyrics } from '../components/Lyrics';
import { Comments } from '../components/Comments';
import { PlayState, PlayMode } from '../hooks/usePlayer';
import { Song, LyricLine } from '../api/music';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

type PlayerTab = 'lyrics' | 'comments';

const QUALITY_OPTIONS = ['128', '320', 'flac'] as const;

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

const PLAY_MODE_CONFIG: Record<PlayMode, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  loop: { icon: 'repeat-outline', label: '循环' },
  one: { icon: 'repeat-outline', label: '单曲' },
  shuffle: { icon: 'shuffle-outline', label: '随机' },
};

export function PlayerScreen({
  song, state, position, duration, lyrics, climax,
  playMode, quality,
  onPause, onResume, onSeek, onNext, onPrev,
  onTogglePlayMode, onSetQuality, onClose, onArtistPress,
}: Props) {
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [onClose]);

  const [playerTab, setPlayerTab] = useState<PlayerTab>('lyrics');

  if (!song) return null;

  const { artist, title } = parseName(song.fileName);
  const progress = duration > 0 ? position / duration : 0;
  const modeConfig = PLAY_MODE_CONFIG[playMode];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onClose} activeOpacity={0.6}>
        <Ionicons name="chevron-down" size={28} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setPlayerTab('lyrics')} activeOpacity={0.6}>
          <Text style={[styles.tabText, playerTab === 'lyrics' && styles.tabTextActive]}>歌词</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPlayerTab('comments')} activeOpacity={0.6}>
          <Text style={[styles.tabText, playerTab === 'comments' && styles.tabTextActive]}>评论</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.artworkArea}>
        {playerTab === 'comments' && song.mixSongId ? (
          <Comments mixSongId={song.mixSongId} />
        ) : lyrics.length > 0 ? (
          <Lyrics lyrics={lyrics} position={position} onSeek={(ms) => onSeek(ms)} />
        ) : (
          <View style={styles.artwork}>
            <Ionicons name="musical-notes" size={80} color={colors.textTertiary} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={() => onArtistPress?.(artist)} activeOpacity={0.6}>
          <Text style={styles.artist} numberOfLines={1}>{artist}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.badgeRow}>
        {climax !== null && (
          <TouchableOpacity
            style={styles.climaxBtn}
            onPress={() => onSeek(climax)}
            activeOpacity={0.6}
          >
            <Ionicons name="flame-outline" size={13} color="#f97316" />
            <Text style={styles.climaxText}>高潮</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.qualityRow}>
        {QUALITY_OPTIONS.map((q) => (
          <TouchableOpacity
            key={q}
            style={[styles.qualityBadge, quality === q && styles.qualityBadgeActive]}
            onPress={() => onSetQuality(q)}
            activeOpacity={0.6}
          >
            <Text style={[styles.qualityText, quality === q && styles.qualityTextActive]}>
              {q.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.progressArea}>
        <ProgressBar
          progress={progress}
          onSeek={(ratio) => onSeek(ratio * duration)}
          height={4}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onTogglePlayMode} style={styles.sideBtn} activeOpacity={0.6}>
          <Ionicons name={modeConfig.icon} size={22} color={colors.text} />
          {playMode === 'one' && <Text style={styles.oneLabel}>1</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onPrev} style={styles.ctrlBtn} activeOpacity={0.6}>
          <Ionicons name="play-skip-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={state === 'playing' ? onPause : onResume}
          style={styles.playBtn}
          activeOpacity={0.7}
        >
          {state === 'loading' ? (
            <Ionicons name="hourglass-outline" size={32} color={colors.bg} />
          ) : state === 'playing' ? (
            <Ionicons name="pause" size={32} color={colors.bg} />
          ) : (
            <Ionicons name="play" size={32} color={colors.bg} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext} style={styles.ctrlBtn} activeOpacity={0.6}>
          <Ionicons name="play-skip-forward" size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.sideBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 32,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 8,
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 24,
    paddingBottom: 8,
  },
  tabText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
  },
  artworkArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artwork: {
    width: SCREEN_WIDTH - 120,
    height: SCREEN_WIDTH - 120,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  artist: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  climaxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#f9731640',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  climaxText: {
    fontSize: 11,
    color: '#f97316',
    fontWeight: '600',
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  qualityBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qualityBadgeActive: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  qualityText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  qualityTextActive: {
    color: colors.bg,
  },
  progressArea: {
    marginBottom: 24,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  sideBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ctrlBtn: {
    padding: 8,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oneLabel: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    color: colors.text,
    bottom: 4,
    right: 4,
  },
});
