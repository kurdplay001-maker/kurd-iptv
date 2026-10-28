import React from 'react';
import { ExtendedLiveChannel } from '../data/curatedData';
import { X, Calendar, Clock, Play, Radio, Tv } from 'lucide-react';

interface EpgGuideModalProps {
  channel: ExtendedLiveChannel | null;
  onClose: () => void;
  onPlay: (channel: ExtendedLiveChannel) => void;
  currentLang?: 'ku' | 'en';
}

export const EpgGuideModal: React.FC<EpgGuideModalProps> = ({
  channel,
  onClose,
  onPlay,
  currentLang = 'ku',
}) => {
  if (!channel) return null;

  const isKurdish = currentLang === 'ku';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0">
              {channel.stream_icon ? (
                <img src={channel.stream_icon} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <Tv className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  CH {channel.num}
                </span>
                <h3 className="font-bold text-lg text-white">
                  {channel.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isKurdish ? 'خشتە و کاتی پەخشی بەرنامەکان (EPG)' : 'Channel Program Guide & Schedule'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule List */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {isKurdish ? 'بەرنامەکانی ئەمڕۆ' : "Today's Programs"}
            </span>
            <span>{isKurdish ? 'کاتژمێر بە کاتی هەولێر' : 'Erbil Local Time'}</span>
          </div>

          {channel.schedule && channel.schedule.length > 0 ? (
            channel.schedule.map((prog, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  prog.isLive
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {prog.time}
                  </span>
                  {prog.isLive && (
                    <span className="text-[10px] font-bold uppercase bg-rose-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {isKurdish ? 'ئێستا ڕاستەوخۆ' : 'ON AIR NOW'}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm text-white">
                  {prog.title}
                </div>
                {prog.description && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {prog.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              {isKurdish ? 'خشتەی بەرنامەکانی ئەم کەناڵە لە کاتی پەخشدا نوێ دەکرێتەوە.' : 'Live EPG data will refresh on broadcast.'}
            </div>
          )}
        </div>

        {/* Bottom Play Button */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {channel.category_name}
          </span>
          <button
            onClick={() => {
              onClose();
              onPlay(channel);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{isKurdish ? 'سەیرکردنی پەخشی ڕاستەوخۆ' : 'Watch Live Channel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
