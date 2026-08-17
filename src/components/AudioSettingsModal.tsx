import React, { useState } from 'react';
import { Sliders, X, Sparkles, Volume2, ShieldCheck, Zap } from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  crossfadeSeconds: number;
  onCrossfadeChange: (sec: number) => void;
  equalizerPreset: string;
  onEqualizerChange: (preset: string) => void;
  audioQuality: string;
  onAudioQualityChange: (quality: string) => void;
  volumeNormalization: boolean;
  onVolumeNormalizationToggle: () => void;
}

const EQ_PRESETS = [
  'Flat / Off',
  'Bass Boost',
  'Vocal Enhancer',
  'Acoustic',
  'Electronic',
  'Rock & Pop',
];

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  crossfadeSeconds,
  onCrossfadeChange,
  equalizerPreset,
  onEqualizerChange,
  audioQuality,
  onAudioQualityChange,
  volumeNormalization,
  onVolumeNormalizationToggle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>Audio & Equalizer</span>
              </h3>
              <p className="text-xs text-slate-400">Customize sound playback & quality</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner: No Ads Guaranteed */}
        <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span>100% Ad-Free Experience</span>
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            </h4>
            <p className="text-[11px] text-slate-400">
              Enjoy continuous playback without interruptions or audio advertisements.
            </p>
          </div>
        </div>

        <div className="space-y-5 my-2">
          {/* Crossfade */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">Crossfade Tracks</label>
              <span className="font-mono text-emerald-400 font-bold">{crossfadeSeconds}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={crossfadeSeconds}
              onChange={(e) => onCrossfadeChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <p className="text-[11px] text-slate-500">Overlap audio smoothly between consecutive tracks</p>
          </div>

          {/* Equalizer Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-200">Equalizer Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EQ_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => onEqualizerChange(preset)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                    equalizerPreset === preset
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Quality */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-200">Streaming Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {['Normal (160kbps)', 'High (256kbps)', 'Very High (320kbps)'].map((q) => {
                const key = q.split(' ')[0].toLowerCase();
                const isSelected = audioQuality === key;
                return (
                  <button
                    key={q}
                    onClick={() => onAudioQualityChange(key)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Normalize Volume Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">Volume Normalization</p>
              <p className="text-[11px] text-slate-400">Set same loudness level for all songs</p>
            </div>

            <button
              onClick={onVolumeNormalizationToggle}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                volumeNormalization ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  volumeNormalization ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
