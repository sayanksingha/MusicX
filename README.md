# Swargam

Swargam is an ad-free, high-fidelity music streaming web app with a Spotify-inspired product model and an original interface.

## Features

- Home / personalized discovery
- Search with live music results
- Trending and genre discovery rails
- Liked Songs
- Playlists with creation, editing, reordering and removal
- Recently Played history
- Offline collection using browser storage
- Queue management and autoplay related tracks
- Song Radio
- Full-screen Now Playing experience
- Mini player with seek, volume, shuffle and repeat
- Lyrics panel
- Video mode
- Audio quality / equalizer / normalization controls
- Crossfade settings
- Sleep timer
- Shareable track links
- Keyboard shortcuts
- Responsive mobile navigation
- Ad-free listening with no advertising surfaces
- Local user profile and persistent library data

## Run locally

```bash
npm install
npm run dev
```

For production:

```bash
npm run build
npm start
```

Set `GEMINI_API_KEY` in the deployment environment when AI-powered lyric assistance is enabled.


## Swargam Connect

- **Background playback:** Media Session metadata and lock-screen/headset controls are enabled where the browser/OS supports background media. Offline HTML5 audio can continue in supported mobile browsers. YouTube iframe playback remains subject to browser and platform background-playback policies.
- **Jam:** Start a live Jam and share the six-character code. Participants receive synchronized track, queue and play/pause state over Server-Sent Events.
- **Seamless device playback:** Create a Sync session and join it from another device/browser with the code. Current track, queue, playback position and playback settings are synchronized.

The live sync room store is intentionally in-memory for this deployment. For durable multi-instance production sync, use a shared Redis/Postgres-backed realtime service.
