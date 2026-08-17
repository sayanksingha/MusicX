import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import ytSearch from 'yt-search';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini client lazily if key is available
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Gemini API client failed to initialize:', err);
    }
  }
  return aiClient;
}

// API Routes


// Live playback sync / Jam sessions. This is intentionally lightweight and
// in-memory; for multi-instance production deployments, move session state
// and fan-out to Redis/Postgres/WebSocket infrastructure.
type SyncClient = { id: string; res: any; token: string };
type SyncRoom = {
  code: string;
  token: string;
  mode: 'jam' | 'sync';
  createdAt: number;
  state: any;
  clients: Set<SyncClient>;
  tokens: Set<string>;
};
const syncRooms = new Map<string, SyncRoom>();
setInterval(() => {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of syncRooms) {
    if (room.createdAt < cutoff && room.clients.size === 0) syncRooms.delete(code);
  }
}, 30 * 60 * 1000);

function makeSyncCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}
function makeToken(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}
function broadcastSync(room: SyncRoom, payload: any, excludeToken?: string) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of room.clients) {
    if (excludeToken && client.token === excludeToken) continue;
    try { client.res.write(message); } catch { room.clients.delete(client); }
  }
}

app.post('/api/sync/create', (req, res) => {
  let code = makeSyncCode();
  while (syncRooms.has(code)) code = makeSyncCode();
  const token = makeToken();
  const room: SyncRoom = {
    code,
    token,
    mode: req.body?.mode === 'jam' ? 'jam' : 'sync',
    createdAt: Date.now(),
    state: req.body?.state || null,
    clients: new Set(),
    tokens: new Set([token]),
  };
  syncRooms.set(code, room);
  res.json({ code, token, mode: room.mode, state: room.state });
});

app.post('/api/sync/join', (req, res) => {
  const code = String(req.body?.code || '').toUpperCase();
  const room = syncRooms.get(code);
  if (!room) return res.status(404).json({ error: 'Session not found or expired.' });
  const token = makeToken();
  room.tokens.add(token);
  res.json({ code, token, mode: room.mode, state: room.state });
});

app.get('/api/sync/events', (req, res) => {
  const code = String(req.query.code || '').toUpperCase();
  const token = String(req.query.token || '');
  const room = syncRooms.get(code);
  if (!room || !token || !room.tokens.has(token)) return res.status(404).end();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
  const client: SyncClient = { id: makeToken(), res, token };
  room.clients.add(client);
  if (room.state) res.write(`data: ${JSON.stringify({ type: 'state', state: room.state })}\n\n`);
  const heartbeat = setInterval(() => { try { res.write(': heartbeat\n\n'); } catch {} }, 15000);
  req.on('close', () => { clearInterval(heartbeat); room.clients.delete(client); });
});

app.post('/api/sync/state', (req, res) => {
  const code = String(req.body?.code || '').toUpperCase();
  const room = syncRooms.get(code);
  if (!room) return res.status(404).json({ error: 'Session not found or expired.' });
  const token = String(req.body?.token || '');
  if (!room.tokens.has(token)) return res.status(403).json({ error: 'Invalid session token.' });
  const state = req.body?.state;
  if (!state) return res.status(400).json({ error: 'Playback state is required.' });
  room.state = { ...state, updatedAt: Date.now() };
  broadcastSync(room, { type: 'state', state: room.state }, token);
  res.json({ ok: true, updatedAt: room.state.updatedAt });
});

app.post('/api/sync/leave', (req, res) => {
  const code = String(req.body?.code || '').toUpperCase();
  const room = syncRooms.get(code);
  if (!room) return res.json({ ok: true });
  if (room.clients.size === 0) syncRooms.delete(code);
  res.json({ ok: true });
});


// Music-first YouTube result filtering.
// Swargam should surface songs and music videos, not arbitrary long-form videos.
const BLOCKED_MUSIC_RESULT_TERMS = [
  'full album', 'album mix', 'mixtape', 'playlist', 'compilation', 'compilations',
  '1 hour', '2 hour', '3 hour', '4 hour', '5 hour', '8 hour', '10 hour', '24/7',
  'podcast', 'interview', 'reaction', 'reacts', 'review', 'commentary', 'explained',
  'documentary', 'tutorial', 'gameplay', 'walkthrough', 'news', 'vlog', 'livestream',
  'live stream', 'webinar', 'concert full', 'full concert', 'setlist',
  'karaoke version', 'instrumental mix'
];

const BLOCKED_MUSIC_WHOLE_WORDS = [
  'radio', 'mix'
];

const MUSIC_RESULT_TERMS = [
  'official audio', 'official music video', 'official video', 'music video',
  'lyric video', 'lyrics', 'audio', 'visualizer', 'song', 'music', 'mv',
  'remix', 'single', 'acoustic', 'cover'
];

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\u2018\u2019]/g, "'").trim();
}

function isLikelyMusicVideo(video: any) {
  const title = normalizeSearchText(video.title || '');
  const author = normalizeSearchText(video.author?.name || '');
  const text = `${title} ${author}`;
  const seconds = Number(video.seconds || 0);

  // Exclude long-form content. Music videos/audio releases are normally short.
  if (seconds > 15 * 60) return false;
  if (seconds > 0 && seconds < 45) return false;

  // Explicitly remove common non-music formats.
  if (BLOCKED_MUSIC_RESULT_TERMS.some(term => text.includes(term))) return false;

  const words = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));
  if (BLOCKED_MUSIC_WHOLE_WORDS.some(term => words.has(term))) return false;

  return true;
}

function musicScore(video: any, query = '') {
  const title = normalizeSearchText(video.title || '');
  const author = normalizeSearchText(video.author?.name || '');
  const text = `${title} ${author}`;
  let score = 0;

  // Prefer official releases and music-video formats.
  for (const term of MUSIC_RESULT_TERMS) {
    if (title.includes(term)) score += term.includes('official') ? 8 : 3;
  }

  if (title.includes('official audio')) score += 10;
  if (title.includes('official music video')) score += 10;
  if (title.includes('music video')) score += 8;
  if (title.includes('lyric video')) score += 5;
  if (title.includes('audio')) score += 4;

  // Search intent should be rewarded when the title contains query words.
  const queryWords = normalizeSearchText(query)
    .split(/\s+/)
    .filter(w => w.length > 2);
  for (const word of queryWords) {
    if (text.includes(word)) score += 2;
  }

  // Prefer normal song lengths without excluding longer legitimate tracks.
  const seconds = Number(video.seconds || 0);
  if (seconds >= 120 && seconds <= 420) score += 4;
  else if (seconds > 420 && seconds <= 900) score += 1;

  return score;
}

function selectMusicResults(videos: any[], query = '', limit = 25) {
  return videos
    .filter(isLikelyMusicVideo)
    .map(video => ({ video, score: musicScore(video, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.video);
}

function mapVideoToSong(v: any, fallbackArtist = 'Swargam') {
  return {
    id: v.videoId,
    title: v.title,
    artist: v.author?.name || fallbackArtist,
    channelName: v.author?.name || fallbackArtist,
    channelId: v.author?.url || '',
    thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
    duration: v.seconds || 0,
    durationFormatted: v.timestamp || '0:00',
    views: v.views || 0,
    uploadedAt: v.ago || '',
    url: v.url || `https://www.youtube.com/watch?v=${v.videoId}`,
  };
}

// Short-lived in-memory cache keeps repeated searches and live suggestions fast.
const musicSearchCache = new Map<string, { expiresAt: number; songs: any[] }>();
const MUSIC_SEARCH_CACHE_TTL = 5 * 60 * 1000;

function getCachedMusicSearch(query: string) {
  const key = query.trim().toLowerCase();
  const hit = musicSearchCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    musicSearchCache.delete(key);
    return null;
  }
  return hit.songs;
}

function setCachedMusicSearch(query: string, songs: any[]) {
  const key = query.trim().toLowerCase();
  musicSearchCache.set(key, { expiresAt: Date.now() + MUSIC_SEARCH_CACHE_TTL, songs });
  if (musicSearchCache.size > 200) {
    const oldest = musicSearchCache.keys().next().value;
    if (oldest) musicSearchCache.delete(oldest);
  }
}

// Lightweight suggestion endpoint. It returns only a handful of music results
// and has its own cache so live typing does not compete with full search.
app.get('/api/suggest', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (query.length < 2) return res.json({ songs: [] });

    const cached = getCachedMusicSearch(`suggest:${query}`);
    if (cached) return res.json({ songs: cached.slice(0, 6) });

    const searchResult = await ytSearch(`${query} song`);
    const videos = selectMusicResults(searchResult.videos || [], query, 6);
    const songs = videos.map((v) => mapVideoToSong(v));
    setCachedMusicSearch(`suggest:${query}`, songs);
    res.json({ songs });
  } catch (error: any) {
    res.status(200).json({ songs: [] });
  }
});

// 1. Song Search API
app.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.json({ songs: [] });
    }

    const requestedLimit = Math.min(25, Math.max(1, Number(req.query.limit) || 25));
    const cached = getCachedMusicSearch(query);
    if (cached) return res.json({ songs: cached.slice(0, requestedLimit) });

    const musicQuery = `${query} song official audio music video`;
    const searchResult = await ytSearch(musicQuery);
    const videos = selectMusicResults(searchResult.videos || [], query, 25);
    const songs = videos.map((v) => mapVideoToSong(v));
    setCachedMusicSearch(query, songs);

    res.json({ songs: songs.slice(0, requestedLimit) });
  } catch (error: any) {
    console.error('Error in /api/search:', error);
    res.status(500).json({ error: 'Failed to search music', details: error?.message });
  }
});

// 2. Trending & Curated Playlists
app.get('/api/trending', async (req, res) => {
  try {
    const category = (req.query.category as string || 'top-hits').toLowerCase();

    let query = 'top music hits 2026';
    if (category === 'lofi') query = 'lofi chill beats live study relax';
    else if (category === 'pop') query = 'popular pop songs official music video';
    else if (category === 'hiphop') query = 'top hip hop rap songs';
    else if (category === 'chill') query = 'chill acoustic songs acoustic mix';
    else if (category === 'rock') query = 'classic rock hits rock anthems';
    else if (category === 'indie') query = 'indie pop indie folk discoveries';
    else if (category === 'synthwave') query = 'synthwave retrowave 80s synth music';
    else if (category === 'workout') query = 'workout motivation gym hype songs';
    else if (category === 'kpop') query = 'top kpop hits songs';
    else if (category === 'classical') query = 'classical piano study relax music';

    const musicQuery = `${query} song official audio music video`;
    const searchResult = await ytSearch(musicQuery);
    const videos = selectMusicResults(searchResult.videos || [], category, 20);

    const songs = videos.map((v) => mapVideoToSong(v, 'Various Artists'))

    res.json({ category, songs });
  } catch (error: any) {
    console.error('Error in /api/trending:', error);
    res.status(500).json({ error: 'Failed to fetch trending songs' });
  }
});

// 3. Related Songs (For Autoplay Queue)
app.get('/api/related', async (req, res) => {
  try {
    const title = (req.query.title as string || '').trim();
    const artist = (req.query.artist as string || '').trim();

    const query = `${title} ${artist} similar song official audio`;
    const searchResult = await ytSearch(query);
    const videos = selectMusicResults(searchResult.videos || [], `${title} ${artist}`, 12)
      .filter((v) => v.videoId !== req.query.excludeId);

    const songs = videos.map((v) => mapVideoToSong(v, artist || 'Swargam'))

    res.json({ songs });
  } catch (error: any) {
    console.error('Error in /api/related:', error);
    res.json({ songs: [] });
  }
});

// 4. Lyrics API
// Use LRCLIB for licensed/available lyrics metadata rather than asking an AI
// model to reproduce copyrighted lyrics. LRCLIB supports plain and synced lyrics
// and does not require an API key.
const lyricsCache = new Map<string, { expiresAt: number; data: any }>();
const LYRICS_CACHE_TTL = 24 * 60 * 60 * 1000;

app.get('/api/lyrics', async (req, res) => {
  const title = (req.query.title as string || '').trim();
  const artist = (req.query.artist as string || '').trim();
  const duration = Number(req.query.duration || 0);

  if (!title) return res.status(400).json({ error: 'Title is required' });

  const key = `${title.toLowerCase()}|${artist.toLowerCase()}|${duration}`;
  const cached = lyricsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.data);

  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    if (duration > 0) params.set('duration', String(Math.round(duration)));

    const response = await fetch(`https://lrclib.net/api/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'Swargam/1.0 (music player)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`LRCLIB ${response.status}`);
    const results = await response.json();

    const ranked = Array.isArray(results) ? [...results].sort((a: any, b: any) => {
      const ad = Math.abs(Number(a.duration || 0) - duration);
      const bd = Math.abs(Number(b.duration || 0) - duration);
      return ad - bd;
    }) : [];
    const best = ranked[0];

    const data = best ? {
      title: best.trackName || best.name || title,
      artist: best.artistName || artist,
      lyrics: best.plainLyrics || '',
      syncedLyrics: best.syncedLyrics || '',
      source: 'LRCLIB',
      available: !!(best.plainLyrics || best.syncedLyrics),
    } : {
      title,
      artist,
      lyrics: '',
      syncedLyrics: '',
      source: 'LRCLIB',
      available: false,
    };

    lyricsCache.set(key, { expiresAt: Date.now() + LYRICS_CACHE_TTL, data });
    if (lyricsCache.size > 500) lyricsCache.delete(lyricsCache.keys().next().value as string);
    res.json(data);
  } catch (error: any) {
    console.error('Lyrics lookup failed:', error?.message || error);
    res.json({ title, artist, lyrics: '', syncedLyrics: '', source: 'LRCLIB', available: false });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Swargam Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
