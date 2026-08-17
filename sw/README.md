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
- Native SoundCloud audio streaming with AAC HLS playback
- Queue management and autoplay related tracks
- Song Radio
- Full-screen Now Playing experience
- Mini player with seek, volume, shuffle and repeat
- Lyrics panel
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

Set `SOUNDCLOUD_CLIENT_ID` and `SOUNDCLOUD_CLIENT_SECRET` in the server/deployment environment. Keep both secrets server-side. `GEMINI_API_KEY` is optional for any remaining AI features.


## Swargam Connect

- **Background playback:** Media Session metadata and lock-screen/headset controls are enabled where the browser/OS supports background media. Offline HTML5 audio can continue in supported mobile browsers. Online playback uses SoundCloud native audio streams with Media Session controls. SoundCloud stream availability and background playback remain subject to browser/OS policies.
- **Jam:** Start a live Jam and share the six-character code. Participants receive synchronized track, queue and play/pause state over Server-Sent Events.
- **Seamless device playback:** Create a Sync session and join it from another device/browser with the code. Current track, queue, playback position and playback settings are synchronized.

The live sync room store is intentionally in-memory for this deployment. For durable multi-instance production sync, use a shared Redis/Postgres-backed realtime service.

## Latest performance + lyrics update
- Live search uses a lightweight `/api/suggest` endpoint, local-first suggestions, request cancellation, and caching.
- Search result rendering is scheduled as a low-priority React transition so typing remains responsive.
- Mobile/touch CSS disables expensive hover transitions and backdrop filters.
- Playback position polling is reduced to avoid unnecessary full-app rerenders.
- Lyrics now use LRCLIB metadata/search with 24-hour server caching and support plain/synced lyrics when available.

## SoundCloud setup

Swargam uses SoundCloud track search and native stream URLs instead of YouTube. The current SoundCloud developer flow requires registering an app and obtaining a Client ID and Client Secret; keep them on the server and never embed them in the React bundle. SoundCloud requires attribution for custom-player streaming, so Swargam links the playing track back to its SoundCloud source.
