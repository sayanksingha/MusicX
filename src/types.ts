export interface Song {
  id: string;
  title: string;
  artist: string;
  channelName: string;
  channelId?: string;
  thumbnail: string;
  duration: number; // in seconds
  durationFormatted: string;
  views?: number;
  uploadedAt?: string;
  url: string;
  isOffline?: boolean;
}

export interface Playlist {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  coverUrl?: string;
  songs: Song[];
  createdAt: number;
  updatedAt?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: number;
}

export interface OfflineTrack {
  id: string;
  song: Song;
  downloadedAt: number;
  audioBlob?: Blob;
  blobUrl?: string;
  fileSize?: number;
}

export interface LyricsData {
  title: string;
  artist: string;
  lyrics: string;
  lines?: { time?: number; text: string }[];
  isAiGenerated?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: Song[];
  queueIndex: number;
  history: Song[];
  showLyrics: boolean;
  showQueue: boolean;
  showVideo: boolean;
}
