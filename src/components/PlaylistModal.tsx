import React, { useState } from 'react';
import { X, Plus, FolderPlus, Check } from 'lucide-react';
import { Song, Playlist } from '../types';

interface PlaylistModalProps {
  song: Song | null;
  isOpen: boolean;
  playlists: Playlist[];
  onClose: () => void;
  onCreatePlaylist: (name: string) => void;
  onAddSongToPlaylist: (playlistId: string, song: Song) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  song,
  isOpen,
  playlists,
  onClose,
  onCreatePlaylist,
  onAddSongToPlaylist,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (!isOpen || !song) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    onAddSongToPlaylist(playlistId, song);
    setAddedIds((prev) => new Set(prev).add(playlistId));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(playlistId);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-white text-lg">Add to Playlist</h3>
            <p className="text-xs text-slate-400 truncate max-w-xs">{song.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Playlist Toggle */}
        <div className="py-4">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-sm hover:bg-emerald-500/20 transition"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create New Playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl hover:bg-emerald-400 transition"
              >
                Create
              </button>
            </form>
          )}
        </div>

        {/* List of Playlists */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {playlists.map((pl) => {
            const isSongInPlaylist = pl.songs.some((s) => s.id === song.id);
            const isJustAdded = addedIds.has(pl.id);

            return (
              <div
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer transition"
              >
                <div>
                  <p className="font-semibold text-slate-100 text-sm">{pl.name}</p>
                  <p className="text-xs text-slate-400">{pl.songs.length} songs</p>
                </div>

                <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                  {isJustAdded || isSongInPlaylist ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
