import { Song, Playlist } from '../types';
import { getCurrentUser } from './auth';

function getUserKey(baseKey: string): string {
  const user = getCurrentUser();
  return `${baseKey}_${user.id}`;
}

const LIKED_SONGS_BASE = 'musify_liked_songs_v2';
const PLAYLISTS_BASE = 'musify_playlists_v2';
const HISTORY_BASE = 'musify_history_v2';

export function getLikedSongs(): Song[] {
  try {
    const key = getUserKey(LIKED_SONGS_BASE);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function toggleLikedSong(song: Song): Song[] {
  const current = getLikedSongs();
  const exists = current.some((s) => s.id === song.id);
  let updated: Song[];
  if (exists) {
    updated = current.filter((s) => s.id !== song.id);
  } else {
    updated = [song, ...current];
  }
  const key = getUserKey(LIKED_SONGS_BASE);
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export function isSongLiked(songId: string): boolean {
  return getLikedSongs().some((s) => s.id === songId);
}

export function getPlaylists(): Playlist[] {
  try {
    const key = getUserKey(PLAYLISTS_BASE);
    const data = localStorage.getItem(key);
    if (!data) {
      const user = getCurrentUser();
      const initial: Playlist[] = [
        {
          id: `fav_${user.id}`,
          userId: user.id,
          name: 'My Favorites',
          description: 'Tracks you have saved and favorited',
          songs: getLikedSongs(),
          createdAt: Date.now(),
        },
        {
          id: `chill_${user.id}`,
          userId: user.id,
          name: 'Midnight Vibes',
          description: 'Relaxing ambient, acoustic and lofi tracks',
          songs: [],
          createdAt: Date.now(),
        },
      ];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function savePlaylists(playlists: Playlist[]): void {
  const key = getUserKey(PLAYLISTS_BASE);
  localStorage.setItem(key, JSON.stringify(playlists));
}

export function createPlaylist(name: string, description?: string): Playlist[] {
  const playlists = getPlaylists();
  const user = getCurrentUser();
  const newPl: Playlist = {
    id: `pl_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    name,
    description: description || 'Personal playlist collection',
    songs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const updated = [newPl, ...playlists];
  savePlaylists(updated);
  return updated;
}

export function updatePlaylistInfo(playlistId: string, name: string, description?: string): Playlist[] {
  const playlists = getPlaylists();
  const updated = playlists.map((pl) => {
    if (pl.id === playlistId) {
      return {
        ...pl,
        name,
        description: description !== undefined ? description : pl.description,
        updatedAt: Date.now(),
      };
    }
    return pl;
  });
  savePlaylists(updated);
  return updated;
}

export function deletePlaylist(playlistId: string): Playlist[] {
  const playlists = getPlaylists();
  const updated = playlists.filter((pl) => pl.id !== playlistId);
  savePlaylists(updated);
  return updated;
}

export function reorderPlaylistSongs(playlistId: string, songId: string, direction: 'up' | 'down'): Playlist[] {
  const playlists = getPlaylists();
  const updated = playlists.map((pl) => {
    if (pl.id === playlistId) {
      const idx = pl.songs.findIndex((s) => s.id === songId);
      if (idx === -1) return pl;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= pl.songs.length) return pl;

      const newSongs = [...pl.songs];
      const [moved] = newSongs.splice(idx, 1);
      newSongs.splice(targetIdx, 0, moved);

      return { ...pl, songs: newSongs, updatedAt: Date.now() };
    }
    return pl;
  });
  savePlaylists(updated);
  return updated;
}

export function addSongToPlaylist(playlistId: string, song: Song): Playlist[] {
  const playlists = getPlaylists();
  const updated = playlists.map((pl) => {
    if (pl.id === playlistId) {
      if (pl.songs.some((s) => s.id === song.id)) return pl;
      return { ...pl, songs: [...pl.songs, song], updatedAt: Date.now() };
    }
    return pl;
  });
  savePlaylists(updated);
  return updated;
}

export function removeSongFromPlaylist(playlistId: string, songId: string): Playlist[] {
  const playlists = getPlaylists();
  const updated = playlists.map((pl) => {
    if (pl.id === playlistId) {
      return { ...pl, songs: pl.songs.filter((s) => s.id !== songId), updatedAt: Date.now() };
    }
    return pl;
  });
  savePlaylists(updated);
  return updated;
}

export function getHistory(): Song[] {
  try {
    const key = getUserKey(HISTORY_BASE);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function addToHistory(song: Song): Song[] {
  const current = getHistory().filter((s) => s.id !== song.id);
  const updated = [song, ...current].slice(0, 50); // Keep last 50
  const key = getUserKey(HISTORY_BASE);
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
