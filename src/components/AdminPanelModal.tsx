import React, { useState } from 'react';
import { 
  X, 
  Server, 
  ShieldCheck, 
  Radio, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Key, 
  Globe, 
  FileText, 
  Bell, 
  Lock,
  Flame,
  Zap
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminPin: string;
  onSuccessBroadcast: (newVersion: number) => void;
  currentLang?: 'ku' | 'en';
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  adminPin,
  onSuccessBroadcast,
  currentLang = 'ku',
}) => {
  const isKurdish = currentLang === 'ku';

  // Form states
  const [serverMode, setServerMode] = useState<'xtream' | 'm3u'>('xtream');
  const [host, setHost] = useState('http://teslaking.net:80');
  const [username, setUsername] = useState('Dylan4k');
  const [password, setPassword] = useState('aFHr5N1');
  const [m3uUrl, setM3uUrl] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);

  // Status & Testing
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; channelCount?: number } | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ ok: boolean; message: string; viewers?: number } | null>(null);
  const [activeViewers, setActiveViewers] = useState<number>(1);
  const [currentVersion, setCurrentVersion] = useState<number>(1);

  // Load current configuration when modal opens
  React.useEffect(() => {
    if (!isOpen) return;

    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: adminPin }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          setServerMode(data.config.serverMode || 'xtream');
          setHost(data.config.host || 'http://teslaking.net:80');
          setUsername(data.config.username || 'Dylan4k');
          setPassword(data.config.password || 'aFHr5N1');
          setM3uUrl(data.config.m3uUrl || '');
          setAnnouncement(data.config.announcement || '');
          setFallbackEnabled(data.config.fallbackEnabled ?? true);
          setCurrentVersion(data.config.version || 1);
          setActiveViewers(data.activeViewersCount || 1);
        }
      })
      .catch((err) => console.error('Failed to load admin config:', err));
  }, [isOpen, adminPin]);

  if (!isOpen) return null;

  // Test Server Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverMode,
          host,
          username,
          password,
          m3uUrl,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ ok: false, message: `پەیوەندی سەرکەوتوو نەبوو: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  // Broadcast to all users immediately
  const handleBroadcastUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
          serverMode,
          host,
          username,
          password,
          m3uUrl,
          announcement,
          fallbackEnabled,
          adminPin: newAdminPin || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setBroadcastResult({
          ok: true,
          message: isKurdish
            ? 'سێرڤەر بە سەرکەوتوویی نوێکرایەوە و ڕاستەوخۆ نێردرا بۆ سەرجەم بەکارهێنەران!'
            : 'Server updated successfully and broadcasted live to all active users!',
          viewers: data.activeViewersNotified,
        });
        setCurrentVersion(data.config.version);
        onSuccessBroadcast(data.config.version);
      } else {
        setBroadcastResult({ ok: false, message: data.error || 'هەڵەیەک ڕوویدا لە بڵاوکردنەوەدا' });
      }
    } catch (err: any) {
      setBroadcastResult({ ok: false, message: `شکستی هێنا: ${err.message}` });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isKurdish ? 'کۆنتڕۆڵی بەڕێوەبەر (Admin Dashboard)' : 'Master Admin Dashboard'}
              </h2>
              <span className="text-[10px] font-mono bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold uppercase">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKurdish
                ? 'گۆڕینی سێرڤەری گشتی بۆ هەموو بەکارهێنەران بە یەک کلیک بە شێوەی ڕاستەوخۆ'
                : 'Centralized server management. Instant real-time broadcast to all user TVs.'}
            </p>
          </div>
        </div>

        {/* Live Broadcast Telemetry Strip */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {isKurdish ? 'وەشانی سێرڤەر' : 'Server Version'}
            </span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              v{currentVersion}.0
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {isKurdish ? 'بینەرانی چالاک ئێستا' : 'Live Connected TVs'}
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {activeViewers} {isKurdish ? 'شاشە' : 'screens'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {isKurdish ? 'دۆخی بڵاوکردنەوە' : 'Sync Status'}
            </span>
            <span className="font-mono font-semibold text-slate-200 text-xs">
              {isKurdish ? 'ڕاستەوخۆ (SSE)' : 'Real-Time'}
            </span>
          </div>
        </div>

        {/* Mode Selector (Xtream vs M3U) */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            {isKurdish ? 'جۆری سێرڤەر هەڵبژێرە:' : 'Select Server Mode:'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setServerMode('xtream')}
              className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 ${
                serverMode === 'xtream'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs">کۆدی Xtream (Host / User / Pass)</div>
                <div className="text-[10px] text-slate-400 font-normal">Xtream Codes API</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setServerMode('m3u')}
              className={`p-3 rounded-2xl border text-start transition-all flex items-center gap-3 ${
                serverMode === 'm3u'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs">بەستەری پلەیلیستی M3U / M3U8</div>
                <div className="text-[10px] text-slate-400 font-normal">M3U Playlist URL</div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Update Form */}
        <form onSubmit={handleBroadcastUpdate} className="space-y-4">
          {serverMode === 'xtream' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKurdish ? 'ناونیشانی سێرڤەر (Host URL)' : 'Server Host URL'}</span>
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="http://example.com:80"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isKurdish ? 'ناوی بەکارهێنەر (Username)' : 'Username'}</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{isKurdish ? 'بەستەری فایلی M3U / M3U8 (Playlist Link)' : 'M3U Playlist Link'}</span>
              </label>
              <input
                type="url"
                value={m3uUrl}
                onChange={(e) => setM3uUrl(e.target.value)}
                placeholder="http://example.com/get.php?username=...&type=m3u_plus&output=m3u8"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {isKurdish
                  ? 'سیستمەکە بە شێوەیەکی ئۆتۆماتیک کەناڵەکان لێکدەداتەوە و پۆلێنیان دەکات.'
                  : 'The system automatically parses channels, logos, and categories.'}
              </p>
            </div>
          )}

          {/* Global Broadcast Announcement */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>{isKurdish ? 'ئاگاداری گشتی بۆ هەموو بینەران (Announcement Banner - ئارەزوومەندانە)' : 'Global Announcement (Optional)'}</span>
            </label>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder={isKurdish ? 'بۆ نموونە: سێرڤەری نوێ چالاککرا، سەیرکردنێکی خۆش!' : 'e.g. New high-speed server active!'}
              className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Change Admin PIN */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{isKurdish ? 'گۆڕینی کۆدی نهێنی بەڕێوەبەر (New PIN - بە بەتاڵی جێیبهێڵە ئەگەر ناتەوێت بیگۆڕیت)' : 'Change Master Admin PIN'}</span>
            </label>
            <input
              type="password"
              value={newAdminPin}
              onChange={(e) => setNewAdminPin(e.target.value)}
              placeholder={isKurdish ? 'کۆدی نوێ (بۆ نموونە: 9988)' : 'New PIN (e.g. 9988)'}
              className="w-48 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          {/* Test Server Status Area */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Broadcast Success Message */}
          {broadcastResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                broadcastResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}
            >
              {broadcastResult.ok ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <div>
                <div className="font-bold">{broadcastResult.message}</div>
                {broadcastResult.viewers !== undefined && (
                  <div className="text-[11px] text-emerald-400/80 mt-0.5">
                    {isKurdish
                      ? `ئەبدەیتەکە ڕاستەوخۆ گەیشتە ${broadcastResult.viewers} شاشەی چالاک!`
                      : `Instant update broadcast to ${broadcastResult.viewers} active TV screens!`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? (isKurdish ? 'پشکنین...' : 'Testing...') : (isKurdish ? 'تاقیکردنەوەی سێرڤەر پێش بڵاوکردنەوە' : 'Test Server Before Broadcast')}</span>
            </button>

            <button
              type="submit"
              disabled={isBroadcasting}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isBroadcasting ? (isKurdish ? 'ناردن بۆ هەمووان...' : 'Broadcasting...') : (isKurdish ? 'بڵاوکردنەوە بۆ هەموو بەکارهێنەران (Broadcast)' : 'Broadcast to All Users')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
