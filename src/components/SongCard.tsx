import React from 'react';
import { Play, Plus, Heart, ListPlus, Download, CheckCircle2, Radio, Share2 } from 'lucide-react';
import { Song } from '../types';

interface SongCardProps {
  song: Song;
  isCurrentSong: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  isDownloaded?: boolean;
  onPlay: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onLikeToggle: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onDownloadToggle?: (song: Song) => void;
  onStartRadio?: (song: Song) => void;
  onShare?: (song: Song) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isCurrentSong,
  isPlaying,
  isLiked,
  isDownloaded,
  onPlay,
  onAddToQueue,
  onLikeToggle,
  onAddToPlaylist,
  onDownloadToggle,
  onStartRadio,
  onShare,
}) => {
  return (
    <div className="mx-song-card group relative bg-[#181818] hover:bg-[#282828] border border-white/5 rounded-lg p-3.5 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl">
      {/* Cover Image Container */}
      <div className="mx-cover relative aspect-square w-full rounded-md overflow-hidden bg-neutral-900 mb-3 shadow-md">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Duration Pill */}
        <span className="absolute bottom-2 left-2 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/80 text-neutral-300 border border-white/10">
          {song.durationFormatted}
        </span>

        {/* Downloaded Badge */}
        {isDownloaded && (
          <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1DB954]/90 text-black font-bold backdrop-blur-sm shadow">
            <CheckCircle2 className="w-3 h-3 text-black" /> Offline
          </span>
        )}

        {/* Spotify Green Floating Play Overlay Button */}
        <button
          onClick={() => onPlay(song)}
          className={`absolute bottom-2 right-2 w-11 h-11 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 ${
            isCurrentSong
              ? 'opacity-100 translate-y-0 shadow-lg shadow-[#1DB954]/30'
              : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
          }`}
          title="Play Song"
        >
          <Play className="w-5 h-5 fill-black ml-0.5 text-black" />
        </button>

        {/* Like Button Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLikeToggle(song);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-neutral-300 backdrop-blur-sm hover:text-[#1DB954] transition"
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#1DB954] text-[#1DB954]' : ''}`} />
        </button>
      </div>

      {/* Info Block */}
      <div className="min-w-0 flex-1">
        <h3
          onClick={() => onPlay(song)}
          className={`text-sm font-bold truncate cursor-pointer hover:underline ${
            isCurrentSong ? 'text-[#1DB954]' : 'text-white'
          }`}
          title={song.title}
        >
          {song.title}
        </h3>
        <p className="text-xs text-neutral-400 truncate mt-1">{song.artist}</p>
      </div>

      {/* Bottom Quick Action Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-xs text-neutral-400">
        <span className="text-[11px] text-neutral-500 truncate max-w-[85px]">
          {song.views ? `${(song.views / 1000000).toFixed(1)}M plays` : song.channelName}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {onStartRadio && (
            <button
              onClick={() => onStartRadio(song)}
              className="p-1 rounded text-neutral-400 hover:text-[#1DB954] hover:bg-neutral-800 transition"
              title="Start Song Radio Mix"
            >
              <Radio className="w-4 h-4" />
            </button>
          )}

          {onDownloadToggle && (
            <button
              onClick={() => onDownloadToggle(song)}
              className={`p-1 rounded transition ${
                isDownloaded
                  ? 'text-[#1DB954] hover:text-rose-400'
                  : 'text-neutral-400 hover:text-[#1DB954] hover:bg-neutral-800'
              }`}
              title={isDownloaded ? 'Remove Download' : 'Download for Offline Listening'}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onAddToQueue(song)}
            className="p-1 rounded hover:bg-neutral-800 hover:text-[#1DB954] transition"
            title="Add to Queue"
          >
            <ListPlus className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAddToPlaylist(song)}
            className="p-1 rounded hover:bg-neutral-800 hover:text-indigo-400 transition"
            title="Add to Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>

          {onShare && (
            <button
              onClick={() => onShare(song)}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Share Track"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
