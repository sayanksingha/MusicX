import React, { useState } from 'react';
import { X, User, Mail, LogOut, CheckCircle2, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { signupUser, loginUser, logoutUser, getRegisteredUsers } from '../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onUserChanged: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUserChanged,
}) => {
  const [tab, setTab] = useState<'profile' | 'login' | 'signup'>(
    currentUser.id === 'guest_user' ? 'login' : 'profile'
  );
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const registeredUsers = getRegisteredUsers();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setError('Please provide both username and email.');
      return;
    }
    const user = signupUser(username.trim(), email.trim());
    onUserChanged(user);
    setError('');
    setTab('profile');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email.');
      return;
    }
    const user = loginUser(email.trim());
    if (user) {
      onUserChanged(user);
      setError('');
      setTab('profile');
    } else {
      setError('Account not found with this email. Please sign up!');
    }
  };

  const handleSwitchUser = (selectedEmail: string) => {
    const user = loginUser(selectedEmail);
    if (user) {
      onUserChanged(user);
      setTab('profile');
    }
  };

  const handleLogout = () => {
    const guest = logoutUser();
    onUserChanged(guest);
    setTab('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">musix Account</h3>
            <p className="text-xs text-slate-400">Personalize playlists, favorites & listening history</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: PROFILE VIEW */}
        {tab === 'profile' && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-white text-base truncate flex items-center gap-1.5">
                  <span>{currentUser.username}</span>
                  {currentUser.id !== 'guest_user' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </h4>
                <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentUser.id === 'guest_user' ? 'Guest Mode' : 'musix Member'}
                </span>
              </div>
            </div>

            {/* Account switchers */}
            {registeredUsers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">Switch Saved Profile</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {registeredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u.email)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-left text-xs ${
                        u.id === currentUser.id
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img src={u.avatar} alt={u.username} className="w-6 h-6 rounded-full object-cover" />
                        <span className="truncate">{u.username}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{u.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setTab('signup')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Create Another Account</span>
              </button>

              {currentUser.id !== 'guest_user' && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs border border-rose-500/20 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>

            <div className="pt-2 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setTab('signup');
                  }}
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Sign Up Free
                </button>
              </p>
            </div>
          </form>
        )}

        {/* TAB 3: SIGNUP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name / Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="alex@musix.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Account</span>
            </button>

            <div className="pt-2 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setTab('login');
                  }}
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Log In Here
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
