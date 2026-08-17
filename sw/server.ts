import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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


// SoundCloud music catalog + native streaming.
// Credentials stay server-side. Search only asks SoundCloud for playable tracks.
const SOUNDCLOUD_API = 'https://api.soundcloud.com';
const SOUNDCLOUD_OAUTH = 'https://secure.soundcloud.com/oauth/token';
let soundCloudToken: { accessToken: string; expiresAt: number } | null = null;

async function getSoundCloudToken(): Promise<string> {
  if (soundCloudToken && soundCloudToken.expiresAt > Date.now() + 60_000) {
    return soundCloudToken.accessToken;
  }

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SoundCloud credentials are not configured. Set SOUNDCLOUD_CLIENT_ID and SOUNDCLOUD_CLIENT_SECRET.');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(SOUNDCLOUD_OAUTH, {
    method: 'POST',
    headers: {
      accept: 'application/json; charset=utf-8',
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SoundCloud token request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  soundCloudToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max(60, Number(data.expires_in || 3600) - 120) * 1000,
  };
  return soundCloudToken.accessToken;
}

async function soundCloudFetch(pathname: string, init: RequestInit = {}) {
  const token = await getSoundCloudToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `OAuth ${token}`);
  headers.set('Accept', 'application/json; charset=utf-8');
  return fetch(`${SOUNDCLOUD_API}${pathname}`, { ...init, headers });
}

const soundCloudSearchCache = new Map<string, { expiresAt: number; songs: SongLike[] }>();
const SOUNDCLOUD_CACHE_TTL = 5 * 60 * 1000;
type SongLike = {
  id: string;
  title: string;
  artist: string;
  channelName: string;
  channelId?: string;
  thumbnail: string;
  duration: number;
  durationFormatted: string;
  views?: number;
  uploadedAt?: string;
  url: string;
  genre?: string;
  source?: string;
  streamable?: boolean;
};

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function soundCloudArtwork(url?: string) {
  if (!url) return 'https://soundcloud.com/images/visual-identity/logo-500.png';
  return url.replace('-large', '-t500x500').replace('-t300x300', '-t500x500');
}

function mapSoundCloudTrack(track: any): SongLike {
  const artist = track.user?.username || track.metadata_artist || 'Unknown Artist';
  const id = String(track.id ?? track.urn ?? '');
  return {
    id: `sc:${id}`,
    title: track.title || 'Untitled',
    artist,
    channelName: artist,
    channelId: track.user?.urn || (track.user?.id ? String(track.user.id) : ''),
    thumbnail: soundCloudArtwork(track.artwork_url || track.user?.avatar_url),
    duration: Math.round(Number(track.duration || 0) / 1000),
    durationFormatted: formatDuration(Number(track.duration || 0) / 1000),
    views: track.playback_count || 0,
    uploadedAt: track.created_at || '',
    url: track.permalink_url || `https://soundcloud.com/${artist}/${encodeURIComponent(track.title || 'track')}`,
    genre: track.genre || '',
    source: 'SoundCloud',
    streamable: track.access === 'playable' || track.streamable !== false,
  };
}

function stripSoundCloudId(id: string) {
  return String(id || '').replace(/^sc:/, '');
}

function getCachedSC(key: string) {
  const hit = soundCloudSearchCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    soundCloudSearchCache.delete(key);
    return null;
  }
  return hit.songs;
}

function setCachedSC(key: string, songs: SongLike[]) {
  soundCloudSearchCache.set(key, { expiresAt: Date.now() + SOUNDCLOUD_CACHE_TTL, songs });
  if (soundCloudSearchCache.size > 250) {
    const oldest = soundCloudSearchCache.keys().next().value;
    if (oldest) soundCloudSearchCache.delete(oldest);
  }
}

function rankSoundCloudTracks(tracks: any[], query: string, limit: number) {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  return tracks
    .filter((t) => t?.access !== 'blocked' && t?.access !== 'preview' && t?.streamable !== false)
    .filter((t) => Number(t.duration || 0) >= 45_000 && Number(t.duration || 0) <= 20 * 60_000)
    .map((track) => {
      const title = String(track.title || '').toLowerCase();
      const artist = String(track.user?.username || track.metadata_artist || '').toLowerCase();
      const genre = String(track.genre || '').toLowerCase();
      let score = 0;
      if (title === q) score += 20;
      if (title.includes(q)) score += 12;
      if (artist.includes(q)) score += 8;
      if (genre.includes(q)) score += 4;
      for (const word of words) if (title.includes(word) || artist.includes(word)) score += 2;
      if (track.kind === 'track') score += 2;
      if (track.playback_count) score += Math.min(5, Math.log10(Number(track.playback_count) + 1));
      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ track }) => mapSoundCloudTrack(track));
}

async function searchSoundCloud(query: string, limit = 25) {
  const key = `${query.toLowerCase().trim()}|${limit}`;
  const cached = getCachedSC(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: query,
    access: 'playable',
    limit: String(Math.min(200, Math.max(limit * 2, 20))),
    linked_partitioning: 'true',
  });
  const response = await soundCloudFetch(`/tracks?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SoundCloud search failed (${response.status}): ${text.slice(0, 300)}`);
  }
  const data = await response.json();
  const songs = rankSoundCloudTracks(data.collection || [], query, limit);
  setCachedSC(key, songs);
  return songs;
}

// Live music suggestions.
app.get('/api/suggest', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) return res.json({ songs: [] });
    res.json({ songs: (await searchSoundCloud(query, 6)).slice(0, 6) });
  } catch (error: any) {
    console.error('SoundCloud suggest:', error?.message || error);
    res.json({ songs: [] });
  }
});

// Music search.
app.get('/api/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json({ songs: [] });
    const requestedLimit = Math.min(25, Math.max(1, Number(req.query.limit) || 25));
    res.json({ songs: (await searchSoundCloud(query, requestedLimit)).slice(0, requestedLimit) });
  } catch (error: any) {
    console.error('SoundCloud search:', error?.message || error);
    res.status(500).json({ error: 'SoundCloud search failed', details: error?.message });
  }
});

// Curated category searches.
app.get('/api/trending', async (req, res) => {
  try {
    const category = String(req.query.category || 'top-hits').toLowerCase();
    const queries: Record<string, string> = {
      'top-hits': 'top hits songs',
      lofi: 'lofi chill beats',
      pop: 'popular pop songs',
      hiphop: 'hip hop rap',
      chill: 'chill acoustic',
      rock: 'rock songs',
      indie: 'indie pop',
      synthwave: 'synthwave',
      workout: 'workout music',
      kpop: 'kpop',
      classical: 'classical piano',
    };
    const songs = await searchSoundCloud(queries[category] || category, 20);
    res.json({ category, songs });
  } catch (error: any) {
    console.error('SoundCloud trending:', error?.message || error);
    res.status(500).json({ error: 'Failed to fetch music' });
  }
});

// Same-genre / related radio using SoundCloud's related-tracks endpoint first,
// with a genre search fallback. The current track is always excluded.
app.get('/api/related', async (req, res) => {
  try {
    const id = stripSoundCloudId(String(req.query.id || req.query.excludeId || ''));
    const title = String(req.query.title || '').trim();
    const artist = String(req.query.artist || '').trim();
    const genre = String(req.query.genre || '').trim();
    const excludeIds = new Set(String(req.query.excludeIds || '').split(',').map((x) => x.trim()).filter(Boolean));
    if (id) excludeIds.add(`sc:${id}`);

    let candidates: SongLike[] = [];
    if (id) {
      const response = await soundCloudFetch(`/tracks/${encodeURIComponent(id)}/related?access=playable&limit=50&linked_partitioning=true`);
      if (response.ok) {
        const data = await response.json();
        candidates = rankSoundCloudTracks(data.collection || [], `${artist} ${genre} ${title}`, 30);
      }
    }

    if (candidates.length < 12) {
      const q = genre ? `${genre} ${artist}` : `${artist} ${title}`;
      candidates = [...candidates, ...(await searchSoundCloud(q, 30))];
    }

    const unique = new Map<string, SongLike>();
    for (const song of candidates) {
      if (!song.id || excludeIds.has(song.id) || unique.has(song.id)) continue;
      unique.set(song.id, song);
    }
    res.json({ songs: Array.from(unique.values()).slice(0, 12) });
  } catch (error: any) {
    console.error('SoundCloud related:', error?.message || error);
    res.json({ songs: [] });
  }
});

// Resolve a streamable SoundCloud track to an AAC HLS stream URL.
// The access token remains server-side; only the signed playback URL is returned.
async function resolveSoundCloudStream(id: string) {
  const response = await soundCloudFetch(`/tracks/${encodeURIComponent(id)}/streams`);
  if (!response.ok) throw new Error(`SoundCloud stream lookup failed: ${response.status}`);
  const data = await response.json();
  return data.hls_aac_160_url || data.hls_aac_96_url || data.http_mp3_128_url || data.hls_mp3_128_url;
}

app.get('/api/stream/:id', async (req, res) => {
  try {
    const id = stripSoundCloudId(String(req.params.id || ''));
    if (!id) return res.status(400).end();
    const streamUrl = await resolveSoundCloudStream(id);
    if (!streamUrl) return res.status(404).json({ error: 'No playable stream for this track' });
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.redirect(302, streamUrl);
  } catch (error: any) {
    console.error('SoundCloud stream:', error?.message || error);
    res.status(502).json({ error: 'Unable to resolve stream' });
  }
});

app.get('/api/stream-info', async (req, res) => {
  try {
    const id = stripSoundCloudId(String(req.query.id || ''));
    if (!id) return res.status(400).json({ error: 'Track id is required' });
    const streamUrl = await resolveSoundCloudStream(id);
    if (!streamUrl) return res.status(404).json({ error: 'No playable stream for this track' });
    res.setHeader('Cache-Control', 'private, max-age=30');
    res.json({ url: streamUrl, type: streamUrl.includes('.m3u8') ? 'hls' : 'progressive', source: 'SoundCloud' });
  } catch (error: any) {
    console.error('SoundCloud stream-info:', error?.message || error);
    res.status(502).json({ error: 'Unable to resolve stream' });
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
