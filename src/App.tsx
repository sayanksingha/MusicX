import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Compass,
  Heart,
  Library,
  History,
  Play,
  Shuffle,
  Music,
  Search,
  Grid,
  List,
  Flame,
  Plus,
  Download,
  Settings,
  WifiOff,
  CheckCircle2,
  Trash2,
  Edit3,
} from 'lucide-react';

import { Song, Playlist, RepeatMode, UserProfile, OfflineTrack } from './types';
import {
  getCurrentUser,
  setCurrentUser,
} from './lib/auth';
import {
  getLikedSongs,
  toggleLikedSong,
  getPlaylists,
  createPlaylist,
  updatePlaylistInfo,
  deletePlaylist,
  reorderPlaylistSongs,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getHistory,
  addToHistory,
} from './lib/storage';
import {
  saveSongForOffline,
  getOfflineTracks,
  removeOfflineTrack,
} from './lib/offlineStore';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { SongCard } from './components/SongCard';
import { SongList } from './components/SongList';
import { YouTubeIframePlayer } from './components/YouTubeIframePlayer';
import { LyricsModal } from './components/LyricsModal';
import { QueueDrawer } from './components/QueueDrawer';
import { PlaylistModal } from './components/PlaylistModal';
import { PlaylistEditModal } from './components/PlaylistEditModal';
import { AuthModal } from './components/AuthModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';

const GENRES = [
  { id: 'top-hits', name: '🔥 Top Hits', query: 'top music hits 2026' },
  { id: 'lofi', name: '🎧 Lo-Fi Beats', query: 'lofi chill beats live' },
  { id: 'pop', name: '✨ Pop Anthems', query: 'popular pop songs' },
  { id: 'hiphop', name: '🎤 Hip-Hop & Rap', query: 'top hip hop rap' },
  { id: 'chill', name: '☕ Acoustic Chill', query: 'acoustic songs mix' },
  { id: 'rock', name: '🎸 Rock Hits', query: 'classic rock hits' },
  { id: 'synthwave', name: '🌃 Synthwave 80s', query: 'synthwave retrowave' },
  { id: 'workout', name: '🏋️ Workout Hype', query: 'workout gym hype' },
  { id: 'kpop', name: '🌸 K-Pop Pulse', query: 'top kpop hits' },
  { id: 'classical', name: '🎹 Piano Relax', query: 'classical piano study' },
];

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUserState] = useState<UserProfile>(getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'discover' | 'liked' | 'playlists' | 'history' | 'downloads' | 'search'>('discover');
  const [selectedGenre, setSelectedGenre] = useState<string>('top-hits');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Featured / Trending Songs
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  // Storage / Saved States per user
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [historySongs, setHistorySongs] = useState<Song[]>([]);

  // Offline Downloads State
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrack[]>([]);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Selected Playlist View & Edit Modal
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentOfflineBlobUrl, setCurrentOfflineBlobUrl] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  // Queue State
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [autoPlayRelated, setAutoPlayRelated] = useState<boolean>(true);

  // UI Panels / Modals
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [playlistModalSong, setPlaylistModalSong] = useState<Song | null>(null);

  // Sleep Timer State
  const [showSleepTimerModal, setShowSleepTimerModal] = useState<boolean>(false);
  const [sleepTimerMode, setSleepTimerMode] = useState<'off' | 'end_of_track' | number>('off');
  const [initialTimerMinutes, setInitialTimerMinutes] = useState<number | null>(null);

  // Audio Settings State
  const [showAudioSettingsModal, setShowAudioSettingsModal] = useState<boolean>(false);
  const [crossfadeSeconds, setCrossfadeSeconds] = useState<number>(2);
  const [equalizerPreset, setEqualizerPreset] = useState<string>('Flat / Off');
  const [audioQuality, setAudioQuality] = useState<string>('very high');
  const [volumeNormalization, setVolumeNormalization] = useState<boolean>(true);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Sleep Timer Countdown Effect
  useEffect(() => {
    if (typeof sleepTimerMode !== 'number') return;

    const interval = setInterval(() => {
      setSleepTimerMode((prev) => {
        if (typeof prev !== 'number') return prev;
        if (prev <= 1) {
          setIsPlaying(false);
          showToast('🌙 Sleep timer finished. Playback stopped.');
          return 'off';
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMode, showToast]);

  const handleSetSleepTimer = (mode: 'off' | 'end_of_track' | number) => {
    if (mode === 'off') {
      setSleepTimerMode('off');
      setInitialTimerMinutes(null);
      showToast('Sleep timer turned off.');
    } else if (mode === 'end_of_track') {
      setSleepTimerMode('end_of_track');
      setInitialTimerMinutes(null);
      showToast('🌙 Sleep timer set: Stopping at end of current track.');
    } else {
      // mode is minutes
      const seconds = mode * 60;
      setSleepTimerMode(seconds);
      setInitialTimerMinutes(mode);
      showToast(`🌙 Sleep timer set for ${mode} minute${mode > 1 ? 's' : ''}.`);
    }
  };

  // Network Status
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reload user data when account changes
  const loadUserData = useCallback(() => {
    setLikedSongs(getLikedSongs());
    setPlaylists(getPlaylists());
    setHistorySongs(getHistory());
  }, []);

  useEffect(() => {
    loadUserData();
    fetchTrending('top-hits');
    refreshOfflineTracks();
  }, [loadUserData, currentUser.id]);

  const refreshOfflineTracks = async () => {
    const tracks = await getOfflineTracks();
    setOfflineTracks(tracks);
  };

  // Fetch Trending / Genre songs
  const fetchTrending = async (category: string) => {
    setIsTrendingLoading(true);
    try {
      const res = await fetch(`/api/trending?category=${category}`);
      const data = await res.json();
      setTrendingSongs(data.songs || []);
    } catch (e) {
      console.error('Failed to fetch trending:', e);
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const handleGenreSelect = (genreId: string) => {
    setSelectedGenre(genreId);
    fetchTrending(genreId);
  };

  // Search Submit
  const handleSearchSubmit = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setActiveTab('search');
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.songs || []);
    } catch (e) {
      console.error('Failed to search songs:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Play a song
  const playSong = useCallback(
    async (song: Song, customQueue?: Song[], index?: number) => {
      setCurrentSong(song);
      setIsPlaying(true);

      // Check if song has an offline Blob URL
      const offlineMatch = offlineTracks.find((t) => t.id === song.id);
      if (offlineMatch && offlineMatch.blobUrl) {
        setCurrentOfflineBlobUrl(offlineMatch.blobUrl);
      } else {
        setCurrentOfflineBlobUrl(undefined);
      }

      // Save to history
      const updatedHistory = addToHistory(song);
      setHistorySongs(updatedHistory);

      if (customQueue) {
        setQueue(customQueue);
        setQueueIndex(index !== undefined ? index : customQueue.findIndex((s) => s.id === song.id));
      } else {
        setQueue((prevQueue) => {
          const existingIdx = prevQueue.findIndex((s) => s.id === song.id);
          if (existingIdx !== -1) {
            setQueueIndex(existingIdx);
            return prevQueue;
          } else {
            const newQ = [...prevQueue, song];
            setQueueIndex(newQ.length - 1);
            return newQ;
          }
        });
      }
    },
    [offlineTracks]
  );

  // Add song to queue
  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
    showToast(`Added "${song.title}" to queue`);
  };

  // Start Song Radio Mix
  const handleStartRadio = useCallback(async (targetSong?: Song) => {
    const baseSong = targetSong || currentSong;
    if (!baseSong) return;

    showToast(`📻 Starting radio mix for "${baseSong.title}"...`);

    try {
      const res = await fetch(
        `/api/related?title=${encodeURIComponent(baseSong.title)}&artist=${encodeURIComponent(baseSong.artist)}`
      );
      const data = await res.json();
      if (data.songs && data.songs.length > 0) {
        const radioQueue = [baseSong, ...data.songs];
        setQueue(radioQueue);
        setQueueIndex(0);
        setCurrentSong(baseSong);
        setIsPlaying(true);
        addToHistory(baseSong);
        showToast(`📻 Radio Mix ready: ${radioQueue.length} tracks queued`);
      } else {
        showToast('Radio mix loaded with current track.');
      }
    } catch (err) {
      showToast('Started radio mix.');
    }
  }, [currentSong, showToast]);

  // Share Song Link
  const handleShareSong = useCallback((song: Song) => {
    const shareUrl = `${window.location.origin}?v=${song.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast(`📋 Track link copied to clipboard!`);
    } else {
      showToast(`Shared: ${song.title}`);
    }
  }, [showToast]);

  // Play Next
  const playNextSong = useCallback(async () => {
    // Sleep Timer Check: End of Track
    if (sleepTimerMode === 'end_of_track') {
      setIsPlaying(false);
      setSleepTimerMode('off');
      showToast('🌙 Sleep timer finished at end of track.');
      return;
    }

    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentSong) {
      setSeekTime(0);
      setIsPlaying(true);
      return;
    }

    let nextIndex = queueIndex + 1;

    if (isShuffle && queue.length > 1) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    if (nextIndex < queue.length) {
      const nextTrack = queue[nextIndex];
      setQueueIndex(nextIndex);
      setCurrentSong(nextTrack);
      setIsPlaying(true);

      const offlineMatch = offlineTracks.find((t) => t.id === nextTrack.id);
      setCurrentOfflineBlobUrl(offlineMatch?.blobUrl);

      addToHistory(nextTrack);
    } else {
      if (repeatMode === 'all') {
        const firstTrack = queue[0];
        setQueueIndex(0);
        setCurrentSong(firstTrack);
        setIsPlaying(true);

        const offlineMatch = offlineTracks.find((t) => t.id === firstTrack.id);
        setCurrentOfflineBlobUrl(offlineMatch?.blobUrl);
      } else if (autoPlayRelated && currentSong && !isOffline) {
        try {
          const res = await fetch(
            `/api/related?title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(
              currentSong.artist
            )}`
          );
          const data = await res.json();
          if (data.songs && data.songs.length > 0) {
            const related = data.songs;
            setQueue((prev) => [...prev, ...related]);
            setQueueIndex(queue.length);
            setCurrentSong(related[0]);
            setIsPlaying(true);
            addToHistory(related[0]);
          } else {
            setIsPlaying(false);
          }
        } catch (e) {
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(false);
      }
    }
  }, [
    queue,
    queueIndex,
    repeatMode,
    isShuffle,
    autoPlayRelated,
    currentSong,
    offlineTracks,
    isOffline,
    sleepTimerMode,
    showToast,
  ]);

  // Play Previous
  const playPreviousSong = useCallback(() => {
    if (currentTime > 4) {
      setSeekTime(0);
      return;
    }

    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      const prevTrack = queue[prevIndex];
      setQueueIndex(prevIndex);
      setCurrentSong(prevTrack);
      setIsPlaying(true);

      const offlineMatch = offlineTracks.find((t) => t.id === prevTrack.id);
      setCurrentOfflineBlobUrl(offlineMatch?.blobUrl);
    } else {
      setSeekTime(0);
    }
  }, [currentTime, queueIndex, queue, offlineTracks]);

  // Toggle Like
  const handleLikeToggle = (song: Song) => {
    const updated = toggleLikedSong(song);
    setLikedSongs(updated);
  };

  // Offline Download / Removal
  const handleDownloadToggle = async (song: Song) => {
    const downloaded = offlineTracks.some((t) => t.id === song.id);
    if (downloaded) {
      await removeOfflineTrack(song.id);
      await refreshOfflineTracks();
    } else {
      setDownloadingIds((prev) => new Set(prev).add(song.id));
      await saveSongForOffline(song);
      await refreshOfflineTracks();
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(song.id);
        return next;
      });
    }
  };

  // Create Playlist
  const handleCreatePlaylist = (name: string, description?: string) => {
    const updated = createPlaylist(name, description);
    setPlaylists(updated);
  };

  // Rename / Update Playlist Info
  const handleUpdatePlaylistInfo = (playlistId: string, name: string, description?: string) => {
    const updated = updatePlaylistInfo(playlistId, name, description);
    setPlaylists(updated);
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      setSelectedPlaylist((prev) => (prev ? { ...prev, name, description } : null));
    }
  };

  // Reorder Songs in Playlist
  const handleReorderPlaylistSongs = (playlistId: string, songId: string, direction: 'up' | 'down') => {
    const updated = reorderPlaylistSongs(playlistId, songId, direction);
    setPlaylists(updated);
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      const targetPl = updated.find((p) => p.id === playlistId);
      if (targetPl) setSelectedPlaylist(targetPl);
    }
  };

  // Delete Playlist
  const handleDeletePlaylist = (playlistId: string) => {
    const updated = deletePlaylist(playlistId);
    setPlaylists(updated);
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      setSelectedPlaylist(null);
    }
  };

  // Add Song to Playlist
  const handleAddSongToPlaylist = (playlistId: string, song: Song) => {
    const updated = addSongToPlaylist(playlistId, song);
    setPlaylists(updated);
  };

  // Remove Song from Playlist
  const handleRemoveFromPlaylist = (playlistId: string, songId: string) => {
    const updated = removeSongFromPlaylist(playlistId, songId);
    setPlaylists(updated);
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      setSelectedPlaylist((prev) =>
        prev ? { ...prev, songs: prev.songs.filter((s) => s.id !== songId) } : null
      );
    }
  };

  // Account Changed handler
  const handleUserChanged = (user: UserProfile) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    loadUserData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const likedSet = new Set(likedSongs.map((s) => s.id));
  const downloadedSet = new Set(offlineTracks.map((t) => t.id));

  return (
    <div className="h-screen bg-black text-white flex flex-col font-sans select-none overflow-hidden p-2 pb-24 md:pb-24">
      {/* Network Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 rounded-lg mb-1">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active. Play your downloaded music from the Offline tab!</span>
        </div>
      )}

      {/* Spotify 2-Pane Shell */}
      <div className="flex-1 flex gap-2 min-h-0 overflow-hidden">
        {/* Left Sidebar Pane */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          playlists={playlists}
          likedCount={likedSongs.length}
          offlineCount={offlineTracks.length}
          historyCount={historySongs.length}
          onCreatePlaylist={() => handleCreatePlaylist('My Playlist #' + (playlists.length + 1))}
          onSelectPlaylist={(plId) => {
            const pl = playlists.find((p) => p.id === plId);
            if (pl) setSelectedPlaylist(pl);
          }}
          selectedPlaylistId={selectedPlaylist?.id || null}
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        {/* Right Main Content Pane */}
        <div className="flex-1 bg-[#121212] rounded-xl border border-white/5 flex flex-col min-w-0 overflow-hidden relative">
          <Navbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            likedCount={likedSongs.length}
            offlineCount={offlineTracks.length}
            currentUser={currentUser}
            onOpenAuth={() => setShowAuthModal(true)}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {/* DISCOVER TAB */}
            {activeTab === 'discover' && (
              <div className="space-y-6 animate-fade-in">
                {/* Spotify Greeting & Top 6 Quick Cards */}
                <div className="space-y-4">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {getGreeting()}
                  </h1>

                  {/* 6 Quick Grid Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Tile 1: Liked Songs */}
                    <div
                      onClick={() => setActiveTab('liked')}
                      className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-md overflow-hidden cursor-pointer transition-all duration-200 border border-white/5 shadow-md"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 flex items-center justify-center shrink-0">
                        <Heart className="w-7 h-7 fill-white text-white" />
                      </div>
                      <span className="font-bold text-sm text-white truncate flex-1">Liked Songs</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (likedSongs.length > 0) playSong(likedSongs[0], likedSongs, 0);
                        }}
                        className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl mr-3 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shrink-0"
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    </div>

                    {/* Tile 2: Top Hits */}
                    <div
                      onClick={() => handleGenreSelect('top-hits')}
                      className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-md overflow-hidden cursor-pointer transition-all duration-200 border border-white/5 shadow-md"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                        <Flame className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-sm text-white truncate flex-1">Top Hits 2026</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (trendingSongs.length > 0) playSong(trendingSongs[0], trendingSongs, 0);
                        }}
                        className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl mr-3 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shrink-0"
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    </div>

                    {/* Tile 3: Lo-Fi Chill Beats */}
                    <div
                      onClick={() => handleGenreSelect('lofi')}
                      className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-md overflow-hidden cursor-pointer transition-all duration-200 border border-white/5 shadow-md"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-sm text-white truncate flex-1">Lo-Fi Chill Beats</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenreSelect('lofi');
                        }}
                        className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl mr-3 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shrink-0"
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    </div>

                    {/* Tile 4: Pop Anthems */}
                    <div
                      onClick={() => handleGenreSelect('pop')}
                      className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-md overflow-hidden cursor-pointer transition-all duration-200 border border-white/5 shadow-md"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0">
                        <Music className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-sm text-white truncate flex-1">Pop Anthems</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenreSelect('pop');
                        }}
                        className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl mr-3 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shrink-0"
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    </div>

                    {/* Tile 5: Rock Hits */}
                    <div
                      onClick={() => handleGenreSelect('rock')}
                      className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-md overflow-hidden cursor-pointer transition-all duration-200 border border-white/5 shadow-md"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-stone-800 flex items-center justify-center shrink-0">
                        <Compass className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-sm text-white truncate flex-1">Classic Rock Hits</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenreSelect('rock');
                        }}
                        className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl mr-3 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shrink-0"
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    </div>

                    {/* Tile 6: Workout Energy */}
                    <div
                      onClick={() => handleGenreSelect('workout')}
                      className="group relative flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-md overflow-hidden cursor-pointer transition-all duration-200 border border-white/5 shadow-md"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shrink-0">
                        <Shuffle className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-sm text-white truncate flex-1">Workout Hype</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenreSelect('workout');
                        }}
                        className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl mr-3 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shrink-0"
                      >
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Genre Category Quick Filter Chips */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>Made For You</span>
                    </h2>

                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/10">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-full text-neutral-400 transition ${
                          viewMode === 'grid' ? 'bg-[#282828] text-white font-bold' : ''
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-full text-neutral-400 transition ${
                          viewMode === 'list' ? 'bg-[#282828] text-white font-bold' : ''
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {GENRES.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => handleGenreSelect(genre.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          selectedGenre === genre.id
                            ? 'bg-white text-black font-extrabold shadow'
                            : 'bg-[#282828] text-white hover:bg-[#333333]'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Song Grid or List */}
                {isTrendingLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-64 rounded-xl bg-[#181818] border border-white/5 animate-pulse p-4 flex flex-col justify-between"
                      >
                        <div className="w-full h-36 bg-neutral-800 rounded-md" />
                        <div className="space-y-2 mt-3">
                          <div className="h-4 bg-neutral-800 rounded w-3/4" />
                          <div className="h-3 bg-neutral-800 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {trendingSongs.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        isCurrentSong={currentSong?.id === song.id}
                        isPlaying={isPlaying && currentSong?.id === song.id}
                        isLiked={likedSet.has(song.id)}
                        isDownloaded={downloadedSet.has(song.id)}
                        onPlay={(s) => playSong(s, trendingSongs)}
                        onAddToQueue={addToQueue}
                        onLikeToggle={handleLikeToggle}
                        onAddToPlaylist={setPlaylistModalSong}
                        onDownloadToggle={handleDownloadToggle}
                        onStartRadio={handleStartRadio}
                        onShare={handleShareSong}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#181818] border border-white/5 rounded-xl p-2">
                    <SongList
                      songs={trendingSongs}
                      currentSongId={currentSong?.id}
                      isPlaying={isPlaying}
                      likedSongIds={likedSet}
                      downloadedSongIds={downloadedSet}
                      onPlay={(s) => playSong(s, trendingSongs)}
                      onAddToQueue={addToQueue}
                      onLikeToggle={handleLikeToggle}
                      onAddToPlaylist={setPlaylistModalSong}
                      onDownloadToggle={handleDownloadToggle}
                      onStartRadio={handleStartRadio}
                      onShare={handleShareSong}
                    />
                  </div>
                )}
              </div>
            )}

        {/* SEARCH RESULTS TAB */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-400" />
                  <span>Search Results</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing results for <span className="text-emerald-400 font-medium">"{searchQuery}"</span>
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-slate-400 transition ${
                    viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : ''
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-slate-400 transition ${
                    viewMode === 'list' ? 'bg-slate-800 text-emerald-400' : ''
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Searching music...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-200">No songs found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try searching for another song name, artist, or music track.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    isCurrentSong={currentSong?.id === song.id}
                    isPlaying={isPlaying && currentSong?.id === song.id}
                    isLiked={likedSet.has(song.id)}
                    isDownloaded={downloadedSet.has(song.id)}
                    onPlay={(s) => playSong(s, searchResults)}
                    onAddToQueue={addToQueue}
                    onLikeToggle={handleLikeToggle}
                    onAddToPlaylist={setPlaylistModalSong}
                    onDownloadToggle={handleDownloadToggle}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-2">
                <SongList
                  songs={searchResults}
                  currentSongId={currentSong?.id}
                  isPlaying={isPlaying}
                  likedSongIds={likedSet}
                  downloadedSongIds={downloadedSet}
                  onPlay={(s) => playSong(s, searchResults)}
                  onAddToQueue={addToQueue}
                  onLikeToggle={handleLikeToggle}
                  onAddToPlaylist={setPlaylistModalSong}
                  onDownloadToggle={handleDownloadToggle}
                />
              </div>
            )}
          </div>
        )}

        {/* LIKED SONGS TAB */}
        {activeTab === 'liked' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                  <Heart className="w-8 h-8 fill-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Liked Songs</h1>
                  <p className="text-xs text-slate-400 mt-0.5">{likedSongs.length} saved tracks for {currentUser.username}</p>
                </div>
              </div>

              {likedSongs.length > 0 && (
                <button
                  onClick={() => playSong(likedSongs[0], likedSongs, 0)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play Liked Songs</span>
                </button>
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-2">
              <SongList
                songs={likedSongs}
                currentSongId={currentSong?.id}
                isPlaying={isPlaying}
                likedSongIds={likedSet}
                downloadedSongIds={downloadedSet}
                onPlay={(s) => playSong(s, likedSongs)}
                onAddToQueue={addToQueue}
                onLikeToggle={handleLikeToggle}
                onAddToPlaylist={setPlaylistModalSong}
                onDownloadToggle={handleDownloadToggle}
              />
            </div>
          </div>
        )}

        {/* OFFLINE DOWNLOADS TAB */}
        {activeTab === 'downloads' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
                  <Download className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Offline Library</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {offlineTracks.length} downloaded tracks • Available without internet connection
                  </p>
                </div>
              </div>

              {offlineTracks.length > 0 && (
                <button
                  onClick={() => {
                    const songs = offlineTracks.map((t) => t.song);
                    playSong(songs[0], songs, 0);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Play Offline Songs</span>
                </button>
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-2">
              <SongList
                songs={offlineTracks.map((t) => t.song)}
                currentSongId={currentSong?.id}
                isPlaying={isPlaying}
                likedSongIds={likedSet}
                downloadedSongIds={downloadedSet}
                onPlay={(s) => playSong(s, offlineTracks.map((t) => t.song))}
                onAddToQueue={addToQueue}
                onLikeToggle={handleLikeToggle}
                onAddToPlaylist={setPlaylistModalSong}
                onDownloadToggle={handleDownloadToggle}
              />
            </div>
          </div>
        )}

        {/* LIBRARY & PLAYLISTS TAB */}
        {activeTab === 'playlists' && (
          <div className="space-y-6 animate-fade-in">
            {!selectedPlaylist ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Library className="w-5 h-5 text-indigo-400" />
                      <span>My Playlists</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Personal collections for {currentUser.username}</p>
                  </div>

                  <button
                    onClick={() => {
                      const name = prompt('Enter new playlist name:');
                      if (name) handleCreatePlaylist(name);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold hover:bg-indigo-500/20 transition"
                  >
                    <Plus className="w-4 h-4" /> New Playlist
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      className="group p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-indigo-950/20 flex flex-col justify-between"
                    >
                      <div onClick={() => setSelectedPlaylist(pl)}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                            <Library className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition truncate">
                              {pl.name}
                            </h3>
                            <p className="text-xs text-slate-400">{pl.songs.length} tracks</p>
                          </div>
                        </div>
                        {pl.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{pl.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPlaylist(pl);
                          }}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Reorder & Edit
                        </button>

                        {pl.songs.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playSong(pl.songs[0], pl.songs, 0);
                            }}
                            className="p-1.5 rounded-full bg-indigo-500 text-white hover:scale-105 transition"
                            title="Play Playlist"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedPlaylist(null)}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
                  >
                    ← Back to All Playlists
                  </button>

                  <button
                    onClick={() => setEditingPlaylist(selectedPlaylist)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-indigo-300 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Manage & Reorder
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPlaylist.name}</h2>
                    <p className="text-xs text-slate-400 mt-1">{selectedPlaylist.songs.length} tracks</p>
                  </div>

                  {selectedPlaylist.songs.length > 0 && (
                    <button
                      onClick={() => playSong(selectedPlaylist.songs[0], selectedPlaylist.songs, 0)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition hover:scale-105"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Play Playlist</span>
                    </button>
                  )}
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-2">
                  <SongList
                    songs={selectedPlaylist.songs}
                    currentSongId={currentSong?.id}
                    isPlaying={isPlaying}
                    likedSongIds={likedSet}
                    downloadedSongIds={downloadedSet}
                    onPlay={(s) => playSong(s, selectedPlaylist.songs)}
                    onAddToQueue={addToQueue}
                    onLikeToggle={handleLikeToggle}
                    onAddToPlaylist={setPlaylistModalSong}
                    onDownloadToggle={handleDownloadToggle}
                    showRemoveOption
                    onRemoveFromList={(songId) => handleRemoveFromPlaylist(selectedPlaylist.id, songId)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  <span>Listening History</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Recently played tracks for {currentUser.username}</p>
              </div>

              {historySongs.length > 0 && (
                <button
                  onClick={() => playSong(historySongs[0], historySongs, 0)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold hover:bg-amber-500/20 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-amber-300" /> Replay All
                </button>
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-2">
              <SongList
                songs={historySongs}
                currentSongId={currentSong?.id}
                isPlaying={isPlaying}
                likedSongIds={likedSet}
                downloadedSongIds={downloadedSet}
                onPlay={(s) => playSong(s, historySongs)}
                onAddToQueue={addToQueue}
                onLikeToggle={handleLikeToggle}
                onAddToPlaylist={setPlaylistModalSong}
                onDownloadToggle={handleDownloadToggle}
              />
            </div>
          </div>
        )}
      </main>
        </div>
      </div>

      {/* Audio & MediaSession Player Engine */}
      <YouTubeIframePlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        showVideo={showVideo}
        offlineBlobUrl={currentOfflineBlobUrl}
        onTimeUpdate={(cTime, dur) => {
          setCurrentTime(cTime);
          if (dur > 0) setDuration(dur);
        }}
        onStateChange={(playing) => setIsPlaying(playing)}
        onSongEnd={playNextSong}
        onPrevious={playPreviousSong}
        onNext={playNextSong}
        seekTime={seekTime}
        onSeekHandled={() => setSeekTime(null)}
      />

      {/* Bottom Floating Control Dock */}
      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        isLiked={currentSong ? likedSet.has(currentSong.id) : false}
        isDownloaded={currentSong ? downloadedSet.has(currentSong.id) : false}
        showLyrics={showLyrics}
        showQueue={showQueue}
        showVideo={showVideo}
        queueLength={queue.length}
        sleepTimerMode={sleepTimerMode}
        onPlayPauseToggle={() => setIsPlaying(!isPlaying)}
        onNext={playNextSong}
        onPrevious={playPreviousSong}
        onSeek={(sec) => setSeekTime(sec)}
        onVolumeChange={(v) => {
          setVolume(v);
          if (isMuted && v > 0) setIsMuted(false);
        }}
        onMuteToggle={() => setIsMuted(!isMuted)}
        onRepeatToggle={() => {
          if (repeatMode === 'off') setRepeatMode('all');
          else if (repeatMode === 'all') setRepeatMode('one');
          else setRepeatMode('off');
        }}
        onShuffleToggle={() => setIsShuffle(!isShuffle)}
        onLikeToggle={() => currentSong && handleLikeToggle(currentSong)}
        onLyricsToggle={() => setShowLyrics(!showLyrics)}
        onQueueToggle={() => setShowQueue(!showQueue)}
        onVideoToggle={() => setShowVideo(!showVideo)}
        onAddToPlaylistClick={() => currentSong && setPlaylistModalSong(currentSong)}
        onDownloadToggle={() => currentSong && handleDownloadToggle(currentSong)}
        onOpenSleepTimer={() => setShowSleepTimerModal(true)}
        onOpenAudioSettings={() => setShowAudioSettingsModal(true)}
        onStartRadio={() => currentSong && handleStartRadio(currentSong)}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={showSleepTimerModal}
        onClose={() => setShowSleepTimerModal(false)}
        sleepTimerMode={sleepTimerMode}
        initialDurationMinutes={initialTimerMinutes}
        onSetTimer={handleSetSleepTimer}
      />

      {/* Audio Settings & Equalizer Modal */}
      <AudioSettingsModal
        isOpen={showAudioSettingsModal}
        onClose={() => setShowAudioSettingsModal(false)}
        crossfadeSeconds={crossfadeSeconds}
        onCrossfadeChange={setCrossfadeSeconds}
        equalizerPreset={equalizerPreset}
        onEqualizerChange={setEqualizerPreset}
        audioQuality={audioQuality}
        onAudioQualityChange={setAudioQuality}
        volumeNormalization={volumeNormalization}
        onVolumeNormalizationToggle={() => setVolumeNormalization(!volumeNormalization)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce-in">
          <div className="bg-slate-900 border border-emerald-500/40 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl">
            <span className="text-sm font-semibold">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Queue Drawer */}
      <QueueDrawer
        queue={queue}
        queueIndex={queueIndex}
        currentSong={currentSong}
        isOpen={showQueue}
        autoPlayRelated={autoPlayRelated}
        onClose={() => setShowQueue(false)}
        onSelectSong={(idx) => {
          setQueueIndex(idx);
          setCurrentSong(queue[idx]);
          setIsPlaying(true);
        }}
        onRemoveFromQueue={(idx) => {
          setQueue((prev) => prev.filter((_, i) => i !== idx));
          if (idx < queueIndex) setQueueIndex((prev) => prev - 1);
        }}
        onClearQueue={() => {
          setQueue([]);
          setQueueIndex(-1);
        }}
        onToggleAutoPlay={() => setAutoPlayRelated(!autoPlayRelated)}
      />

      {/* Lyrics Modal */}
      <LyricsModal
        song={currentSong}
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
      />

      {/* Add to Playlist Modal */}
      <PlaylistModal
        song={playlistModalSong}
        isOpen={!!playlistModalSong}
        playlists={playlists}
        onClose={() => setPlaylistModalSong(null)}
        onCreatePlaylist={handleCreatePlaylist}
        onAddSongToPlaylist={handleAddSongToPlaylist}
      />

      {/* Playlist Reorder / Edit Modal */}
      <PlaylistEditModal
        playlist={editingPlaylist}
        isOpen={!!editingPlaylist}
        onClose={() => setEditingPlaylist(null)}
        onUpdateInfo={handleUpdatePlaylistInfo}
        onReorderSongs={handleReorderPlaylistSongs}
        onDeletePlaylist={handleDeletePlaylist}
        onRemoveSong={handleRemoveFromPlaylist}
      />

      {/* User Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        currentUser={currentUser}
        onClose={() => setShowAuthModal(false)}
        onUserChanged={handleUserChanged}
      />
    </div>
  );
}
