import React from 'react';
import { VodMovie, SeriesItem, SeriesEpisode } from '../types/xtream';
import { X, Play, Star, Calendar, Clock, Film } from 'lucide-react';

interface MovieDetailsModalProps {
  item: VodMovie | SeriesItem | null;
  onClose: () => void;
  onPlay: (media: any) => void;
  currentLang?: 'ku' | 'en';
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  item,
  onClose,
  onPlay,
  currentLang = 'ku',
}) => {
  if (!item) return null;

  const isKurdish = currentLang === 'ku';
  const isSeries = 'seasons' in item;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-900 shrink-0">
          <img
            src={isSeries ? (item as SeriesItem).cover : (item as VodMovie).stream_icon}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <div className="absolute bottom-6 right-6 left-6 flex items-end justify-between">
            <div>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 mb-2 inline-block">
                {isSeries ? (isKurdish ? 'زنجیرەی تیڤی' : 'TV Series') : (isKurdish ? 'فیلمی سینەمایی' : 'Movie')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {item.name}
              </h2>
            </div>
            
            {!isSeries && (
              <button
                onClick={() => onPlay(item)}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all shrink-0"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>{isKurdish ? 'پەخشکردن' : 'Play Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            {item.rating && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {item.rating} / 10
              </span>
            )}
            {item.year && (
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {item.year}
              </span>
            )}
            {'duration' in item && item.duration && (
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {item.duration}
              </span>
            )}
            {item.genre && (
              <span className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5" />
                {item.genre}
              </span>
            )}
          </div>

          {/* Plot / Synopsis */}
          {item.plot && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                {isKurdish ? 'کورتەی چیڕۆک' : 'Synopsis'}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {item.plot}
              </p>
            </div>
          )}

          {/* Series Episodes List */}
          {isSeries && item.seasons && item.seasons.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h4 className="text-sm font-bold text-white">
                {isKurdish ? 'ئەڵقەکان و وەرزەکان' : 'Seasons & Episodes'}
              </h4>
              {item.seasons.map((season) => (
                <div key={season.season_number} className="space-y-2">
                  <div className="text-xs font-semibold text-amber-400">
                    {season.name}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {season.episodes.map((ep: SeriesEpisode) => (
                      <button
                        key={ep.id}
                        onClick={() => onPlay({
                          ...ep,
                          stream_type: 'movie',
                          name: `${item.name} - ${ep.title}`,
                          stream_icon: (item as SeriesItem).cover,
                        })}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-start group transition-all"
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs font-medium text-slate-200 group-hover:text-amber-400 transition-colors">
                            {ep.title}
                          </div>
                          {ep.info?.duration && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {ep.info.duration}
                            </div>
                          )}
                        </div>
                        <Play className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:scale-110 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
