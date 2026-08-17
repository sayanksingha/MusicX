import React, { useState, useEffect, useRef } from 'react';
import { Search, Music, Heart, Library, History, Compass, Download, User, X } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  activeTab: 'discover' | 'liked' | 'playlists' | 'history' | 'downloads' | 'search';
  setActiveTab: (tab: 'discover' | 'liked' | 'playlists' | 'history' | 'downloads' | 'search') => void;
  likedCount: number;
  offlineCount: number;
  currentUser: UserProfile;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activeTab,
  setActiveTab,
  likedCount,
  offlineCount,
  currentUser,
  onOpenAuth,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shortcut key '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
      setActiveTab('search');
    }
  };

  return (
    <header className="mx-navbar sticky top-0 z-30 w-full bg-[#121212]/95 backdrop-blur-md px-4 md:px-6 py-3 transition-all border-b border-white/5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding for mobile + User Profile */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div
            onClick={() => setActiveTab('discover')}
            className="flex items-center gap-2.5 cursor-pointer group md:hidden"
          >
            <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-black shadow-md">
              <Music className="w-4 h-4 text-black fill-black" />
            </div>
            <span className="font-extrabold text-lg text-white">musicx</span>
          </div>

          {/* User Account Pill */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1 rounded-full bg-black/70 hover:bg-black border border-white/10 text-xs text-white transition shadow-sm"
            title="Account Settings"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-6 h-6 rounded-full object-cover border border-[#1DB954]"
            />
            <span className="hidden sm:inline font-bold truncate max-w-[110px]">
              {currentUser.username}
            </span>
          </button>
        </div>

        {/* Center: Spotify-styled Search Bar */}
        <form onSubmit={handleSubmit} className="w-full md:max-w-md relative">
          <div
            className={`relative flex items-center w-full rounded-full bg-[#242424] border transition-all duration-200 ${
              isFocused
                ? 'border-white ring-2 ring-white/20 bg-[#2a2a2a]'
                : 'border-transparent hover:border-white/20'
            }`}
          >
            <Search className="w-4 h-4 text-neutral-400 ml-3.5 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="What do you want to listen to?"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full py-2.5 pl-3 pr-10 bg-transparent text-sm text-white placeholder-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 p-1 text-neutral-400 hover:text-white rounded-full transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {!searchQuery && (
              <kbd className="hidden sm:inline-block absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-800 rounded border border-neutral-700">
                /
              </kbd>
            )}
          </div>
        </form>

        {/* Right: Mobile View Tabs Bar */}
        <nav className="flex md:hidden items-center gap-1 bg-black/60 p-1 rounded-full border border-white/10 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
              activeTab === 'discover'
                ? 'bg-white text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Discover
          </button>

          <button
            onClick={() => setActiveTab('liked')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
              activeTab === 'liked'
                ? 'bg-white text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Liked ({likedCount})
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
              activeTab === 'playlists'
                ? 'bg-white text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Library
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
              activeTab === 'downloads'
                ? 'bg-white text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Offline ({offlineCount})
          </button>
        </nav>
      </div>
    </header>
  );
};
