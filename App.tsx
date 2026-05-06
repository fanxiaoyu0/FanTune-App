import { useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { setAuth, clearAuth, setOnAuthExpired } from './src/api/client';
import { refreshToken } from './src/api/auth';
import { usePlayer } from './src/hooks/usePlayer';
import { SearchScreen } from './src/screens/SearchScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ArtistScreen } from './src/screens/ArtistScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { Song } from './src/api/music';
import { LoginResult } from './src/api/auth';
import { colors } from './src/theme/colors';

const TOKEN_KEY = 'kugou_token';
const USERID_KEY = 'kugou_userid';

type Tab = 'search' | 'library';

export default function App() {
  const player = usePlayer();
  const [playerVisible, setPlayerVisible] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('library');
  const [artistName, setArtistName] = useState<string | null>(null);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USERID_KEY);
    clearAuth();
    setLoggedIn(false);
  };

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userid = await SecureStore.getItemAsync(USERID_KEY);
      if (token && userid) {
        setAuth(token, userid);
        setLoggedIn(true);
        refreshToken(token, userid)
          .then(async (result) => {
            await SecureStore.setItemAsync(TOKEN_KEY, result.token);
            await SecureStore.setItemAsync(USERID_KEY, result.userid);
            setAuth(result.token, result.userid);
          })
          .catch(() => handleLogout());
      }
      setLoading(false);
    })();
    setOnAuthExpired(handleLogout);
  }, []);

  const handleLogin = async (result: LoginResult) => {
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    await SecureStore.setItemAsync(USERID_KEY, result.userid);
    setAuth(result.token, result.userid);
    setLoggedIn(true);
  };

  const handlePlay = (song: Song, queue: Song[]) => {
    player.play(song, queue);
  };

  if (loading) return <SafeAreaProvider><View style={styles.container} /></SafeAreaProvider>;

  if (!loggedIn) {
    return (
      <SafeAreaProvider><View style={styles.container}>
        <StatusBar style="light" />
        <LoginScreen onLogin={handleLogin} />
      </View></SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider><View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.content, tab !== 'search' && { display: 'none' }]}>
        <SearchScreen onPlay={handlePlay} currentHash={player.current?.hash} />
      </View>
      <View style={[styles.content, tab !== 'library' && { display: 'none' }]}>
        <LibraryScreen onPlay={handlePlay} currentHash={player.current?.hash} currentAlbumAudioId={player.current?.albumAudioId || player.current?.mixSongId} />
      </View>

      <MiniPlayer
        song={player.current}
        state={player.state}
        position={player.position}
        duration={player.duration}
        lyrics={player.lyrics}
        onPause={player.pause}
        onResume={player.resume}
        onSeek={player.seek}
        onPress={() => setPlayerVisible(true)}
        onNext={player.next}
      />

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('search')} activeOpacity={0.6}>
          <Ionicons name="search" size={22} color={tab === 'search' ? colors.accent : colors.textTertiary} />
          <Text style={[styles.tabLabel, tab === 'search' && styles.tabLabelActive]}>搜索</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('library')} activeOpacity={0.6}>
          <Ionicons name="library-outline" size={22} color={tab === 'library' ? colors.accent : colors.textTertiary} />
          <Text style={[styles.tabLabel, tab === 'library' && styles.tabLabelActive]}>音乐库</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={playerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setPlayerVisible(false)}
      >
        <PlayerScreen
          song={player.current}
          state={player.state}
          position={player.position}
          duration={player.duration}
          lyrics={player.lyrics}
          climax={player.climax}
          playMode={player.playMode}
          quality={player.quality}
          onPause={player.pause}
          onResume={player.resume}
          onSeek={player.seek}
          onNext={player.next}
          onPrev={player.prev}
          onTogglePlayMode={player.togglePlayMode}
          onSetQuality={player.setQuality}
          onClose={() => setPlayerVisible(false)}
          onArtistPress={(name) => { setPlayerVisible(false); setTimeout(() => setArtistName(name), 300); }}
        />
      </Modal>
      <Modal
        visible={!!artistName}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => { setArtistName(null); setPlayerVisible(true); }}
      >
        {artistName && (
          <ArtistScreen
            artistName={artistName}
            onPlay={handlePlay}
            onClose={() => { setArtistName(null); setPlayerVisible(true); }}
            currentHash={player.current?.hash}
          />
        )}
      </Modal>
    </View></SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 40,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  tabLabelActive: {
    color: colors.accent,
  },
});
