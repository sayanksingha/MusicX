import React, { useState } from 'react';
import { Moon, Clock, X, Check, Timer, Sparkles } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimerMode: 'off' | 'end_of_track' | number; // 'off', 'end_of_track', or remaining seconds
  initialDurationMinutes: number | null; // e.g., 15 if set for 15 mins
  onSetTimer: (mode: 'off' | 'end_of_track' | number) => void; // number = minutes to set
}

const PRESET_MINUTES = [5, 10, 15, 30, 45, 60];

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  sleepTimerMode,
  initialDurationMinutes,
  onSetTimer,
}) => {
  const [customMinutes, setCustomMinutes] = useState<string>('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 300) {
      onSetTimer(mins);
      setCustomMinutes('');
      onClose();
    }
  };

  const formatRemainingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) {
      return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${s}s`;
  };

  const isActive = sleepTimerMode !== 'off';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>Sleep Timer</span>
                {isActive && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Stop playback automatically</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Timer Banner */}
        {isActive && (
          <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-950 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                <Timer className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Playback will stop in</p>
                <p className="text-sm font-bold text-indigo-300 font-mono">
                  {sleepTimerMode === 'end_of_track'
                    ? 'End of Track'
                    : typeof sleepTimerMode === 'number'
                    ? formatRemainingTime(sleepTimerMode)
                    : 'Active'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {typeof sleepTimerMode === 'number' && (
                <button
                  onClick={() => onSetTimer(Math.ceil(sleepTimerMode / 60) + 5)}
                  className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
                  title="Add 5 Minutes"
                >
                  +5m
                </button>
              )}
              <button
                onClick={() => {
                  onSetTimer('off');
                  onClose();
                }}
                className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition"
              >
                Turn Off
              </button>
            </div>
          </div>
        )}

        {/* Presets Grid */}
        <div className="py-3 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Duration</h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESET_MINUTES.map((mins) => {
              const isSelected = initialDurationMinutes === mins && typeof sleepTimerMode === 'number';
              return (
                <button
                  key={mins}
                  onClick={() => {
                    onSetTimer(mins);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 opacity-70" />
                    <span>{mins} minutes</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          {/* End of Track Option */}
          <button
            onClick={() => {
              onSetTimer('end_of_track');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm font-semibold transition-all ${
              sleepTimerMode === 'end_of_track'
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>End of Track</span>
            </div>
            {sleepTimerMode === 'end_of_track' && <Check className="w-4 h-4" />}
          </button>
        </div>

        {/* Custom Timer Input */}
        <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Custom Minutes (1 - 300)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={300}
              placeholder="e.g. 20"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!customMinutes}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition"
            >
              Set Timer
            </button>
          </div>
        </form>

        {/* Cancel Button */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center">
          {isActive ? (
            <button
              onClick={() => {
                onSetTimer('off');
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              Turn Off Timer
            </button>
          ) : (
            <span className="text-xs text-slate-500">No active timer</span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
