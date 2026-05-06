# FanTune

A minimal, elegant music player app built with React Native + Expo, powered by KuGou Music API.

## Why

KuGou Music's official app is bloated with ads, social features, and pop-ups. FanTune strips all that away — just music, lyrics, and nothing else.

## Features

- **Search & Play** — Search songs, play in 128/320/FLAC quality
- **Synced Lyrics** — Real-time scrolling lyrics with tap-to-seek
- **Play Queue** — Previous/next, loop all, loop one, shuffle
- **Progress Control** — Draggable progress bar with tap-to-jump
- **Auth** — Phone SMS login, token auto-refresh, secure storage

### Discovery & Library

- **Search suggestions** — Autocomplete as you type
- **My playlists** — Synced from KuGou account
- **Play history** — Recent listening history
- **Style recommendations** — Browse by genre/mood/language tags
- **Song comments** — View hot comments in player
- **Artist page** — Tap artist name to see all songs
- **Song climax** — One-tap jump to the chorus

### Audio

- **Quality selection** — Switch between 128/320/FLAC in player
- **Play history sync** — Listening data synced back to KuGou

## Architecture

```
FanTune/
├── KuGouMusicApi/    # Backend API service (separate project)
└── app/              # This repo — React Native + Expo frontend
    ├── App.tsx
    └── src/
        ├── api/         # API client, music & auth endpoints
        ├── components/  # ProgressBar, MiniPlayer, Lyrics
        ├── hooks/       # usePlayer (audio, queue, state)
        ├── screens/     # SearchScreen, PlayerScreen, LoginScreen
        └── theme/       # Colors & design tokens
```

## Prerequisites

- Node.js 18+
- [KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) running locally or on a server
- KuGou Music account (VIP recommended for high-quality audio)

## Setup

```bash
npm install

# Create .env with your API server address
echo "EXPO_PUBLIC_API_BASE=http://your-api-host:3000" > .env

npx expo start
```

For remote development with frp:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<your-public-ip> npx expo start --port <your-port>
```

## Tech Stack

- React Native + Expo (SDK 54)
- TypeScript
- expo-av (audio playback)
- expo-secure-store (token storage)

## License

Personal use only. Not for distribution.
