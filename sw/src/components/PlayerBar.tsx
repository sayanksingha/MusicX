import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ListMusic,
  AlignLeft,
  Plus,
  Download,
  CheckCircle2,
  Moon,
  Sliders,
  Radio,
  Maximize2,
} from 'lucide-react';
import { Song, RepeatMode } from '../types';
import { formatTime } from '../lib/storage';

interface PlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isLiked: boolean;
  isDownloaded?: boolean;
  showLyrics: boolean;
  showQueue: boolean;
  showVideo: boolean;
  queueLength: number;
  sleepTimerMode: 'off' | 'end_of_track' | number;
  onPlayPauseToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onRepeatToggle: () => void;
  onShuffleToggle: () => void;
  onLikeToggle: () => void;
  onLyricsToggle: () => void;
  onQueueToggle: () => void;
  onVideoToggle: () => void;
  onAddToPlaylistClick: () => void;
  onDownloadToggle?: () => void;
  onOpenSleepTimer: () => void;
  onOpenAudioSettings: () => void;
  onStartRadio?: () => void;
  onOpenNowPlaying?: () => void;
}

const PlayerBarComponent: React.FC<PlayerBarProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffle,
  isLiked,
  isDownloaded,
  showLyrics,
  showQueue,
  showVideo,
  queueLength,
  sleepTimerMode,
  onPlayPauseToggle,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onRepeatToggle,
  onShuffleToggle,
  onLikeToggle,
  onLyricsToggle,
  onQueueToggle,
  onVideoToggle,
  onAddToPlaylistClick,
  onDownloadToggle,
  onOpenSleepTimer,
  onOpenAudioSettings,
  onStartRadio,
  onOpenNowPlaying,
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [tempSeek, setTempSeek] = useState(0);

  if (!currentSong) return null;

  const displayTime = isSeeking ? tempSeek : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempSeek(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
    setTempSeek(currentTime);
  };

  const handleSeekMouseUp = () => {
    setIsSeeking(false);
    onSeek(tempSeek);
  };

  const isTimerActive = sleepTimerMode !== 'off';

  const formatTimerBadge = () => {
    if (sleepTimerMode === 'end_of_track') return 'End';
    if (typeof sleepTimerMode === 'number') {
      const mins = Math.ceil(sleepTimerMode / 60);
      return `${mins}m`;
    }
    return '';
  };

  return (
    <div className="mx-playerbar fixed bottom-0 left-0 right-0 z-40 bg-[#000000] border-t border-white/10 px-4 py-2.5 transition-all shadow-2xl text-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
        {/* Top Scrubber Line */}
        <div className="flex items-center gap-3 w-full text-xs font-mono text-neutral-400">
          <span>{formatTime(displayTime)}</span>
          <div className="relative flex-1 group flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={displayTime}
              onChange={handleSeekChange}
              onMouseDown={handleSeekMouseDown}
              onMouseUp={handleSeekMouseUp}
              onTouchStart={handleSeekMouseDown}
              onTouchEnd={handleSeekMouseUp}
              className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#1DB954] focus:outline-none group-hover:h-1.5 transition-all"
            />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#1DB954] rounded-lg pointer-events-none group-hover:h-1.5 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Main Controls & Info Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Song Metadata */}
          <div className="flex items-center gap-3 min-w-0 max-w-[240px] sm:max-w-xs md:max-w-sm">
            <div className="relative group shrink-0">
              <button
                onClick={onOpenNowPlaying}
                className="relative rounded overflow-hidden group"
                title="Open Now Playing"
              >
                <img
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  className={`w-12 h-12 rounded object-cover shadow-md border border-white/10 transition-transform ${
                    isPlaying ? 'scale-100' : 'opacity-80'
                  }`}
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition flex items-center justify-center">
                  <Maximize2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                </span>
              </button>
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-3.5">
                    <span className="w-1 bg-[#1DB954] rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                    <span className="w-1 bg-[#1DB954] rounded-full animate-[bounce_1s_infinite_300ms] h-2/3" />
                    <span className="w-1 bg-[#1DB954] rounded-full animate-[bounce_1s_infinite_200ms] h-4/5" />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer flex items-center gap-1">
                <span>{currentSong.title}</span>
                {isDownloaded && <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />}
              </h4>
              <p className="text-xs text-neutral-400 truncate mt-0.5">{currentSong.artist}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button
                onClick={onLikeToggle}
                className={`p-1.5 rounded-full hover:bg-neutral-800 transition ${
                  isLiked ? 'text-[#1DB954]' : 'text-neutral-400 hover:text-white'
                }`}
                title={isLiked ? 'Remove from Liked' : 'Like Song'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1DB954] text-[#1DB954]' : ''}`} />
              </button>

              {onDownloadToggle && (
                <button
                  onClick={onDownloadToggle}
                  className={`p-1.5 rounded-full transition ${
                    isDownloaded ? 'text-[#1DB954]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title={isDownloaded ? 'Downloaded' : 'Download for Offline Listening'}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onAddToPlaylistClick}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                title="Add to Playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={onShuffleToggle}
              className={`p-2 rounded-full transition ${
                isShuffle
                  ? 'text-[#1DB954]'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onPrevious}
              className="p-2 text-neutral-300 hover:text-white transition"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5 fill-neutral-300 hover:fill-white" />
            </button>

            <button
              onClick={onPlayPauseToggle}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-2 text-neutral-300 hover:text-white transition"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5 fill-neutral-300 hover:fill-white" />
            </button>

            <button
              onClick={onRepeatToggle}
              className={`p-2 rounded-full transition ${
                repeatMode !== 'off'
                  ? 'text-[#1DB954]'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4 text-[#1DB954]" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Right: Actions & Volume */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Action Toggles */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
              {/* Sleep Timer Button */}
              <button
                onClick={onOpenSleepTimer}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 relative transition ${
                  isTimerActive
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={isTimerActive ? `Sleep Timer: ${formatTimerBadge()}` : 'Set Sleep Timer'}
              >
                <Moon className={`w-4 h-4 ${isTimerActive ? 'text-indigo-400 fill-indigo-400/20' : ''}`} />
                {isTimerActive && (
                  <span className="text-[10px] font-mono font-bold bg-indigo-500 text-white px-1 rounded-md">
                    {formatTimerBadge()}
                  </span>
                )}
              </button>

              {/* Audio Settings / Equalizer Button */}
              <button
                onClick={onOpenAudioSettings}
                className="p-2 rounded-lg text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition"
                title="Audio Settings & Equalizer"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Start Radio Mix Button */}
              {onStartRadio && (
                <button
                  onClick={onStartRadio}
                  className="p-2 rounded-lg text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition hidden lg:block"
                  title="Start Song Radio Mix"
                >
                  <Radio className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onLyricsToggle}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 transition ${
                  showLyrics
                    ? 'bg-slate-800 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Lyrics"
              >
                <AlignLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onQueueToggle}
                className={`p-2 rounded-lg text-xs flex items-center gap-1 relative transition ${
                  showQueue
                    ? 'bg-slate-800 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Queue"
              >
                <ListMusic className="w-4 h-4" />
                {queueLength > 0 && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-semibold">
                    {queueLength}
                  </span>
                )}
              </button>

            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 w-28 group">
              <button
                onClick={onMuteToggle}
                className="text-slate-400 hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none group-hover:h-1.5 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlayerBar = React.memo(PlayerBarComponent);
