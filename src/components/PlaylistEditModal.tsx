import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, Trash2, Edit3, Check, Music } from 'lucide-react';
import { Playlist, Song } from '../types';

interface PlaylistEditModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateInfo: (playlistId: string, name: string, description?: string) => void;
  onReorderSongs: (playlistId: string, songId: string, direction: 'up' | 'down') => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRemoveSong: (playlistId: string, songId: string) => void;
}

export const PlaylistEditModal: React.FC<PlaylistEditModalProps> = ({
  playlist,
  isOpen,
  onClose,
  onUpdateInfo,
  onReorderSongs,
  onDeletePlaylist,
  onRemoveSong,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setIsEditingInfo(false);
      setShowDeleteConfirm(false);
    }
  }, [playlist]);

  if (!isOpen || !playlist) return null;

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdateInfo(playlist.id, name.trim(), description.trim());
      setIsEditingInfo(false);
    }
  };

  const handleDelete = () => {
    onDeletePlaylist(playlist.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Manage Playlist</h3>
              <p className="text-xs text-slate-400">{playlist.songs.length} tracks • Custom order</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Edit Form */}
        <div className="py-4">
          {!isEditingInfo ? (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div>
                <h4 className="font-bold text-white text-base">{playlist.name}</h4>
                {playlist.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{playlist.description}</p>
                )}
              </div>
              <button
                onClick={() => setIsEditingInfo(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveInfo} className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Playlist Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-400 transition"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tracks List Reordering */}
        <div className="space-y-2 mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reorder Songs</h4>
          {playlist.songs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded-2xl">
              No tracks in this playlist yet. Add songs from Search or Discover!
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {playlist.songs.map((song, idx) => (
                <div
                  key={`${song.id}_${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="font-mono text-slate-500 w-5 text-center shrink-0">{idx + 1}</span>
                    <img src={song.thumbnail} alt={song.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-200 truncate">{song.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  {/* Move Up / Down & Remove Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => onReorderSongs(playlist.id, song.id, 'up')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      disabled={idx === playlist.songs.length - 1}
                      onClick={() => onReorderSongs(playlist.id, song.id, 'down')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onRemoveSong(playlist.id, song.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition ml-1"
                      title="Remove track"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Danger Zone */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition"
            >
              <Trash2 className="w-4 h-4" /> Delete Playlist
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-rose-400 font-medium">Delete playlist permanently?</span>
              <button
                onClick={handleDelete}
                className="px-3 py-1 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
