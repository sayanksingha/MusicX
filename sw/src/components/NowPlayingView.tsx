import React from 'react';
import {
  ArrowDown,
  ChevronDown,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Song, RepeatMode } from '../types';
import { formatTime } from '../lib/storage';

interface NowPlayingViewProps {
  song: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLiked: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queueLength: number;
  onClose: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onLike: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onQueue: () => void;
  onLyrics: () => void;
  onShare: () => void;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  song,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLiked,
  isShuffle,
  repeatMode,
  queueLength,
  onClose,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onLike,
  onShuffle,
  onRepeat,
  onQueue,
  onLyrics,
  onShare,
}) => {
  const progress = duration ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-[80] bg-[#060606] text-white overflow-hidden animate-fade-in">
      <div className="absolute inset-0 opacity-40">
        <img src={song.thumbnail} alt="" className="w-full h-full object-cover scale-110 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#070707]/85 to-[#070707]" />
      </div>

      <div className="relative h-full flex flex-col">
        <header className="h-16 px-5 md:px-8 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition" title="Close player">
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[.25em] text-emerald-300 font-bold">Now Playing</p>
            <p className="text-xs text-white/60 mt-1">Swargam • ad-free listening</p>
          </div>
          <button onClick={onQueue} className="p-2 rounded-full hover:bg-white/10 transition" title="Queue">
            <ListMusic className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto px-5 md:px-10 py-4 md:py-8">
          <div className="max-w-6xl mx-auto h-full grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-center">
            <section className="flex flex-col items-center justify-center">
              <div className={`relative w-[min(72vw,520px)] aspect-square rounded-[28px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,.55)] ${isPlaying ? 'np-art-playing' : ''}`}>
                <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10 pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                  <span className="px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-xl border border-white/10 text-xs font-semibold">
                    {song.channelName || song.artist}
                  </span>
                  <button onClick={onLike} className={`w-11 h-11 rounded-full backdrop-blur-xl border border-white/10 flex items-center justify-center ${isLiked ? 'bg-emerald-400 text-black' : 'bg-black/45 hover:bg-white/15'}`}>
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-black' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="w-full max-w-[520px] mt-7">
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight truncate">{song.title}</h1>
                    <p className="text-sm md:text-base text-white/60 mt-1 truncate">{song.artist}</p>
                  </div>
                  <button onClick={onShare} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 shrink-0" title="Share">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-6">
                  <input
                    aria-label="Seek"
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[11px] text-white/45 font-mono mt-1">
                    <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-5 md:gap-8 mt-5">
                  <button onClick={onShuffle} className={`p-2 ${isShuffle ? 'text-emerald-400' : 'text-white/55 hover:text-white'}`} title="Shuffle">
                    <Shuffle className="w-5 h-5" />
                  </button>
                  <button onClick={onPrevious} className="p-2 text-white/80 hover:text-white" title="Previous">
                    <SkipBack className="w-6 h-6 fill-current" />
                  </button>
                  <button onClick={onPlayPause} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-2xl" title={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-1" />}
                  </button>
                  <button onClick={onNext} className="p-2 text-white/80 hover:text-white" title="Next">
                    <SkipForward className="w-6 h-6 fill-current" />
                  </button>
                  <button onClick={onRepeat} className={`p-2 ${repeatMode !== 'off' ? 'text-emerald-400' : 'text-white/55 hover:text-white'}`} title="Repeat">
                    {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 mt-6">
                  <Volume2 className="w-4 h-4 text-white/45" />
                  <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="w-40" aria-label="Volume" />
                </div>
              </div>
            </section>

            <aside className="hidden lg:flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/25 backdrop-blur-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-white/45 font-bold">Your listening</p>
                  <h2 className="text-lg font-black mt-1">Keep the flow going</h2>
                </div>
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <button onClick={onQueue} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-left transition">
                <div><p className="font-bold">Queue</p><p className="text-xs text-white/45 mt-1">{queueLength} tracks ready</p></div>
                <ArrowDown className="w-5 h-5 -rotate-90 text-white/45" />
              </button>
              <button onClick={onLyrics} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-left transition">
                <p className="font-bold">Lyrics</p><p className="text-xs text-white/45 mt-1">Follow along with the current track</p>
              </button>
              <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500/15 to-cyan-500/5 border border-emerald-400/10">
                <p className="text-xs uppercase tracking-[.18em] text-emerald-300 font-bold">Swargam promise</p>
                <p className="text-sm font-semibold mt-2 text-white/80">A clean, distraction-free listening experience with no ads.</p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};
