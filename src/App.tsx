/**
 * KurdTV - Android TV Xtream & M3U IPTV Player
 * Master Admin Centralized Control, Real-Time Instant Broadcast, Automatic Login, and Category Separation
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ViewTab, 
  LiveChannel, 
  VodMovie, 
  SeriesItem, 
  CategoryItem, 
  XtreamCredentials, 
  XtreamAuthResponse 
} from './types/xtream';
import { 
  CURATED_LIVE_CATEGORIES, 
  CURATED_LIVE_CHANNELS, 
  CURATED_MOVIES, 
  CURATED_SERIES,
  ExtendedLiveChannel
} from './data/curatedData';
import { TvHeader } from './components/TvHeader';
import { TvRemoteControl } from './components/TvRemoteControl';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelCard } from './components/ChannelCard';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { EpgGuideModal } from './components/EpgGuideModal';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { 
  Tv, 
  Play, 
  Search, 
  Star, 
  Calendar,
  Radio, 
  Bell,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock
} from 'lucide-react';

const STORAGE_KEYS = {
  CREDENTIALS: 'kurdtv_xtream_creds_v1',
  FAVORITES: 'kurdtv_favorites_v1',
  LANG: 'kurdtv_lang_v1',
};

const DEFAULT_CREDS: XtreamCredentials = {
  host: 'http://teslaking.net:80',
  username: 'Dylan4k',
  password: 'aFHr5N1',
};

export default function App() {
  // Localization
  const [currentLang, setCurrentLang] = useState<'ku' | 'en'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.LANG) as 'ku' | 'en') || 'ku';
  });
  const isKurdish = currentLang === 'ku';

  // Navigation & Views
  const [activeTab, setActiveTab] = useState<ViewTab>('live');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Splash & Auto-Login Animation
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState<boolean>(true);
  const [autoLoginStep, setAutoLoginStep] = useState<string>('داخڵبوونی ئۆتۆماتیکی بە کۆدی Xtream...');

  // Xtream Credentials & Auth
  const [credentials, setCredentials] = useState<XtreamCredentials>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return saved ? JSON.parse(saved) : DEFAULT_CREDS;
    } catch {
      return DEFAULT_CREDS;
    }
  });

  const [authData, setAuthData] = useState<XtreamAuthResponse | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [useCuratedFallback, setUseCuratedFallback] = useState<boolean>(true);

  // Centralized Server Admin States
  const [serverVersion, setServerVersion] = useState<number>(1);
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string>('');
  const [isAdminPinOpen, setIsAdminPinOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [verifiedAdminPin, setVerifiedAdminPin] = useState<string>('7788');
  const [liveToast, setLiveToast] = useState<{ title: string; subtitle?: string } | null>(null);

  // Data Collections
  const [categories, setCategories] = useState<CategoryItem[]>(CURATED_LIVE_CATEGORIES);
  const [channels, setChannels] = useState<ExtendedLiveChannel[]>(CURATED_LIVE_CHANNELS);
  const [movies, setMovies] = useState<VodMovie[]>(CURATED_MOVIES);
  const [series, setSeries] = useState<SeriesItem[]>(CURATED_SERIES);

  // Modals
  const [activeMedia, setActiveMedia] = useState<LiveChannel | VodMovie | null>(null);
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<VodMovie | SeriesItem | null>(null);
  const [selectedEpgChannel, setSelectedEpgChannel] = useState<ExtendedLiveChannel | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<(string | number)[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : [101, 102, 103];
    } catch {
      return [101, 102, 103];
    }
  });

  // Save favorites to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  // Save language to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, currentLang);
    document.documentElement.dir = currentLang === 'ku' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Fetch Channels & Categories from Central Server
  const loadChannelData = useCallback(async () => {
    try {
      const catRes = await fetch('/api/xtream/categories?type=live');
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories([
            { category_id: 'all', category_name: isKurdish ? 'هەموو کەناڵەکان (All Channels)' : 'All Channels' },
            ...catData,
          ]);
        }
      }

      const streamRes = await fetch('/api/xtream/streams?type=live');
      if (streamRes.ok) {
        const streamData = await streamRes.json();
        if (Array.isArray(streamData) && streamData.length > 0) {
          setChannels(streamData);
        }
      }
    } catch (err) {
      console.warn('Failed to load server streams, keeping active playlist:', err);
    }
  }, [isKurdish]);

  // Authenticate with Xtream Server
  const authenticateXtream = useCallback(async (creds: XtreamCredentials) => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/xtream/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      const data: XtreamAuthResponse = await res.json();
      setAuthData(data);

      if (data.ok) {
        setUseCuratedFallback(false);
      } else {
        setUseCuratedFallback(true);
      }
      await loadChannelData();
    } catch (err: any) {
      console.warn('Authentication failed, using fallback streams', err);
      setUseCuratedFallback(true);
    } finally {
      setIsConnecting(false);
    }
  }, [loadChannelData]);

  // Initial Load and Real-Time SSE Listener
  useEffect(() => {
    // 1. Fetch initial public config
    fetch('/api/config/public')
      .then((r) => r.json())
      .then((config) => {
        if (config.version) setServerVersion(config.version);
        if (config.announcement) setGlobalAnnouncement(config.announcement);
        if (config.host && config.username) {
          setCredentials((prev) => ({
            ...prev,
            host: config.host,
            username: config.username,
          }));
        }
      })
      .catch(() => {});

    // 2. Perform initial auth
    authenticateXtream(credentials);

    // 3. Connect to SSE for Instant Updates when Admin changes server
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/config/events');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'SERVER_UPDATED') {
            console.log('[KurdTV] Instant Server Update Received:', data);
            setServerVersion(data.version);
            if (data.announcement) setGlobalAnnouncement(data.announcement);

            // Show instant broadcast toast on user's TV
            setLiveToast({
              title: isKurdish ? 'ئاگاداری: سێرڤەری کەناڵەکان نوێکرایەوە!' : 'Server Updated Live!',
              subtitle: isKurdish
                ? 'بەڕێوەبەر سێرڤەری گۆڕی، کەناڵەکان نوێکرانەوە.'
                : 'The admin updated the server. Channels refreshed automatically.',
            });

            // Automatically reload channels immediately
            loadChannelData();

            setTimeout(() => setLiveToast(null), 6000);
          }
        } catch {}
      };
    } catch (err) {
      console.warn('SSE not supported or failed, fallback to polling:', err);
    }

    // 4. Polling fallback every 20s
    const pollInterval = setInterval(() => {
      fetch('/api/config/public')
        .then((r) => r.json())
        .then((cfg) => {
          if (cfg.version && cfg.version !== serverVersion) {
            setServerVersion(cfg.version);
            if (cfg.announcement) setGlobalAnnouncement(cfg.announcement);
            loadChannelData();
          }
        })
        .catch(() => {});
    }, 20000);

    // Auto-login sequence animation
    const t1 = setTimeout(() => {
      setAutoLoginStep('بەستنەوە بە سێرڤەری Dylan4k و جیاکردنەوەی کەناڵ و بەرنامەکان...');
    }, 500);

    const t2 = setTimeout(() => {
      setAutoLoginStep('سەرکەوتوو بوو! هەموو بەشەکان کرانەوە.');
    }, 1000);

    const t3 = setTimeout(() => {
      setIsAutoLoggingIn(false);
    }, 1400);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const toggleFavorite = (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered Channels
  const displayChannels = useMemo(() => {
    let list = channels;
    if (activeTab === 'favorites') {
      list = list.filter((ch) => favorites.includes(ch.stream_id));
    } else if (selectedCategory !== 'all') {
      list = list.filter((ch) => ch.category_id === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          ch.num.toString().includes(q) ||
          (ch.current_program && ch.current_program.toLowerCase().includes(q))
      );
    }
    return list;
  }, [channels, activeTab, selectedCategory, favorites, searchQuery]);

  // Filtered Movies
  const displayMovies = useMemo(() => {
    let list = movies;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.genre && m.genre.toLowerCase().includes(q))
      );
    }
    return list;
  }, [movies, searchQuery]);

  // Filtered Series
  const displaySeries = useMemo(() => {
    let list = series;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.genre && s.genre.toLowerCase().includes(q))
      );
    }
    return list;
  }, [series, searchQuery]);

  // Remote D-Pad Navigation
  const handleDpadPress = (direction: 'up' | 'down' | 'left' | 'right' | 'ok') => {
    const listLength =
      activeTab === 'live' || activeTab === 'favorites' || activeTab === 'epg'
        ? displayChannels.length
        : activeTab === 'vod'
        ? displayMovies.length
        : displaySeries.length;

    if (listLength === 0) return;

    if (direction === 'right') {
      setFocusedIndex((prev) => (prev + 1) % listLength);
    } else if (direction === 'left') {
      setFocusedIndex((prev) => (prev - 1 + listLength) % listLength);
    } else if (direction === 'down') {
      setFocusedIndex((prev) => (prev + 4 < listLength ? prev + 4 : prev));
    } else if (direction === 'up') {
      setFocusedIndex((prev) => (prev - 4 >= 0 ? prev - 4 : prev));
    } else if (direction === 'ok') {
      if (activeTab === 'live' || activeTab === 'favorites') {
        const item = displayChannels[focusedIndex];
        if (item) setActiveMedia(item);
      } else if (activeTab === 'epg') {
        const item = displayChannels[focusedIndex];
        if (item) setSelectedEpgChannel(item);
      } else if (activeTab === 'vod') {
        const item = displayMovies[focusedIndex];
        if (item) setSelectedMovieDetail(item);
      } else if (activeTab === 'series') {
        const item = displaySeries[focusedIndex];
        if (item) setSelectedMovieDetail(item);
      }
    }
  };

  const handleChannelStep = (delta: number) => {
    if (displayChannels.length === 0) return;
    if (!activeMedia) {
      const nextIndex = (focusedIndex + delta + displayChannels.length) % displayChannels.length;
      setFocusedIndex(nextIndex);
      setActiveMedia(displayChannels[nextIndex]);
    } else {
      const currIdx = displayChannels.findIndex((c) => c.stream_id === activeMedia.stream_id);
      const nextIdx = (currIdx + delta + displayChannels.length) % displayChannels.length;
      setActiveMedia(displayChannels[nextIdx]);
    }
  };

  const handleNumberPress = (digit: string) => {
    const targetChannel = channels.find((c) => c.num.toString() === digit);
    if (targetChannel) {
      setActiveMedia(targetChannel);
    }
  };

  // Keyboard Navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleDpadPress(isKurdish ? 'left' : 'right');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDpadPress(isKurdish ? 'right' : 'left');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDpadPress('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleDpadPress('up');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleDpadPress('ok');
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        if (activeMedia) {
          setActiveMedia(null);
        } else if (selectedMovieDetail) {
          setSelectedMovieDetail(null);
        } else if (selectedEpgChannel) {
          setSelectedEpgChannel(null);
        } else if (isAdminPinOpen) {
          setIsAdminPinOpen(false);
        } else if (isAdminPanelOpen) {
          setIsAdminPanelOpen(false);
        }
      } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleNumberPress(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, displayChannels, displayMovies, displaySeries, focusedIndex, activeMedia, selectedMovieDetail, selectedEpgChannel, isAdminPinOpen, isAdminPanelOpen, isKurdish]);

  // Full Screen Splash Screen during Automated Xtream Login
  if (isAutoLoggingIn) {
    return (
      <div className="fixed inset-0 bg-[#090d16] flex flex-col items-center justify-center p-6 select-none z-50">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-2xl">
          <Tv className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          KurdTV <span className="text-amber-400">XTREAM</span>
        </h1>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          <span>Auto-Sync: v{serverVersion}.0</span>
          <span>·</span>
          <span>Host: teslaking.net</span>
        </div>

        <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-amber-400 rounded-full animate-pulse w-3/4" />
        </div>

        <p className="text-xs text-amber-400 font-medium animate-pulse">
          {autoLoginStep}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans select-none antialiased relative">
      {/* Live Broadcast Toast Notification on TV screen */}
      {liveToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-amber-500 text-slate-950 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-200 border border-amber-300">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <Zap className="w-5 h-5 fill-slate-950" />
            <span>{liveToast.title}</span>
          </div>
          {liveToast.subtitle && (
            <p className="text-xs text-slate-900 font-medium mt-1">
              {liveToast.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Admin Announcement Ticker (if set by owner) */}
      {globalAnnouncement && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-4 text-xs font-medium text-amber-300 flex items-center justify-center gap-2">
          <Bell className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-bounce" />
          <span className="truncate">{globalAnnouncement}</span>
        </div>
      )}

      {/* Strict Top Bar Contract */}
      <TvHeader
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setFocusedIndex(0);
        }}
        onOpenSettings={() => setIsAdminPinOpen(true)}
        onOpenAdmin={() => setIsAdminPinOpen(true)}
        serverConnected={!!authData?.ok}
        activeChannelCount={channels.length}
        serverVersion={serverVersion}
        currentLang={currentLang}
        onToggleLang={() => setCurrentLang(currentLang === 'ku' ? 'en' : 'ku')}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* TV Featured Billboard Hero */}
        {activeTab === 'live' && (
          <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 mb-8 bg-slate-900 shadow-2xl h-64 sm:h-80 flex items-end">
            <img
              src="/src/assets/images/tv_hero_channels_1792430761536.jpg"
              alt="Live Television Broadcast"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090d16]/80 via-transparent to-transparent" />

            <div className="relative p-6 sm:p-8 max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                  {isKurdish ? 'هاوکات لەگەڵ سێرڤەر (Synced)' : 'LIVE SYNCED'}
                </span>
                <span className="text-xs text-slate-300">
                  {channels.length} {isKurdish ? 'کەناڵ و بەرنامە' : 'Channels Loaded'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight text-balance">
                {isKurdish ? 'کەناڵە کوردییەکان و پەخشی ڕاستەوخۆ' : 'Live Kurdish & World TV Channels'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 mt-2 line-clamp-2 max-w-xl">
                {isKurdish
                  ? 'سێرڤەری گشتی بە شێوەی مەرکەزی لەژێر دەستی بەڕێوەبەردایە. هەر گۆڕانکارییەک لە سێرڤەر ڕاستەوخۆ دەگاتە هەموو شاشەکان.'
                  : 'Centralized server management. Real-time broadcast sync across all connected Android TV devices.'}
              </p>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    if (displayChannels.length > 0) {
                      setActiveMedia(displayChannels[0]);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all tv-focusable"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isKurdish ? 'پەخشکردنی کەناڵی یەکەم (CH 1)' : 'Play CH 1'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('epg')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-medium rounded-xl text-xs transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isKurdish ? 'خشتەی بەرنامەکان (EPG)' : 'Program Guide'}</span>
                </button>

                <button
                  onClick={() => setIsAdminPinOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-amber-400 font-semibold rounded-xl text-xs transition-colors"
                  title="Admin Settings"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isKurdish ? 'بەڕێوەبەر' : 'Admin'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar when in Search tab */}
        {activeTab === 'search' && (
          <div className="mb-6 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKurdish ? 'گەڕان بەدوای کەناڵ، فیلم، زنجیرە یان بەرنامە...' : 'Search channels, movies or series...'}
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Category Filter Bar */}
        {activeTab === 'live' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => {
                  setSelectedCategory(cat.category_id);
                  setFocusedIndex(0);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-all tv-focusable ${
                  selectedCategory === cat.category_id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        )}

        {/* Section Title and Meta */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {activeTab === 'live' && (isKurdish ? 'کەناڵە جیاکراوەکان' : 'Live Channels')}
              {activeTab === 'vod' && (isKurdish ? 'فیلمە سینەماییەکان' : 'VOD Movies')}
              {activeTab === 'series' && (isKurdish ? 'زنجیرە و دراماکان' : 'TV Series')}
              {activeTab === 'epg' && (isKurdish ? 'خشتە و بەرنامەکانی ئەمڕۆ (EPG Guide)' : 'Program Guide')}
              {activeTab === 'favorites' && (isKurdish ? 'کەناڵە دڵخوازەکان' : 'Favorite Channels')}
              {activeTab === 'search' && (isKurdish ? 'ئەنجامەکانی گەڕان' : 'Search Results')}
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              ({activeTab === 'live' || activeTab === 'favorites' || activeTab === 'epg' ? displayChannels.length : activeTab === 'vod' ? displayMovies.length : displaySeries.length})
            </span>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            {isKurdish ? 'کۆنتڕۆڵ: ئاراستەکان بۆ گۆڕینی کەناڵ و Enter بۆ لێدان' : 'Use D-pad arrows to navigate & OK to play'}
          </div>
        </div>

        {/* CHANNELS GRID */}
        {(activeTab === 'live' || activeTab === 'favorites' || (activeTab === 'search' && displayChannels.length > 0)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayChannels.map((channel, idx) => (
              <ChannelCard
                key={channel.stream_id}
                channel={channel}
                isFavorite={favorites.includes(channel.stream_id)}
                onToggleFavorite={(e) => toggleFavorite(channel.stream_id, e)}
                onSelect={() => {
                  setFocusedIndex(idx);
                  setActiveMedia(channel);
                }}
                onOpenEpg={(ch) => setSelectedEpgChannel(ch)}
                isFocused={focusedIndex === idx}
              />
            ))}
          </div>
        )}

        {/* EPG TV GUIDE TIMELINE VIEW */}
        {activeTab === 'epg' && (
          <div className="space-y-4">
            {displayChannels.map((channel) => (
              <div
                key={channel.stream_id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded">
                      CH {channel.num}
                    </span>
                    <h3 className="font-bold text-sm text-white">
                      {channel.name}
                    </h3>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      · {channel.category_name}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveMedia(channel)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isKurdish ? 'پەخش' : 'Watch'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {channel.schedule?.map((prog, pIdx) => (
                    <div
                      key={pIdx}
                      className={`p-2.5 rounded-xl border text-xs ${
                        prog.isLive
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[11px] text-amber-400">
                          {prog.time}
                        </span>
                        {prog.isLive && (
                          <span className="text-[9px] font-bold text-rose-400 uppercase">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-slate-200 truncate">
                        {prog.title}
                      </div>
                    </div>
                  )) || (
                    <div className="text-xs text-slate-500 col-span-4">
                      {isKurdish ? 'بەرنامەی ئێستا:' : 'Current Program:'} {channel.current_program || 'پەخشی بەردەوام'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MOVIES GRID */}
        {activeTab === 'vod' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
            {displayMovies.map((movie, idx) => (
              <div
                key={movie.stream_id}
                onClick={() => {
                  setFocusedIndex(idx);
                  setSelectedMovieDetail(movie);
                }}
                data-focused={focusedIndex === idx}
                tabIndex={0}
                className={`group bg-slate-900/80 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 tv-focusable ${
                  focusedIndex === idx
                    ? 'border-amber-400 scale-105 shadow-xl shadow-amber-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  <img
                    src={movie.stream_icon}
                    alt={movie.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {movie.rating}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-slate-950" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-amber-400 transition-colors">
                    {movie.name}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{movie.year}</span>
                    <span className="truncate max-w-[120px]">{movie.genre}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SERIES GRID */}
        {activeTab === 'series' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {displaySeries.map((s, idx) => (
              <div
                key={s.series_id}
                onClick={() => {
                  setFocusedIndex(idx);
                  setSelectedMovieDetail(s);
                }}
                data-focused={focusedIndex === idx}
                tabIndex={0}
                className={`group bg-slate-900/80 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 tv-focusable ${
                  focusedIndex === idx
                    ? 'border-amber-400 scale-105 shadow-xl shadow-amber-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  <img
                    src={s.cover}
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {s.rating}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-amber-400 transition-colors">
                    {s.name}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{s.year}</span>
                    <span>{s.seasons?.length || 1} وەرزی</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating On-Screen TV Remote Control for Testing */}
      <TvRemoteControl
        onDpadPress={handleDpadPress}
        onBackPress={() => {
          if (activeMedia) setActiveMedia(null);
          else if (selectedMovieDetail) setSelectedMovieDetail(null);
          else if (selectedEpgChannel) setSelectedEpgChannel(null);
          else if (isAdminPinOpen) setIsAdminPinOpen(false);
          else if (isAdminPanelOpen) setIsAdminPanelOpen(false);
          else setActiveTab('live');
        }}
        onHomePress={() => {
          setActiveMedia(null);
          setSelectedMovieDetail(null);
          setSelectedEpgChannel(null);
          setIsAdminPinOpen(false);
          setIsAdminPanelOpen(false);
          setActiveTab('live');
        }}
        onChannelStep={handleChannelStep}
        onVolumeStep={() => {}}
        onToggleMute={() => {}}
        onTogglePlay={() => {}}
        onNumberPress={handleNumberPress}
        isPlaying={!!activeMedia}
      />

      {/* Fullscreen Video Player */}
      {activeMedia && (
        <VideoPlayer
          media={activeMedia}
          channelsList={channels}
          onClose={() => setActiveMedia(null)}
          onSelectChannel={(ch) => setActiveMedia(ch)}
          currentLang={currentLang}
        />
      )}

      {/* Movie Details Modal */}
      {selectedMovieDetail && (
        <MovieDetailsModal
          item={selectedMovieDetail}
          onClose={() => setSelectedMovieDetail(null)}
          onPlay={(media) => {
            setSelectedMovieDetail(null);
            setActiveMedia(media);
          }}
          currentLang={currentLang}
        />
      )}

      {/* EPG Schedule Modal */}
      {selectedEpgChannel && (
        <EpgGuideModal
          channel={selectedEpgChannel}
          onClose={() => setSelectedEpgChannel(null)}
          onPlay={(ch) => setActiveMedia(ch)}
          currentLang={currentLang}
        />
      )}

      {/* Master Admin Security PIN Unlock Modal */}
      <AdminPinModal
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onSuccess={(pin) => {
          setVerifiedAdminPin(pin);
          setIsAdminPinOpen(false);
          setIsAdminPanelOpen(true);
        }}
        currentLang={currentLang}
      />

      {/* Master Admin Control Dashboard (Owner Only) */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        adminPin={verifiedAdminPin}
        onSuccessBroadcast={(newVer) => {
          setServerVersion(newVer);
          loadChannelData();
        }}
        currentLang={currentLang}
      />
    </div>
  );
}
