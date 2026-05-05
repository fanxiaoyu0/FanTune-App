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
  const widthRef = useRef(0);
  const draggingRef = useRef(false);
  const fillRef = useRef<View>(null);
  const thumbRef = useRef<View>(null);

  useEffect(() => {
    if (!draggingRef.current) {
      fillRef.current?.setNativeProps({ style: { width: `${Math.max(0, Math.min(1, progress)) * 100}%` } });
    }
  }, [progress]);

  const applyVisual = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    fillRef.current?.setNativeProps({ style: { width: `${clamped * 100}%` } });
    thumbRef.current?.setNativeProps({ style: { left: `${clamped * 100}%`, opacity: 1 } });
  };

  const getRatio = (e: GestureResponderEvent) => {
    if (widthRef.current <= 0) return 0;
    return Math.max(0, Math.min(1, e.nativeEvent.locationX / widthRef.current));
  };

  return (
    <View
      style={styles.touchArea}
      onLayout={(e) => { widthRef.current = e.nativeEvent.layout.width; }}
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
        onSeek(ratio);
        thumbRef.current?.setNativeProps({ style: { opacity: 0 } });
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
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.text,
    marginLeft: -8,
    top: -6,
  },
});
