import React from 'react';
import { LiveChannel } from '../types/xtream';
import { Star, Tv, Play } from 'lucide-react';

interface ChannelCardProps {
  channel: LiveChannel;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onOpenEpg?: (channel: LiveChannel, e: React.MouseEvent) => void;
  isFocused?: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onOpenEpg,
  isFocused = false,
}) => {
  return (
    <div
      onClick={onSelect}
      data-focused={isFocused}
      tabIndex={0}
      className={`group relative bg-slate-900/70 border rounded-2xl p-4 cursor-pointer transition-all duration-200 select-none tv-focusable flex flex-col justify-between overflow-hidden ${
        isFocused
          ? 'border-amber-400/80 bg-slate-800/90 shadow-lg shadow-amber-500/10 scale-105'
          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
      }`}
    >
      {/* Top row: Number and Favorite */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-amber-400">
          CH {channel.num}
        </span>
        <div className="flex items-center gap-1">
          {onOpenEpg && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenEpg(channel, e);
              }}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700/50 transition-colors"
              title="بەرنامەکانی کەناڵ / Program Schedule"
            >
              خشتەی بەرنامە
            </button>
          )}
          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-full hover:bg-slate-700/80 transition-colors ${
              isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Middle Channel Brand & Icon */}
      <div className="flex items-center gap-3.5 my-2">
        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:border-amber-500/40 transition-colors">
          {channel.stream_icon ? (
            <img
              src={channel.stream_icon}
              alt={channel.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to TV icon if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Tv className="w-5 h-5 text-slate-500" />
          )}
          <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Play className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm lg:text-base text-white tracking-tight truncate group-hover:text-amber-400 transition-colors">
            {channel.name}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {channel.current_program || channel.category_name || 'پەخشی ڕاستەوخۆ'}
          </p>
        </div>
      </div>

      {/* Bottom Row: Quality & Up Next info */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span className="truncate max-w-[170px]">
          {channel.next_program ? `دواتر: ${channel.next_program}` : 'کوالێتی سەرهێڵ'}
        </span>
        <span className="font-mono uppercase text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          {channel.quality || 'FHD'}
        </span>
      </div>
    </div>
  );
};
