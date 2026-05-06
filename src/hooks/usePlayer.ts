import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Song, LyricLine, getSongUrl, getLyric, getSongClimax, submitPlayHistory } from '../api/music';

export type PlayState = 'idle' | 'loading' | 'playing' | 'paused';
export type PlayMode = 'loop' | 'one' | 'shuffle';

export function usePlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<PlayState>('idle');
  const [current, setCurrent] = useState<Song | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');
  const [quality, setQualityState] = useState<string>('320');
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [climax, setClimax] = useState<number | null>(null);

  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const playModeRef = useRef(playMode);
  queueRef.current = queue;
  queueIndexRef.current = queueIndex;
  playModeRef.current = playMode;

  const loadAndPlay = useCallback(async (song: Song, q?: string) => {
    setState('loading');
    setCurrent(song);
    setLyrics([]);
    setClimax(null);

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
    }

    const songUrl = await getSongUrl(song.hash, song.albumAudioId, q || quality);
    if (!songUrl) {
      setState('idle');
      return;
    }

    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: songUrl.url },
      { shouldPlay: true, progressUpdateIntervalMillis: 500 },
      (status) => {
        if (!status.isLoaded) return;
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
        if (status.didJustFinish) {
          handleTrackEnd();
        } else if (status.isPlaying) {
          setState('playing');
        }
      }
    );

    soundRef.current = sound;
    setState('playing');

    getLyric(song.hash, song.albumAudioId).then(setLyrics);
    getSongClimax(song.hash).then(setClimax);
    if (song.albumAudioId) submitPlayHistory(song.albumAudioId);
  }, [quality]);

  const handleTrackEnd = useCallback(() => {
    const mode = playModeRef.current;
    const q = queueRef.current;
    const idx = queueIndexRef.current;

    if (mode === 'one' && q[idx]) {
      loadAndPlay(q[idx]);
      return;
    }

    if (mode === 'shuffle') {
      const nextIdx = Math.floor(Math.random() * q.length);
      setQueueIndex(nextIdx);
      if (q[nextIdx]) loadAndPlay(q[nextIdx]);
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx >= q.length) {
      setQueueIndex(0);
      if (q[0]) loadAndPlay(q[0]);
      return;
    }

    setQueueIndex(nextIdx);
    if (q[nextIdx]) loadAndPlay(q[nextIdx]);
  }, [loadAndPlay]);

  const play = useCallback(async (song: Song, songs?: Song[]) => {
    if (songs && songs.length > 0) {
      setQueue(songs);
      const idx = songs.findIndex(s => s.hash === song.hash);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      const idx = queueRef.current.findIndex(s => s.hash === song.hash);
      if (idx >= 0) {
        setQueueIndex(idx);
      } else {
        setQueue(prev => [...prev, song]);
        setQueueIndex(queueRef.current.length);
      }
    }
    await loadAndPlay(song);
  }, [loadAndPlay]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setState('paused');
    }
  }, []);

  const resume = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setState('playing');
    }
  }, []);

  const seek = useCallback(async (ms: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(ms);
    }
  }, []);

  const next = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    let nextIdx: number;
    if (playModeRef.current === 'shuffle') {
      nextIdx = Math.floor(Math.random() * q.length);
    } else {
      nextIdx = queueIndexRef.current + 1;
      if (nextIdx >= q.length) nextIdx = 0;
    }

    setQueueIndex(nextIdx);
    await loadAndPlay(q[nextIdx]);
  }, [loadAndPlay]);

  const prev = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    let prevIdx = queueIndexRef.current - 1;
    if (prevIdx < 0) prevIdx = q.length - 1;

    setQueueIndex(prevIdx);
    await loadAndPlay(q[prevIdx]);
  }, [loadAndPlay]);

  const togglePlayMode = useCallback(() => {
    setPlayMode(m => {
      if (m === 'loop') return 'one';
      if (m === 'one') return 'shuffle';
      return 'loop';
    });
  }, []);

  const setQuality = useCallback(async (q: string) => {
    setQualityState(q);
    const song = queueRef.current[queueIndexRef.current];
    if (!song) return;

    const oldSound = soundRef.current;
    let currentPos = 0;
    if (oldSound) {
      const status = await oldSound.getStatusAsync();
      currentPos = status.isLoaded ? status.positionMillis : 0;
    }

    const songUrl = await getSongUrl(song.hash, song.albumAudioId, q);
    if (!songUrl) return;

    await Audio.setAudioModeAsync({ staysActiveInBackground: true, playsInSilentModeIOS: true });
    if (oldSound) {
      const freshStatus = await oldSound.getStatusAsync();
      if (freshStatus.isLoaded) currentPos = freshStatus.positionMillis;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: songUrl.url },
      { shouldPlay: true, positionMillis: currentPos, progressUpdateIntervalMillis: 500 },
      (status) => {
        if (!status.isLoaded) return;
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
        if (status.didJustFinish) handleTrackEnd();
        else if (status.isPlaying) setState('playing');
      }
    );

    soundRef.current = newSound;
    if (oldSound) {
      await oldSound.stopAsync().catch(() => {});
      await oldSound.unloadAsync().catch(() => {});
    }
  }, [handleTrackEnd]);

  return {
    state, current, position, duration, lyrics, climax,
    queue, queueIndex, playMode, quality,
    play, pause, resume, seek,
    next, prev, togglePlayMode, setQuality,
  };
}
