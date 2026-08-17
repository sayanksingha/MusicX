import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import ytSearch from 'yt-search';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

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
      channelName: v.author?.name || 'Musify',
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
      channelName: v.author?.name || 'Musify',
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
      artist: v.author?.name || artist || 'Musify',
      channelName: v.author?.name || 'Musify',
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
      lyrics: `[Verse 1]\nListening to ${title} by ${artist}\n\n[Chorus]\nEnjoy high fidelity music streaming on Musify.`,
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
    console.log(`Musify Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
