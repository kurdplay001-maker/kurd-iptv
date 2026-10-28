import React, { useState } from 'react';
import { XtreamCredentials, XtreamAuthResponse } from '../types/xtream';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Tv, 
  Key, 
  Globe, 
  User 
} from 'lucide-react';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: XtreamCredentials;
  onSaveCredentials: (newCreds: XtreamCredentials) => void;
  authData: XtreamAuthResponse | null;
  onTestConnection: () => Promise<void>;
  isConnecting: boolean;
  useCuratedFallback: boolean;
  onToggleCuratedFallback: (val: boolean) => void;
  currentLang?: 'ku' | 'en';
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSaveCredentials,
  authData,
  onTestConnection,
  isConnecting,
  useCuratedFallback,
  onToggleCuratedFallback,
  currentLang = 'ku',
}) => {
  const [host, setHost] = useState(credentials.host);
  const [username, setUsername] = useState(credentials.username);
  const [password, setPassword] = useState(credentials.password);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const isKurdish = currentLang === 'ku';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCredentials({ host, username, password });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isKurdish ? 'ڕێکخستنەکانی کۆدی Xtream' : 'Xtream Codes Settings'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKurdish ? 'زانیاری هەژمار و پەیوەندی بە سێرڤەری IPTV' : 'Server credentials and IPTV status'}
            </p>
          </div>
        </div>

        {/* Current Live Diagnostic Status Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              {isKurdish ? 'دۆخی سێرڤەر (Server Status)' : 'Server Status'}
            </span>
            {authData?.ok ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {isKurdish ? 'بەستراوەتەوە (Active)' : 'Connected'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                <AlertCircle className="w-4 h-4" />
                {authData?.server_status_code
                  ? `کۆدی ${authData.server_status_code}`
                  : (isKurdish ? 'سێرڤەر وەڵام ناداتەوە' : 'Not Responding')}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Host:</span>
              <span className="font-mono text-slate-300">{credentials.host}</span>
            </div>
            <div className="flex justify-between">
              <span>Username:</span>
              <span className="font-mono text-slate-300">{credentials.username}</span>
            </div>
            {authData?.user_info?.exp_date && (
              <div className="flex justify-between">
                <span>{isKurdish ? 'بەسەرچوون:' : 'Expiry:'}</span>
                <span className="font-mono text-amber-400">
                  {new Date(parseInt(authData.user_info.exp_date) * 1000).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {authData?.message && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-amber-300/90 leading-relaxed">
              {authData.message}
            </div>
          )}
        </div>

        {/* Fallback Option Switcher */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="pr-2">
            <div className="font-semibold text-xs text-white">
              {isKurdish ? 'کەناڵە کوردییە پێشوەختەکان (Backup Kurdish Streams)' : 'Curated Backup Streams'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isKurdish
                ? 'پەخشی ڕاستەوخۆی کەناڵە کوردی و جیهانییەکان (ڕووداو، ک٢٤، ئافەرین، سپۆرت) بە خۆڕایی'
                : 'Stream high quality curated Kurdish and global channels without server timeouts'}
            </p>
          </div>
          <button
            onClick={() => onToggleCuratedFallback(!useCuratedFallback)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
              useCuratedFallback ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                useCuratedFallback ? (isKurdish ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Edit Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{isKurdish ? 'ناونیشانی سێرڤەر (Host / Server URL)' : 'Server Host URL'}</span>
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="http://example.com:80"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>{isKurdish ? 'ناوی بەکارهێنەر (Username)' : 'Username'}</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>{isKurdish ? 'تێپەڕوشە (Password)' : 'Password'}</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onTestConnection}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>{isConnecting ? (isKurdish ? 'پشکنین...' : 'Testing...') : (isKurdish ? 'تاقیکردنەوەی پەیوەندی' : 'Test Connection')}</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isKurdish ? 'پاشەکەوتکردن' : 'Save Changes'}</span>
            </button>
          </div>

          {saveSuccess && (
            <p className="text-center text-xs text-emerald-400 font-medium pt-1">
              {isKurdish ? 'زانیارییەکان بە سەرکەوتوویی پاشەکەوت کران!' : 'Credentials saved successfully!'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
