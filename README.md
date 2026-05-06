# FanTune

A minimal, elegant music player app built with React Native + Expo, powered by KuGou Music API.

Designed for one thing — listening to music without distractions.

## Features

### Core
- **Search & Play** — Search songs with autocomplete suggestions
- **Synced Lyrics** — Real-time scrolling lyrics with tap-to-seek
- **Play Queue** — Loop all, loop one, shuffle
- **Audio Caching** — Songs are cached locally after first play
- **Quality Selection** — Switch between 128kbps / 320kbps / FLAC on the fly

### Library
- **My Playlists** — Synced from KuGou account
- **Play History** — Recent listening history
- **AI Recommendations** — Personalized song suggestions based on current track
- **Style Recommendations** — Browse by genre, mood, and language
- **Artist Page** — Tap artist name in player to see their top songs

### Details
- **Song Climax** — One-tap jump to the chorus
- **Mini Player** — Shows current lyric line at the bottom
- **Play History Sync** — Listening data synced back to KuGou
- **Phone Login** — SMS verification with secure token storage

## Architecture

```
App.tsx                  # Root: tabs, modals, auth
src/
├── api/
│   ├── client.ts        # HTTP client with auth & token expiry
│   ├── music.ts         # Search, playlist, lyrics, recommend
│   ├── auth.ts          # Login, token refresh
│   └── audioCache.ts    # Stream-first local caching
├── components/
│   ├── ProgressBar.tsx   # Draggable seek bar (setNativeProps)
│   ├── MiniPlayer.tsx    # Compact bar with current lyric
│   └── Lyrics.tsx        # Synced scroll with inline seek
├── hooks/
│   └── usePlayer.ts      # Audio engine, queue, play modes
├── screens/
│   ├── SearchScreen.tsx   # Search with autocomplete
│   ├── LibraryScreen.tsx  # Playlists, history, recommendations
│   ├── PlayerScreen.tsx   # Full-screen player with lyrics
│   ├── ArtistScreen.tsx   # Artist songs
│   └── LoginScreen.tsx    # Phone SMS login
└── theme/
    └── colors.ts          # Dark violet design tokens
```

## Setup

### Prerequisites

- Node.js 18+
- [KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) running on a server
- KuGou Music account (VIP recommended for high-quality audio)

### Development

```bash
npm install

# Create .env with your API server address
echo "EXPO_PUBLIC_API_BASE=http://your-api-host:3000" > .env

npx expo start
```

For remote development (phone on different network):

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<public-ip> npx expo start --port <port>
```

### Build APK

```bash
npm install -g eas-cli
eas login
eas secret:create --name EXPO_PUBLIC_API_BASE --value "http://your-api-host:3000"
eas build --platform android --profile preview
```

The APK will be available for download from the EAS dashboard.

## Tech Stack

- React Native + Expo SDK 54
- TypeScript
- expo-av (audio playback with background support)
- expo-file-system (audio caching)
- expo-secure-store (token storage)
- react-native-safe-area-context

## License

Personal use only.
