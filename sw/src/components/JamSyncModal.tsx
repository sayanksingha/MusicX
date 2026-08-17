import React, { useEffect, useRef, useState } from 'react';
import { Copy, Link2, Radio, Smartphone, Users, X, Zap, LogOut, Check } from 'lucide-react';
import { PlayerState, Song } from '../types';

export interface SharedPlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: PlayerState['repeatMode'];
  isShuffle: boolean;
  queue: Song[];
  queueIndex: number;
  updatedAt: number;
  sourceId: string;
}

interface JamSyncModalProps {
  open: boolean;
  onClose: () => void;
  currentState: SharedPlaybackState;
  onRemoteState: (state: SharedPlaybackState) => void;
  onToast: (message: string) => void;
  onSessionChange: (session: { code: string; token: string } | null) => void;
}

export const JamSyncModal: React.FC<JamSyncModalProps> = ({ open, onClose, currentState, onRemoteState, onToast, onSessionChange }) => {
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle');
  const [code, setCode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [token, setToken] = useState('');
  const [deviceName, setDeviceName] = useState(() => localStorage.getItem('swargam_device_name') || `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} device`);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const sourceIdRef = useRef(`device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => () => eventSourceRef.current?.close(), []);

  useEffect(() => {
    if (!open) return;
    setMode(sessionCode ? 'create' : 'idle');
  }, [open]);

  const connect = (nextCode: string, nextToken: string) => {
    eventSourceRef.current?.close();
    const es = new EventSource(`/api/sync/events?code=${encodeURIComponent(nextCode)}&token=${encodeURIComponent(nextToken)}`);
    eventSourceRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'state' && payload.state) {
          onRemoteState(payload.state as SharedPlaybackState);
        }
      } catch {}
    };
    es.onerror = () => setConnected(false);
  };

  const createSession = async (jam = false) => {
    try {
      localStorage.setItem('swargam_device_name', deviceName);
      const res = await fetch('/api/sync/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName, sourceId: sourceIdRef.current, mode: jam ? 'jam' : 'sync', state: { ...currentState, sourceId: sourceIdRef.current } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create session');
      setSessionCode(data.code);
      setToken(data.token);
      onSessionChange({ code: data.code, token: data.token });
      setMode('create');
      connect(data.code, data.token);
      onToast(jam ? '🎧 Jam started. Share the code with friends.' : '⚡ Device sync session started.');
    } catch (error: any) {
      onToast(error?.message || 'Unable to start session.');
    }
  };

  const joinSession = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    try {
      localStorage.setItem('swargam_device_name', deviceName);
      const res = await fetch('/api/sync/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, deviceName, sourceId: sourceIdRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Session not found');
      setSessionCode(normalized);
      setToken(data.token);
      onSessionChange({ code: normalized, token: data.token });
      setMode('join');
      connect(normalized, data.token);
      if (data.state) onRemoteState(data.state);
      onToast('🔗 Connected. Playback will stay in sync.');
    } catch (error: any) {
      onToast(error?.message || 'Could not join that session.');
    }
  };

  const leave = async () => {
    eventSourceRef.current?.close();
    setConnected(false);
    if (sessionCode && token) {
      fetch('/api/sync/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: sessionCode, token }) }).catch(() => {});
    }
    setSessionCode('');
    setToken('');
    onSessionChange(null);
    setMode('idle');
    onToast('Session disconnected.');
  };

  const copyCode = async () => {
    if (!sessionCode) return;
    await navigator.clipboard?.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-xl flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#151515] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#1DB954] text-xs font-black uppercase tracking-[0.2em]">
              <Radio className="w-4 h-4" /> Swargam Connect
            </div>
            <h2 className="text-2xl font-black text-white mt-2">Jam & seamless playback</h2>
            <p className="text-sm text-neutral-400 mt-1">Keep playback aligned with friends or move listening between your devices.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {sessionCode ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#0d0d0d] border border-[#1DB954]/25 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Session code</p>
                    <p className="text-4xl font-black tracking-[0.25em] text-white mt-2">{sessionCode}</p>
                  </div>
                  <button onClick={copyCode} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2">
                    {copied ? <Check className="w-4 h-4 text-[#1DB954]" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#1DB954] animate-pulse' : 'bg-red-500'}`} />
                  {connected ? 'Live sync connected' : 'Connecting…'}
                  <span className="ml-auto">{mode === 'create' ? 'Host' : 'Guest'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <Users className="w-5 h-5 text-[#1DB954] mb-2" />
                  <p className="text-sm font-bold text-white">Jam together</p>
                  <p className="text-xs text-neutral-500 mt-1">Everyone hears the same track and follows the same queue.</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <Smartphone className="w-5 h-5 text-sky-400 mb-2" />
                  <p className="text-sm font-bold text-white">Switch devices</p>
                  <p className="text-xs text-neutral-500 mt-1">Pair another browser with this session to continue listening.</p>
                </div>
              </div>

              <button onClick={leave} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-300 font-bold flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Disconnect session
              </button>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="text-xs font-bold text-neutral-400">Device name</span>
                <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#1DB954]" placeholder="My phone" />
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                <button onClick={() => createSession(true)} className="rounded-2xl p-5 text-left bg-[#1DB954] text-black hover:brightness-110 transition">
                  <Users className="w-6 h-6 mb-4" />
                  <p className="font-black text-lg">Start a Jam</p>
                  <p className="text-xs font-semibold opacity-70 mt-1">Invite friends with a 6-character code.</p>
                </button>
                <button onClick={() => createSession(false)} className="rounded-2xl p-5 text-left bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.1] transition">
                  <Zap className="w-6 h-6 mb-4 text-[#1DB954]" />
                  <p className="font-black text-lg">Sync this device</p>
                  <p className="text-xs text-neutral-400 mt-1">Create a live session to hand playback between devices.</p>
                </button>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-neutral-500"><div className="h-px bg-white/10 flex-1" /> OR <div className="h-px bg-white/10 flex-1" /></div>

              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white tracking-[0.25em] uppercase outline-none focus:border-[#1DB954]" placeholder="ABC123" />
                <button onClick={joinSession} className="px-5 rounded-xl bg-white text-black font-black hover:bg-neutral-200 flex items-center gap-2"><Link2 className="w-4 h-4" /> Join</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
