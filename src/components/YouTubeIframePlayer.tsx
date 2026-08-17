import React, { useEffect, useRef } from 'react';
import { Song } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeIframePlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  showVideo: boolean;
  offlineBlobUrl?: string;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onStateChange: (isPlaying: boolean) => void;
  onSongEnd: () => void;
  onPrevious: () => void;
  onNext: () => void;
  seekTime: number | null;
  onSeekHandled: () => void;
}

export const YouTubeIframePlayer: React.FC<YouTubeIframePlayerProps> = ({
  currentSong,
  isPlaying,
  volume,
  isMuted,
  showVideo,
  offlineBlobUrl,
  onTimeUpdate,
  onStateChange,
  onSongEnd,
  onPrevious,
  onNext,
  seekTime,
  onSeekHandled,
}) => {
  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<any>(null);
  const isApiReadyRef = useRef<boolean>(false);
  const loadedVideoIdRef = useRef<string | null>(null);

  // Initialize MediaSession API for OS Notification / Lock Screen Controls
  useEffect(() => {
    if (!currentSong) return;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: 'Swargam',
        artwork: [
          { src: currentSong.thumbnail, sizes: '96x96', type: 'image/jpeg' },
          { src: currentSong.thumbnail, sizes: '128x128', type: 'image/jpeg' },
          { src: currentSong.thumbnail, sizes: '192x192', type: 'image/jpeg' },
          { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        onStateChange(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        onStateChange(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        onPrevious();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        onNext();
      });
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            if (audioRef.current && offlineBlobUrl) {
              audioRef.current.currentTime = details.seekTime;
            } else if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
              playerRef.current.seekTo(details.seekTime, true);
            }
          }
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const offset = details.seekOffset || 10;
          if (audioRef.current && offlineBlobUrl) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - offset);
          else if (playerRef.current) playerRef.current.seekTo(Math.max(0, playerRef.current.getCurrentTime() - offset), true);
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const offset = details.seekOffset || 10;
          if (audioRef.current && offlineBlobUrl) audioRef.current.currentTime += offset;
          else if (playerRef.current) playerRef.current.seekTo(playerRef.current.getCurrentTime() + offset, true);
        });
        navigator.mediaSession.setActionHandler('stop', () => onStateChange(false));
      } catch {}

    }
  }, [currentSong?.id, offlineBlobUrl]);

  // Sync MediaSession playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Load YT API Script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isApiReadyRef.current = true;
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      isApiReadyRef.current = true;
      if (currentSong && !offlineBlobUrl) {
        initPlayer(currentSong.id);
      }
    };
  }, []);

  // Handle Offline Audio Tag vs YouTube Player logic
  useEffect(() => {
    if (!currentSong) return;

    if (offlineBlobUrl) {
      // Pause YouTube if playing
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try { playerRef.current.pauseVideo(); } catch (e) {}
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = offlineBlobUrl;
      audioRef.current.volume = isMuted ? 0 : volume;

      audioRef.current.onended = () => {
        onStateChange(false);
        onSongEnd();
      };

      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      // Online mode: YouTube Iframe
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          // Do not call loadVideoById again for the same track. On touch devices
          // repeated taps can otherwise restart the YouTube player from 0:00.
          if (loadedVideoIdRef.current !== currentSong.id) {
            loadedVideoIdRef.current = currentSong.id;
            playerRef.current.loadVideoById(currentSong.id);
          }
          if (isPlaying) playerRef.current.playVideo();
        } catch (err) {
          console.error('Error loading video by ID:', err);
        }
      } else if (isApiReadyRef.current || (window.YT && window.YT.Player)) {
        initPlayer(currentSong.id);
      }
    }
  }, [currentSong?.id, offlineBlobUrl]);

  // Handle Play / Pause state
  useEffect(() => {
    if (offlineBlobUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
      return;
    }

    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;

    try {
      const state = playerRef.current.getPlayerState();
      if (isPlaying && state !== window.YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      } else if (!isPlaying && state === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying, offlineBlobUrl]);

  // Handle Volume & Mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }

    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;
    try {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume * 100);
      }
    } catch (e) {}
  }, [volume, isMuted]);

  // Handle Seek Request
  useEffect(() => {
    if (seekTime !== null) {
      if (offlineBlobUrl && audioRef.current) {
        audioRef.current.currentTime = seekTime;
        onSeekHandled();
      } else if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(seekTime, true);
          onSeekHandled();
        } catch (e) {}
      }
    }
  }, [seekTime, offlineBlobUrl]);

  // Timer interval for position update
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (offlineBlobUrl && audioRef.current) {
        const currentTime = audioRef.current.currentTime || 0;
        const duration = audioRef.current.duration || currentSong?.duration || 0;
        onTimeUpdate(currentTime, duration);
        if ('mediaSession' in navigator && duration > 0 && Number.isFinite(duration)) {
          try { navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: Math.min(currentTime, duration) }); } catch {}
        }
      } else if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || currentSong?.duration || 0;
          onTimeUpdate(currentTime, duration);
          if ('mediaSession' in navigator && duration > 0 && Number.isFinite(duration)) {
            try { navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: Math.min(currentTime, duration) }); } catch {}
          }
        } catch (e) {}
      }
    }, 750);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentSong, offlineBlobUrl]);

  const initPlayer = (videoId: string) => {
    if (!window.YT || !window.YT.Player) return;
    loadedVideoIdRef.current = videoId;

    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try {
        playerRef.current.destroy();
      } catch (e) {}
    }

    playerRef.current = new window.YT.Player('yt-music-iframe', {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: showVideo ? 1 : 0,
        disablekb: 1,
        fs: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          if (isMuted) event.target.mute();
          else event.target.setVolume(volume * 100);

          if (isPlaying) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            onStateChange(true);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            onStateChange(false);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            onStateChange(false);
            onSongEnd();
          }
        },
        onError: () => {
          onSongEnd();
        },
      },
    });
  };

  return (
    <div
      className={`transition-all duration-300 ${
        showVideo && !offlineBlobUrl
          ? 'fixed top-20 right-6 z-40 w-80 md:w-96 aspect-video bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden group'
          : 'fixed -bottom-96 right-0 opacity-0 pointer-events-none w-1 h-1 overflow-hidden'
      }`}
    >
      <div id="yt-music-iframe" className="w-full h-full" />
    </div>
  );
};
