import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Song } from '../types';

interface SoundCloudAudioPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  showVideo?: boolean;
  offlineBlobUrl?: string;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onStateChange: (isPlaying: boolean) => void;
  onSongEnd: () => void;
  onPrevious: () => void;
  onNext: () => void;
  seekTime: number | null;
  onSeekHandled: () => void;
}

export const SoundCloudAudioPlayer: React.FC<SoundCloudAudioPlayerProps> = ({
  currentSong,
  isPlaying,
  volume,
  isMuted,
  offlineBlobUrl,
  onTimeUpdate,
  onStateChange,
  onSongEnd,
  onPrevious,
  onNext,
  seekTime,
  onSeekHandled,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const loadedSongIdRef = useRef<string | null>(null);
  const streamUrlRef = useRef<string | null>(null);
  const streamRequestRef = useRef<AbortController | null>(null);
  const playIntentRef = useRef(false);
  const [streamReady, setStreamReady] = useState(false);
  const [streamError, setStreamError] = useState(false);

  const destroyHls = () => {
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
  };

  const updateMediaSession = (song: Song) => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'Swargam',
      artwork: [
        { src: song.thumbnail, sizes: '96x96', type: 'image/jpeg' },
        { src: song.thumbnail, sizes: '192x192', type: 'image/jpeg' },
        { src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ],
    });
  };

  // Resolve the SoundCloud stream as soon as a song is selected. This makes
  // the first user tap much more responsive because the stream URL is ready.
  useEffect(() => {
    if (!currentSong || offlineBlobUrl) return;

    const controller = new AbortController();
    streamRequestRef.current?.abort();
    streamRequestRef.current = controller;
    setStreamReady(false);
    setStreamError(false);
    streamUrlRef.current = null;

    fetch(`/api/stream-info?id=${encodeURIComponent(currentSong.id)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`stream ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        streamUrlRef.current = data.url || null;
        setStreamReady(!!data.url);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setStreamError(true);
      });

    return () => controller.abort();
  }, [currentSong?.id, offlineBlobUrl]);

  // Configure the native audio element only when the actual track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    destroyHls();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    loadedSongIdRef.current = null;
    playIntentRef.current = isPlaying;

    updateMediaSession(currentSong);

    const source = offlineBlobUrl || streamUrlRef.current;
    if (source) {
      attachSource(source, !!offlineBlobUrl);
    }

    return () => {
      destroyHls();
    };
  }, [currentSong?.id, offlineBlobUrl]);

  const attachSource = (source: string, offline = false) => {
    const audio = audioRef.current;
    if (!audio) return;

    destroyHls();
    audio.pause();
    audio.removeAttribute('src');
    audio.load();

    if (!offline && source.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(source);
        hls.attachMedia(audio);
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = source;
      } else {
        setStreamError(true);
        return;
      }
    } else {
      audio.src = source;
    }

    loadedSongIdRef.current = currentSong?.id || null;
    audio.load();
  };

  // If stream-info finished after the track changed, attach it now.
  useEffect(() => {
    if (!currentSong || offlineBlobUrl || !streamUrlRef.current) return;
    if (loadedSongIdRef.current === currentSong.id) return;
    attachSource(streamUrlRef.current);
    if (playIntentRef.current) {
      void audioRef.current?.play().catch(() => onStateChange(false));
    }
  }, [streamReady, currentSong?.id, offlineBlobUrl]);

  // Audio events are more efficient and accurate than polling the player.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTime = () => {
      const d = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : currentSong?.duration || 0;
      onTimeUpdate(audio.currentTime || 0, d);
      if ('mediaSession' in navigator && d > 0 && Number.isFinite(d)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: d,
            playbackRate: audio.playbackRate || 1,
            position: Math.min(Math.max(audio.currentTime || 0, 0), d),
          });
        } catch {}
      }
    };
    const handlePlay = () => onStateChange(true);
    const handlePause = () => onStateChange(false);
    const handleEnded = () => {
      onStateChange(false);
      onSongEnd();
    };
    const handleLoaded = () => {
      const d = Number.isFinite(audio.duration) ? audio.duration : currentSong?.duration || 0;
      onTimeUpdate(audio.currentTime || 0, d);
      if (playIntentRef.current) void audio.play().catch(() => onStateChange(false));
    };
    const handleError = () => {
      if (currentSong && !offlineBlobUrl) setStreamError(true);
      onStateChange(false);
    };

    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentSong?.id, offlineBlobUrl, onSongEnd, onStateChange, onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    playIntentRef.current = isPlaying;

    if (isPlaying) {
      // If the stream has already been resolved, play immediately from the
      // current user action. Otherwise the loadedmetadata handler starts it
      // as soon as the source becomes available.
      if (loadedSongIdRef.current === currentSong.id && audio.readyState >= 2) {
        void audio.play().catch(() => onStateChange(false));
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong?.id, onStateChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTime === null) return;
    if (Number.isFinite(seekTime)) audio.currentTime = Math.max(0, seekTime);
    onSeekHandled();
  }, [seekTime, onSeekHandled]);

  // Native Media Session / lock-screen controls.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    const audio = audioRef.current;
    const set = (action: MediaSessionAction, handler: () => void) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    };
    set('play', () => { playIntentRef.current = true; void audio?.play(); });
    set('pause', () => { playIntentRef.current = false; audio?.pause(); });
    set('previoustrack', onPrevious);
    set('nexttrack', onNext);
    set('stop', () => { playIntentRef.current = false; audio?.pause(); });
    set('seekbackward', () => { if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10); });
    set('seekforward', () => { if (audio) audio.currentTime += 10; });
    set('seekto', () => {});
  }, [currentSong?.id, onPrevious, onNext]);

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  return (
    <>
      <audio ref={audioRef} preload="auto" playsInline className="hidden" />
      {currentSong && (
        <a
          href={currentSong.url}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-24 right-3 z-30 text-[10px] text-white/35 hover:text-white/70 transition-colors"
          aria-label="Open this track on SoundCloud"
        >
          Source: SoundCloud
        </a>
      )}
      {streamError && currentSong && (
        <button
          onClick={() => {
            setStreamError(false);
            setStreamReady(false);
            streamUrlRef.current = null;
            const id = currentSong.id;
            fetch(`/api/stream-info?id=${encodeURIComponent(id)}`)
              .then((r) => r.json())
              .then((data) => {
                if (data.url) {
                  streamUrlRef.current = data.url;
                  setStreamReady(true);
                  playIntentRef.current = true;
                }
              })
              .catch(() => setStreamError(true));
          }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 rounded-full bg-red-500/90 px-4 py-2 text-xs font-bold text-white shadow-lg"
        >
          Stream unavailable — tap to retry
        </button>
      )}
    </>
  );
};
