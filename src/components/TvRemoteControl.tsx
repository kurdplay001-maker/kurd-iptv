import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  CornerDownLeft, 
  ArrowLeft, 
  Home, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Tv, 
  X,
  Plus,
  Minus
} from 'lucide-react';

interface TvRemoteControlProps {
  onDpadPress: (direction: 'up' | 'down' | 'left' | 'right' | 'ok') => void;
  onBackPress: () => void;
  onHomePress: () => void;
  onChannelStep: (delta: number) => void;
  onVolumeStep: (delta: number) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onNumberPress: (digit: string) => void;
  isPlaying?: boolean;
  isMuted?: boolean;
}

export const TvRemoteControl: React.FC<TvRemoteControlProps> = ({
  onDpadPress,
  onBackPress,
  onHomePress,
  onChannelStep,
  onVolumeStep,
  onToggleMute,
  onTogglePlay,
  onNumberPress,
  isPlaying = false,
  isMuted = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playClick = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // AudioContext may be blocked before interaction
    }
  };

  const handleAction = (cb: () => void) => {
    playClick();
    cb();
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-2xl text-xs font-semibold text-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-all backdrop-blur-md"
          title="Open TV Remote Control"
        >
          <Tv className="w-4 h-4 text-amber-400" />
          <span>ڕیمۆتی تیڤی / TV Remote</span>
        </button>
      ) : (
        <div className="w-64 bg-slate-950/95 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Remote Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Tv className="w-4 h-4 text-amber-400" />
              <span>Android TV Remote</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1 rounded text-[10px] ${soundEnabled ? 'text-amber-400' : 'text-slate-500'}`}
                title="Toggle Beep Feedback"
              >
                {soundEnabled ? 'دەنگ: چالاک' : 'دەنگ: بێدەنگ'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions (Home & Back) */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleAction(onHomePress)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 rounded-xl text-xs font-medium transition-all"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>Home</span>
            </button>
            <button
              onClick={() => handleAction(onBackPress)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 rounded-xl text-xs font-medium transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Back</span>
            </button>
          </div>

          {/* D-PAD Cross */}
          <div className="relative w-44 h-44 mx-auto mb-4 bg-slate-900/90 rounded-full border border-slate-800 shadow-inner flex items-center justify-center">
            {/* UP */}
            <button
              onClick={() => handleAction(() => onDpadPress('up'))}
              className="absolute top-1.5 p-2 text-slate-300 hover:text-amber-400 active:scale-90 transition-all"
              aria-label="Up"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            {/* DOWN */}
            <button
              onClick={() => handleAction(() => onDpadPress('down'))}
              className="absolute bottom-1.5 p-2 text-slate-300 hover:text-amber-400 active:scale-90 transition-all"
              aria-label="Down"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            {/* LEFT */}
            <button
              onClick={() => handleAction(() => onDpadPress('left'))}
              className="absolute left-1.5 p-2 text-slate-300 hover:text-amber-400 active:scale-90 transition-all"
              aria-label="Left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            {/* RIGHT */}
            <button
              onClick={() => handleAction(() => onDpadPress('right'))}
              className="absolute right-1.5 p-2 text-slate-300 hover:text-amber-400 active:scale-90 transition-all"
              aria-label="Right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            {/* CENTER OK BUTTON */}
            <button
              onClick={() => handleAction(() => onDpadPress('ok'))}
              className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-sm shadow-md flex items-center justify-center transition-all"
            >
              OK
            </button>
          </div>

          {/* TV Rocker Controls: VOL & CH */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Volume */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 mb-1 font-mono uppercase tracking-wider">VOL</span>
              <div className="flex items-center gap-1 w-full justify-between px-1">
                <button
                  onClick={() => handleAction(() => onVolumeStep(-5))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-90"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAction(onToggleMute)}
                  className="p-1.5 text-slate-400 hover:text-amber-400"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleAction(() => onVolumeStep(5))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Channels */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 mb-1 font-mono uppercase tracking-wider">CH</span>
              <div className="flex items-center gap-1 w-full justify-between px-1">
                <button
                  onClick={() => handleAction(() => onChannelStep(-1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-90"
                  title="Previous Channel"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleAction(onTogglePlay)}
                  className="p-1.5 text-amber-400 hover:text-amber-300 active:scale-90"
                  title="Play / Pause"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleAction(() => onChannelStep(1))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-90"
                  title="Next Channel"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Number Pad */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleAction(() => onNumberPress(digit))}
                className={`py-1 rounded-lg text-xs font-mono font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all ${
                  digit === '0' ? 'col-span-3' : ''
                }`}
              >
                {digit}
              </button>
            ))}
          </div>

          {/* Keyboard info */}
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 text-center leading-tight">
            کل تەختەکلیل: ئاراستەکان ↑↓←→ | دڵنیاکردنەوە: Enter | گەڕانەوە: Esc
          </div>
        </div>
      )}
    </div>
  );
};
