import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, GestureResponderEvent } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  progress: number;
  onSeek: (ratio: number) => void;
  height?: number;
  fillColor?: string;
}

export function ProgressBar({ progress, onSeek, height = 4, fillColor }: Props) {
  const trackRef = useRef<View>(null);
  const layoutRef = useRef({ x: 0, width: 0 });
  const draggingRef = useRef(false);
  const seekingRef = useRef(false);
  const fillRef = useRef<View>(null);
  const thumbRef = useRef<View>(null);

  useEffect(() => {
    if (!draggingRef.current && !seekingRef.current) {
      fillRef.current?.setNativeProps({
        style: { width: `${Math.max(0, Math.min(1, progress)) * 100}%` },
      });
    }
  }, [progress]);

  const applyVisual = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    const pct = `${clamped * 100}%`;
    fillRef.current?.setNativeProps({ style: { width: pct } });
    thumbRef.current?.setNativeProps({ style: { left: pct, opacity: 1 } });
  };

  const getRatio = (e: GestureResponderEvent) => {
    const { x, width } = layoutRef.current;
    if (width <= 0) return 0;
    return Math.max(0, Math.min(1, (e.nativeEvent.pageX - x) / width));
  };

  return (
    <View
      ref={trackRef}
      style={styles.touchArea}
      onLayout={() => {
        trackRef.current?.measureInWindow((x, _y, width) => {
          layoutRef.current = { x, width };
        });
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        draggingRef.current = true;
        applyVisual(getRatio(e));
      }}
      onResponderMove={(e) => {
        if (draggingRef.current) applyVisual(getRatio(e));
      }}
      onResponderRelease={(e) => {
        const ratio = getRatio(e);
        draggingRef.current = false;
        seekingRef.current = true;
        onSeek(ratio);
        thumbRef.current?.setNativeProps({ style: { opacity: 0 } });
        setTimeout(() => { seekingRef.current = false; }, 800);
      }}
    >
      <View style={[styles.track, { height }]}>
        <View
          ref={fillRef}
          style={[styles.fill, { width: '0%', height, backgroundColor: fillColor || colors.text }]}
        />
        <View ref={thumbRef} style={[styles.thumb, { opacity: 0 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    width: '100%',
    paddingVertical: 10,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
    marginLeft: -7,
    top: -5,
  },
});
