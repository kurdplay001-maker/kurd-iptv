import React from 'react';
import { ViewTab } from '../types/xtream';
import { Lock, Wifi, WifiOff } from 'lucide-react';

interface TvHeaderProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  serverConnected: boolean;
  activeChannelCount: number;
  serverVersion?: number;
  currentLang: 'ku' | 'en';
  onToggleLang: () => void;
}

export const TvHeader: React.FC<TvHeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenAdmin,
  serverConnected,
  activeChannelCount,
  serverVersion = 1,
  currentLang,
  onToggleLang,
}) => {
  const isKurdish = currentLang === 'ku';

  return (
    <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onSelectTab('live')}
          className="text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="text-amber-400">KurdTV</span>
          <span className="text-xs font-normal text-slate-400 border border-slate-700/60 rounded px-1.5 py-0.5">
            XTREAM
          </span>
          <span className="text-[10px] font-mono font-semibold text-amber-400/90 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            v{serverVersion}.0
          </span>
        </button>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('live')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'live' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''
          }`}
        >
          {isKurdish ? 'ڕاستەوخۆ (Live TV)' : 'Live TV'}
        </button>
        <button
          onClick={() => onSelectTab('vod')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'vod' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''
          }`}
        >
          {isKurdish ? 'فیلمەکان (Movies)' : 'Movies'}
        </button>
        <button
          onClick={() => onSelectTab('series')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'series' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''
          }`}
        >
          {isKurdish ? 'دراماکان (Series)' : 'Series'}
        </button>
        <button
          onClick={() => onSelectTab('epg')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'epg' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''
          }`}
        >
          {isKurdish ? 'بەرنامەکان (Guide)' : 'TV Guide'}
        </button>
        <button
          onClick={() => onSelectTab('favorites')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'favorites' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''
          }`}
        >
          {isKurdish ? 'دڵخوازەکان (Favorites)' : 'Favorites'}
        </button>
        <button
          onClick={() => onSelectTab('search')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'search' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''
          }`}
        >
          {isKurdish ? 'گەڕان (Search)' : 'Search'}
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleLang}
          className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800 transition-colors whitespace-nowrap shrink-0"
          title="Toggle Language"
        >
          {currentLang === 'ku' ? 'EN' : 'کوردی'}
        </button>

        {/* Protected Master Admin Button */}
        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all whitespace-nowrap shrink-0 shadow-xs"
          title="Master Admin Panel"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>{isKurdish ? 'بەڕێوەبەر (Admin)' : 'Admin'}</span>
        </button>
      </div>
    </header>
  );
};
