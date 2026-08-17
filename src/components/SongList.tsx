import React from 'react';
import { Play, Heart, ListPlus, Plus, Clock, Music, Download, CheckCircle2, Radio, Share2 } from 'lucide-react';
import { Song } from '../types';

interface SongListProps {
  songs: Song[];
  currentSongId?: string;
  isPlaying?: boolean;
  likedSongIds: Set<string>;
  downloadedSongIds?: Set<string>;
  onPlay: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onLikeToggle: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onDownloadToggle?: (song: Song) => void;
  onStartRadio?: (song: Song) => void;
  onShare?: (song: Song) => void;
  onRemoveFromList?: (songId: string) => void;
  showRemoveOption?: boolean;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  currentSongId,
  isPlaying,
  likedSongIds,
  downloadedSongIds = new Set(),
  onPlay,
  onAddToQueue,
  onLikeToggle,
  onAddToPlaylist,
  onDownloadToggle,
  onStartRadio,
  onShare,
  onRemoveFromList,
  showRemoveOption,
}) => {
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-900/40">
        <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
          <Music className="w-6 h-6" />
        </div>
        <p className="text-white font-medium">No songs available</p>
        <p className="text-xs text-neutral-400 mt-1">Search or discover new music to add to your library.</p>
      </div>
    );
  }

  return (
    <div className="mx-song-list w-full overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-white/10 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
            <th className="py-3 px-3 w-12 text-center">#</th>
            <th className="py-3 px-4">Title</th>
            <th className="py-3 px-4 hidden md:table-cell">Artist / Channel</th>
            <th className="py-3 px-4 text-center w-24">
              <Clock className="w-3.5 h-3.5 mx-auto" />
            </th>
            <th className="py-3 px-4 text-right w-44">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm">
          {songs.map((song, index) => {
            const isCurrent = currentSongId === song.id;
            const isLiked = likedSongIds.has(song.id);
            const isDownloaded = downloadedSongIds.has(song.id);

            return (
              <tr
                key={`${song.id}_${index}`}
                className={`group transition-colors duration-150 rounded-md ${
                  isCurrent
                    ? 'bg-white/10 text-[#1DB954] font-medium'
                    : 'hover:bg-white/5 text-neutral-200'
                }`}
              >
                {/* Index / Play Button */}
                <td className="py-3 px-3 text-center text-xs text-neutral-400 relative">
                  <span className="group-hover:hidden">{isCurrent && isPlaying ? '▶' : index + 1}</span>
                  <button
                    onClick={() => onPlay(song)}
                    className="hidden group-hover:flex items-center justify-center mx-auto w-7 h-7 rounded-full bg-[#1DB954] text-black hover:scale-105 transition shadow-lg"
                    title="Play"
                  >
                    <Play className="w-3.5 h-3.5 fill-black ml-0.5 text-black" />
                  </button>
                </td>

                {/* Song Info */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover shadow-md"
                      />
                      {isDownloaded && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954] bg-black rounded-full absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div className="min-w-0 max-w-xs sm:max-w-md">
                      <p
                        onClick={() => onPlay(song)}
                        className={`font-medium truncate cursor-pointer hover:underline ${
                          isCurrent ? 'text-[#1DB954]' : 'text-white'
                        }`}
                      >
                        {song.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate md:hidden">{song.artist}</p>
                    </div>
                  </div>
                </td>

                {/* Artist / Channel */}
                <td className="py-3 px-4 hidden md:table-cell text-xs text-neutral-400 truncate max-w-xs">
                  {song.artist}
                </td>

                {/* Duration */}
                <td className="py-3 px-4 text-center text-xs font-mono text-neutral-400">
                  {song.durationFormatted}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {onStartRadio && (
                      <button
                        onClick={() => onStartRadio(song)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-[#1DB954] hover:bg-neutral-800 transition hidden sm:inline-flex"
                        title="Start Song Radio"
                      >
                        <Radio className="w-4 h-4" />
                      </button>
                    )}

                    {onDownloadToggle && (
                      <button
                        onClick={() => onDownloadToggle(song)}
                        className={`p-1.5 rounded-lg transition ${
                          isDownloaded
                            ? 'text-[#1DB954] hover:text-rose-400'
                            : 'text-neutral-400 hover:text-[#1DB954] hover:bg-neutral-800'
                        }`}
                        title={isDownloaded ? 'Remove Download' : 'Download Offline'}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onLikeToggle(song)}
                      className={`p-1.5 rounded-lg hover:bg-neutral-800 transition ${
                        isLiked ? 'text-[#1DB954]' : 'text-neutral-400 hover:text-white'
                      }`}
                      title={isLiked ? 'Remove from Liked' : 'Like Song'}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1DB954] text-[#1DB954]' : ''}`} />
                    </button>

                    <button
                      onClick={() => onAddToQueue(song)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-[#1DB954] hover:bg-neutral-800 transition"
                      title="Add to Queue"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onAddToPlaylist(song)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-400 hover:bg-neutral-800 transition"
                      title="Add to Playlist"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {onShare && (
                      <button
                        onClick={() => onShare(song)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition hidden md:inline-flex"
                        title="Share Track"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}

                    {showRemoveOption && onRemoveFromList && (
                      <button
                        onClick={() => onRemoveFromList(song.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
