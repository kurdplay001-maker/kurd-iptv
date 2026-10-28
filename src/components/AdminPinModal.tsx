import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  currentLang?: 'ku' | 'en';
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentLang = 'ku',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isKurdish = currentLang === 'ku';

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        onSuccess(pin.trim());
      } else {
        setError(data.error || (isKurdish ? 'کۆدی نهێنی هەڵەیە' : 'Incorrect Admin PIN'));
      }
    } catch {
      setError(isKurdish ? 'پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو' : 'Server connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-white">
            {isKurdish ? 'کۆنتڕۆڵی بەڕێوەبەر' : 'Admin Security Access'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isKurdish
              ? 'تەنها خاوەنی بەرنامە دەتوانێت سێرڤەر بگۆڕێت. کۆدی نهێنی (Master PIN) بنووسە:'
              : 'Enter Master PIN to access centralized server management:'}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN Code (Default: 7788)"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-base tracking-widest text-white focus:outline-none focus:border-amber-400"
                autoFocus
                required
              />
            </div>
            <div className="text-[10px] text-slate-500 text-center mt-1">
              {isKurdish ? 'کۆدی پێشوەختە: 7788' : 'Default PIN: 7788'}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              {isKurdish ? 'پەشیمانبوونەوە' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isLoading ? (isKurdish ? 'پشکنین...' : 'Checking...') : (isKurdish ? 'چوونەژوورەوە' : 'Unlock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
