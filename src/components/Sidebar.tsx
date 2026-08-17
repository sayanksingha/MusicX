import React from 'react';
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Download,
  History,
  Music2,
  Compass,
  User,
  ListMusic,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Playlist, UserProfile } from '../types';

interface SidebarProps {
  activeTab: 'discover' | 'liked' | 'playlists' | 'history' | 'downloads' | 'search';
  setActiveTab: (tab: 'discover' | 'liked' | 'playlists' | 'history' | 'downloads' | 'search') => void;
  playlists: Playlist[];
  likedCount: number;
  offlineCount: number;
  historyCount: number;
  onCreatePlaylist: () => void;
  onSelectPlaylist: (playlistId: string) => void;
  selectedPlaylistId: string | null;
  currentUser: UserProfile;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  playlists,
  likedCount,
  offlineCount,
  historyCount,
  onCreatePlaylist,
  onSelectPlaylist,
  selectedPlaylistId,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <aside className="mx-sidebar w-64 lg:w-72 flex-col gap-2 shrink-0 hidden md:flex h-full select-none">
      {/* Top Navigation Box */}
      <div className="bg-[#121212] rounded-xl p-4 space-y-3 border border-white/5">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('discover')}
          className="flex items-center gap-2.5 px-2 py-1 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-extrabold shadow-lg shadow-[#1DB954]/20 group-hover:scale-105 transition-transform">
            <Music2 className="w-4 h-4 fill-black" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-white font-sans">musicx</span>
            <span className="text-[10px] text-[#1DB954] font-semibold ml-1.5 uppercase tracking-wider">Premium</span>
          </div>
        </div>

        {/* Primary Links */}
        <nav className="space-y-1 pt-2">
          <button
            onClick={() => setActiveTab('discover')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'discover'
                ? 'text-white bg-white/10'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'discover' ? 'text-[#1DB954]' : ''}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'search'
                ? 'text-white bg-white/10'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className={`w-5 h-5 ${activeTab === 'search' ? 'text-[#1DB954]' : ''}`} />
            <span>Search</span>
          </button>
        </nav>
      </div>

      {/* Your Library Panel */}
      <div className="bg-[#121212] rounded-xl p-4 flex-1 flex flex-col min-h-0 border border-white/5 overflow-hidden">
        {/* Library Header */}
        <div className="flex items-center justify-between pb-3 text-neutral-400">
          <button
            onClick={() => setActiveTab('playlists')}
            className="flex items-center gap-2.5 hover:text-white font-bold text-sm transition"
          >
            <Library className="w-5 h-5 text-neutral-400 hover:text-white" />
            <span>Your Library</span>
          </button>

          <button
            onClick={onCreatePlaylist}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition"
            title="Create Playlist"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              activeTab === 'playlists'
                ? 'bg-white text-black font-bold'
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            Playlists
          </button>

          <button
            onClick={() => setActiveTab('liked')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'liked'
                ? 'bg-white text-black font-bold'
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <span>Liked</span>
            {likedCount > 0 && <span className="opacity-70 text-[10px]">({likedCount})</span>}
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
              activeTab === 'downloads'
                ? 'bg-white text-black font-bold'
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <span>Downloaded</span>
            {offlineCount > 0 && <span className="opacity-70 text-[10px]">({offlineCount})</span>}
          </button>
        </div>

        {/* Scrollable Library List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {/* Liked Songs Item */}
          <div
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition group ${
              activeTab === 'liked' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-neutral-300'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-600 to-rose-500 flex items-center justify-center shrink-0 shadow-md">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white">Liked Songs</p>
              <p className="text-xs text-neutral-400 truncate flex items-center gap-1">
                <span className="text-[#1DB954] font-semibold">Playlist</span> • {likedCount} songs
              </p>
            </div>
          </div>

          {/* Offline Downloads Item */}
          <div
            onClick={() => setActiveTab('downloads')}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition group ${
              activeTab === 'downloads' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-neutral-300'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shrink-0 shadow-md">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white">Offline Collection</p>
              <p className="text-xs text-neutral-400 truncate">
                <span className="text-teal-400 font-semibold">Local Storage</span> • {offlineCount} tracks
              </p>
            </div>
          </div>

          {/* User Playlists */}
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                setActiveTab('playlists');
                onSelectPlaylist(pl.id);
              }}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition group ${
                activeTab === 'playlists' && selectedPlaylistId === pl.id
                  ? 'bg-white/10 text-white'
                  : 'hover:bg-white/5 text-neutral-300'
              }`}
            >
              <div className="w-12 h-12 rounded-md bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                {pl.songs[0] ? (
                  <img src={pl.songs[0].thumbnail} alt={pl.name} className="w-full h-full object-cover" />
                ) : (
                  <ListMusic className="w-5 h-5 text-neutral-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-white">{pl.name}</p>
                <p className="text-xs text-neutral-400 truncate">
                  Playlist • {pl.songs.length} track{pl.songs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}

          {/* History Item */}
          <div
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition group ${
              activeTab === 'history' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-neutral-300'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-neutral-800 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white">Recently Played</p>
              <p className="text-xs text-neutral-400 truncate">{historyCount} tracks listened</p>
            </div>
          </div>
        </div>

        {/* User Account Bar at Bottom of Sidebar */}
        <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
          <div
            onClick={onOpenAuth}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition min-w-0"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-8 h-8 rounded-full object-cover border border-[#1DB954]"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.username}</p>
              <p className="text-[10px] text-neutral-400 truncate">
                {currentUser.id === 'guest_user' ? 'Guest Listener' : 'musicx Member'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="px-2.5 py-1 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-[11px] rounded-full transition shadow-md shrink-0"
          >
            Profile
          </button>
        </div>
      </div>
    </aside>
  );
};
