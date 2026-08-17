import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Check, Music2 } from 'lucide-react';
import { Song, LyricsData } from '../types';

interface LyricsModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({ song, isOpen, onClose }) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && song) {
      fetchLyrics(song);
    }
    return () => {
      // Prevent a slow previous request from leaving stale lyrics visible.
    };
  }, [isOpen, song?.id]);

  const fetchLyrics = async (s: Song) => {
    setIsLoading(true);
    setLyricsData(null);
    try {
      const res = await fetch(`/api/lyrics?title=${encodeURIComponent(s.title)}&artist=${encodeURIComponent(s.artist)}&duration=${encodeURIComponent(String(s.duration || 0))}`);
      const data = await res.json();
      setLyricsData(data);
    } catch (e) {
      setLyricsData({
        title: s.title,
        artist: s.artist,
        lyrics: '',
        available: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLyrics = () => {
    if (lyricsData?.lyrics) {
      navigator.clipboard.writeText(lyricsData.lyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={song.thumbnail}
              alt={song.title}
              className="w-12 h-12 rounded-xl object-cover border border-slate-800"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base truncate">{song.title}</h3>
              <p className="text-xs text-slate-400 truncate">{song.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lyricsData && (
              <button
                onClick={copyLyrics}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition text-xs flex items-center gap-1"
                title="Copy Lyrics"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans space-y-4 text-slate-200">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">Fetching song lyrics...</p>
            </div>
          ) : lyricsData ? (
            <div className="space-y-4">
              {lyricsData.available ? (
                <>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                    <Music2 className="w-3 h-3" /> Lyrics
                  </div>
                  <pre className="font-sans whitespace-pre-wrap text-base leading-relaxed tracking-wide text-slate-200 font-normal">
                    {lyricsData.lyrics || lyricsData.syncedLyrics || ''}
                  </pre>
                </>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  <Music2 className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                  <p className="font-semibold text-slate-300">Lyrics aren't available for this track.</p>
                  <p className="text-xs mt-2 text-slate-500">We couldn't find a matching lyrics record.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
