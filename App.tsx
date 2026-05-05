import { useEffect, useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { setAuth, clearAuth, setOnAuthExpired } from './src/api/client';
import { refreshToken } from './src/api/auth';
import { usePlayer } from './src/hooks/usePlayer';
import { SearchScreen } from './src/screens/SearchScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { Song } from './src/api/music';
import { LoginResult } from './src/api/auth';
import { colors } from './src/theme/colors';

const TOKEN_KEY = 'kugou_token';
const USERID_KEY = 'kugou_userid';

export default function App() {
  const player = usePlayer();
  const [playerVisible, setPlayerVisible] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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
        refreshToken(token, userid).catch(() => handleLogout());
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

  if (loading) return <View style={styles.container} />;

  if (!loggedIn) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LoginScreen onLogin={handleLogin} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SearchScreen onPlay={handlePlay} currentHash={player.current?.hash} />
      <MiniPlayer
        song={player.current}
        state={player.state}
        position={player.position}
        duration={player.duration}
        onPause={player.pause}
        onResume={player.resume}
        onSeek={player.seek}
        onPress={() => setPlayerVisible(true)}
        onNext={player.next}
      />

      <Modal
        visible={playerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <PlayerScreen
          song={player.current}
          state={player.state}
          position={player.position}
          duration={player.duration}
          lyrics={player.lyrics}
          playMode={player.playMode}
          quality={player.quality}
          onPause={player.pause}
          onResume={player.resume}
          onSeek={player.seek}
          onNext={player.next}
          onPrev={player.prev}
          onTogglePlayMode={player.togglePlayMode}
          onClose={() => setPlayerVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
