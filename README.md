# FanTune

A minimal, elegant music player app built with React Native + Expo, powered by KuGou Music API.

Designed for one thing — listening to music without distractions.

## Features

### Core
- **Search & Play** — Search songs with autocomplete suggestions
- **Synced Lyrics** — Real-time scrolling lyrics with tap-to-seek
- **Play Queue** — Loop all, loop one, shuffle
- **Audio Caching** — Songs are cached locally to save bandwidth
- **Quality Selection** — Switch between 128/320/FLAC in player

### Library
- **My Playlists** — Synced from KuGou account
- **Play History** — Recent listening history
- **Style Recommendations** — Browse by genre, mood, and language
- **Artist Page** — Tap artist name to see all songs

### Details
- **Song Climax** — One-tap jump to the chorus
- **Play History Sync** — Listening data synced back to KuGou
- **Phone Login** — SMS verification with secure token storage

## Architecture

```
app/
├── App.tsx              # Root: tabs, modals, auth
└── src/
    ├── api/
    │   ├── client.ts    # HTTP client with auth
    │   ├── music.ts     # Search, playlist, lyrics, etc.
    │   ├── auth.ts      # Login, token refresh
    │   └── audioCache.ts # Local file caching
    ├── components/
    │   ├── ProgressBar   # Draggable seek bar
    │   ├── MiniPlayer    # Bottom bar with current lyric
    │   └── Lyrics        # Synced scroll with seek controls
    ├── hooks/
    │   └── usePlayer     # Audio engine, queue, state
    ├── screens/
    │   ├── SearchScreen  # Search with suggestions
    │   ├── LibraryScreen # Playlists, history, recommendations
    │   ├── PlayerScreen  # Full-screen player
    │   ├── ArtistScreen  # Artist detail
    │   └── LoginScreen   # Phone SMS login
    └── theme/
        └── colors.ts     # Design tokens
```

## Setup

```bash
npm install

# Create .env with your API server address
echo "EXPO_PUBLIC_API_BASE=http://your-api-host:3000" > .env

npx expo start
```

### Prerequisites

- Node.js 18+
- [KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) running on a server
- KuGou Music account (VIP recommended for high-quality audio)

### Remote development

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<public-ip> npx expo start --port <port>
```

## Tech Stack

- React Native + Expo SDK 54
- TypeScript
- expo-av (audio playback)
- expo-file-system (audio caching)
- expo-secure-store (token storage)

## License

Personal use only.
