import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  ArrowLeft, 
  List, 
  Tv, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { LiveChannel, VodMovie } from '../types/xtream';

interface VideoPlayerProps {
  media: LiveChannel | VodMovie;
  channelsList?: LiveChannel[];
  onClose: () => void;
  onSelectChannel?: (channel: LiveChannel) => void;
  currentLang?: 'ku' | 'en';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  media,
  channelsList = [],
  onClose,
  onSelectChannel,
  currentLang = 'ku',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOsd, setShowOsd] = useState(true);
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const osdTimerRef = useRef<any>(null);

  const isLive = media.stream_type === 'live';
  const isKurdish = currentLang === 'ku';

  // Wake up OSD and schedule auto-hide
  const wakeOsd = () => {
    setShowOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      if (!showChannelDrawer) {
        setShowOsd(false);
      }
    }, 4500);
  };

  // Initialize playback with Hls.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    const streamUrl = media.stream_url;
    if (!streamUrl) {
      setHasError(true);
      setErrorMessage(isKurdish ? 'بەستەری پەخش بەردەست نییە' : 'Stream URL is missing');
      setIsLoading(false);
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && (streamUrl.includes('.m3u8') || streamUrl.includes('proxy'))) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network error, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setErrorMessage(isKurdish ? 'کێشە لە پەخشکردنی کەناڵدا ڕوویدا' : 'Stream playback error');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || streamUrl.endsWith('.mp4')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setErrorMessage(isKurdish ? 'کێشە لە بارکردنی پەخش' : 'Failed to load video stream');
        setIsLoading(false);
      });
    } else {
      video.src = streamUrl;
      video.play().catch(() => setIsPlaying(false));
      setIsLoading(false);
    }

    wakeOsd();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    };
  }, [media.stream_url]);

  // Handle Fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    wakeOsd();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
    wakeOsd();
  };

  const cycleAspectRatio = () => {
    wakeOsd();
    if (aspectRatio === 'contain') setAspectRatio('cover');
    else if (aspectRatio === 'cover') setAspectRatio('fill');
    else setAspectRatio('contain');
  };

  // Keyboard navigation for TV Player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      wakeOsd();
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (showChannelDrawer) {
          setShowChannelDrawer(false);
          e.preventDefault();
        } else {
          onClose();
        }
      } else if (e.key === ' ' || e.key === 'k') {
        togglePlay();
        e.preventDefault();
      } else if (e.key === 'f') {
        toggleFullscreen();
        e.preventDefault();
      } else if (e.key === 'm') {
        toggleMute();
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Toggle channel drawer
        setShowChannelDrawer((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChannelDrawer, onClose]);

  const objectFitClass = 
    aspectRatio === 'contain' ? 'object-contain' :
    aspectRatio === 'cover' ? 'object-cover' : 'object-fill';

  return (
    <div
      ref={containerRef}
      onMouseMove={wakeOsd}
      onClick={wakeOsd}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full ${objectFitClass} bg-black`}
        playsInline
        autoPlay
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      {/* Buffering Loader */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none">
          <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-400 rounded-full animate-spin mb-3" />
          <span className="text-sm font-medium text-slate-200">
            {isKurdish ? 'بارکردنی پەخشی ڕاستەوخۆ...' : 'Loading stream...'}
          </span>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full mb-3">
            <Tv className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {isKurdish ? 'کێشە لە پەخشکردندا ڕوویدا' : 'Stream Unavailable'}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            {errorMessage || (isKurdish ? 'ناتوانرێت ئەم کەناڵە لێبدرێت. سێرڤەرەکە کارناکات یان پەخشەکە پچڕاوە.' : 'Unable to play this channel. Server is unreachable or stream is down.')}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) videoRef.current.load();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isKurdish ? 'دووبارە هەوڵبدەرەوە' : 'Retry'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-sm"
            >
              {isKurdish ? 'گەڕانەوە' : 'Back to Guide'}
            </button>
          </div>
        </div>
      )}

      {/* Android TV Top OSD Bar */}
      <div
        className={`absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 flex items-center justify-between ${
          showOsd ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 text-white transition-all active:scale-95"
            title="Back to Guide"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              {'num' in media && (
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  CH {media.num}
                </span>
              )}
              <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">
                {media.name}
              </h2>
            </div>
            {'category_name' in media && (
              <p className="text-xs text-slate-400 mt-0.5">
                {media.category_name}
                {'current_program' in media && media.current_program && (
                  <span> · {media.current_program}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Stream Badges */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE FHD
          </span>
          <button
            onClick={() => setShowChannelDrawer(!showChannelDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
          >
            <List className="w-4 h-4 text-amber-400" />
            <span>{isKurdish ? 'کەناڵەکان' : 'Channels'}</span>
          </button>
        </div>
      </div>

      {/* Android TV Bottom OSD Controls */}
      <div
        className={`absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          showOsd ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-3 rounded-full bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-slate-200 active:scale-95"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Center Info */}
          {'next_program' in media && media.next_program && (
            <div className="text-center hidden sm:block">
              <span className="text-[11px] text-slate-400 block">
                {isKurdish ? 'بەرنامەی دواتر:' : 'Up Next:'}
              </span>
              <span className="text-xs font-medium text-slate-200">
                {media.next_program}
              </span>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={cycleAspectRatio}
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-xs font-mono text-slate-300 uppercase"
              title="Change Aspect Ratio"
            >
              {aspectRatio}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-full bg-slate-900/80 border border-slate-700 hover:bg-slate-800 text-slate-200 active:scale-95"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* In-Player Channel Drawer (Quick Channel Zapping) */}
      {showChannelDrawer && channelsList.length > 0 && (
        <div
          className={`absolute top-0 bottom-0 ${
            isKurdish ? 'left-0' : 'right-0'
          } w-80 bg-slate-950/95 border-r border-slate-800 p-4 overflow-y-auto z-40 backdrop-blur-xl animate-in slide-in-from-${
            isKurdish ? 'left' : 'right'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white">
              {isKurdish ? 'گۆڕینی کەناڵ' : 'Quick Channel Switch'}
            </h3>
            <button
              onClick={() => setShowChannelDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              {isKurdish ? 'داخستن' : 'Close'}
            </button>
          </div>

          <div className="space-y-1.5">
            {channelsList.map((ch) => {
              const isCurrent = ch.stream_id === media.stream_id;
              return (
                <button
                  key={ch.stream_id}
                  onClick={() => {
                    if (onSelectChannel) onSelectChannel(ch);
                    setShowChannelDrawer(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-all ${
                    isCurrent
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-semibold'
                      : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                  }`}
                >
                  <span className="font-mono text-xs w-6 text-slate-400">
                    {ch.num}
                  </span>
                  <div className="truncate flex-1">
                    <div className="text-xs truncate">{ch.name}</div>
                    {ch.current_program && (
                      <div className="text-[10px] text-slate-500 truncate">
                        {ch.current_program}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
