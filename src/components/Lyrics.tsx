import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { LyricLine } from '../api/music';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const LINE_HEIGHT = 40;
const VISIBLE_CENTER = SCREEN_HEIGHT * 0.25;

interface Props {
  lyrics: LyricLine[];
  position: number;
  onSeek?: (ms: number) => void;
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function Lyrics({ lyrics, position, onSeek }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const lastIndexRef = useRef(-1);
  const [userScrolling, setUserScrolling] = useState(false);
  const [seekIndex, setSeekIndex] = useState(-1);
  const [overrideIndex, setOverrideIndex] = useState(-1);
  const userScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (position >= lyrics[i].time) return i;
    }
    return -1;
  }, [lyrics, position]);

  useEffect(() => {
    if (overrideIndex >= 0 && activeIndex === overrideIndex) {
      setOverrideIndex(-1);
    }
  }, [activeIndex, overrideIndex]);

  const displayIndex = overrideIndex >= 0 ? overrideIndex : activeIndex;

  useEffect(() => {
    if (!userScrolling && displayIndex !== lastIndexRef.current && displayIndex >= 0) {
      lastIndexRef.current = displayIndex;
      scrollRef.current?.scrollTo({
        y: displayIndex * LINE_HEIGHT,
        animated: true,
      });
    }
  }, [displayIndex, userScrolling]);

  const onScrollBegin = useCallback(() => {
    setUserScrolling(true);
    if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!userScrolling) return;
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / LINE_HEIGHT);
    setSeekIndex(Math.max(0, Math.min(lyrics.length - 1, idx)));
  }, [userScrolling, lyrics.length]);

  const onScrollEnd = useCallback(() => {
    if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
    userScrollTimer.current = setTimeout(() => {
      setUserScrolling(false);
      setSeekIndex(-1);
    }, 3000);
  }, []);

  const handleSeek = useCallback(() => {
    if (seekIndex >= 0 && seekIndex < lyrics.length && onSeek) {
      setOverrideIndex(seekIndex);
      onSeek(lyrics[seekIndex].time);
      setSeekIndex(-1);
      setUserScrolling(false);
      if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
    }
  }, [seekIndex, lyrics, onSeek]);

  if (lyrics.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无歌词</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={{ paddingTop: VISIBLE_CENTER, paddingBottom: VISIBLE_CENTER }}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={onScrollBegin}
      onScrollEndDrag={onScrollEnd}
      onMomentumScrollEnd={onScrollEnd}
      onScroll={onScroll}
      scrollEventThrottle={32}
    >
      {lyrics.map((line, i) => {
        const isActive = i === displayIndex && !userScrolling;
        const isSeekTarget = userScrolling && i === seekIndex;

        if (isSeekTarget) {
          return (
            <View key={`${i}-${line.time}`} style={styles.seekRow}>
              <Text style={styles.seekTime}>{formatTime(line.time)}</Text>
              <Text style={[styles.line, styles.seekLine]} numberOfLines={1}>
                {line.text}
              </Text>
              <TouchableOpacity onPress={handleSeek} style={styles.seekBtn} activeOpacity={0.6}>
                <Ionicons name="play" size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <Text
            key={`${i}-${line.time}`}
            style={[styles.line, isActive && styles.activeLine]}
          >
            {line.text}
          </Text>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textTertiary,
  },
  line: {
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  activeLine: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: LINE_HEIGHT,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  seekTime: {
    fontSize: 11,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
    width: 34,
  },
  seekLine: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: 4,
  },
  seekBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
