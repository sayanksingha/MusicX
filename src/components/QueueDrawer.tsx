import React from 'react';
import { X, Trash2, Play, Music, Radio } from 'lucide-react';
import { Song } from '../types';

interface QueueDrawerProps {
  queue: Song[];
  queueIndex: number;
  currentSong: Song | null;
  isOpen: boolean;
  autoPlayRelated: boolean;
  onClose: () => void;
  onSelectSong: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onToggleAutoPlay: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  queue,
  queueIndex,
  currentSong,
  isOpen,
  autoPlayRelated,
  onClose,
  onSelectSong,
  onRemoveFromQueue,
  onClearQueue,
  onToggleAutoPlay,
}) => {
  if (!isOpen) return null;

  const upcomingSongs = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800/80 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Play Queue</h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {queue.length} songs
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-slate-800/60 text-xs">
          <button
            onClick={onToggleAutoPlay}
            className={`flex items-center gap-2 font-medium transition ${
              autoPlayRelated ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Autoplay Similar Tracks</span>
          </button>

          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Scrollable Song List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Now Playing */}
          {currentSong && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                Now Playing
              </p>
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <img
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{currentSong.title}</p>
                  <p className="text-xs text-slate-400 truncate">{currentSong.artist}</p>
                </div>
                <div className="flex items-end gap-0.5 h-4 pr-2">
                  <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-full" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-2/3" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-4/5" />
                </div>
              </div>
            </div>
          )}

          {/* Up Next List */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Up Next ({upcomingSongs.length})
            </p>

            {upcomingSongs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded-2xl">
                Queue is empty. Search songs or turn on Autoplay!
              </p>
            ) : (
              <div className="space-y-1">
                {upcomingSongs.map((song, idx) => {
                  const actualQueueIndex = queueIndex + 1 + idx;
                  return (
                    <div
                      key={`${song.id}_${actualQueueIndex}`}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-900 transition text-sm"
                    >
                      <div
                        onClick={() => onSelectSong(actualQueueIndex)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="text-xs text-slate-500 w-4 text-center">{idx + 1}</span>
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-200 truncate group-hover:text-emerald-400 transition">
                            {song.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveFromQueue(actualQueueIndex)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
