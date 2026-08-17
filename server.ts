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


// 1. Song Search API
app.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.json({ songs: [] });
    }

    const searchResult = await ytSearch(query);
    const videos = (searchResult.videos || []).slice(0, 25);

    const songs = videos.map((v) => ({
      id: v.videoId,
      title: v.title,
      artist: v.author?.name || 'Unknown Artist',
      channelName: v.author?.name || 'Swargam',
      channelId: v.author?.url || '',
      thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      duration: v.seconds || 0,
      durationFormatted: v.timestamp || '0:00',
      views: v.views || 0,
      uploadedAt: v.ago || '',
      url: v.url || `https://www.youtube.com/watch?v=${v.videoId}`,
    }));

    res.json({ songs });
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

    const searchResult = await ytSearch(query);
    const videos = (searchResult.videos || []).slice(0, 20);

    const songs = videos.map((v) => ({
      id: v.videoId,
      title: v.title,
      artist: v.author?.name || 'Various Artists',
      channelName: v.author?.name || 'Swargam',
      thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      duration: v.seconds || 0,
      durationFormatted: v.timestamp || '0:00',
      views: v.views || 0,
      uploadedAt: v.ago || '',
      url: v.url || `https://www.youtube.com/watch?v=${v.videoId}`,
    }));

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

    const query = `${title} ${artist} similar songs mix audio`;
    const searchResult = await ytSearch(query);
    const videos = (searchResult.videos || []).slice(1, 10); // Skip first to avoid duplicate

    const songs = videos.map((v) => ({
      id: v.videoId,
      title: v.title,
      artist: v.author?.name || artist || 'Swargam',
      channelName: v.author?.name || 'Swargam',
      thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      duration: v.seconds || 0,
      durationFormatted: v.timestamp || '0:00',
      views: v.views || 0,
      uploadedAt: v.ago || '',
      url: v.url || `https://www.youtube.com/watch?v=${v.videoId}`,
    }));

    res.json({ songs });
  } catch (error: any) {
    console.error('Error in /api/related:', error);
    res.json({ songs: [] });
  }
});

// 4. Lyrics API (Powered by Gemini AI)
app.get('/api/lyrics', async (req, res) => {
  const title = (req.query.title as string || '').trim();
  const artist = (req.query.artist as string || '').trim();

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      title,
      artist,
      lyrics: `[Verse 1]\nListening to ${title} by ${artist}\n\n[Chorus]\nEnjoy high fidelity music streaming on Swargam.`,
      isAiGenerated: false,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide full, clean lyrics for the song "${title}" by "${artist}". Output format:
Title: ${title}
Artist: ${artist}

[Lyrics text organized into Verse, Chorus, Bridge, etc. Do not include extra conversational text or disclaimers.]`,
    });

    const lyricsText = response.text || `No lyrics found for "${title}".`;
    res.json({
      title,
      artist,
      lyrics: lyricsText,
      isAiGenerated: true,
    });
  } catch (err: any) {
    console.error('Error fetching lyrics from Gemini:', err);
    res.json({
      title,
      artist,
      lyrics: `Full lyrics for "${title}" by ${artist}.\n\n[Lyrics currently unavailable. Enjoy listening!]`,
      isAiGenerated: false,
    });
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
