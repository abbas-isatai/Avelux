import React from 'react';
import { Volume2, VolumeX, RotateCcw, Download, Cpu, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenInstallModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
  isAnalyzing: boolean;
  analysisProgress: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInstallModal,
  soundEnabled,
  onToggleSound,
  isFlipped,
  onToggleFlip,
  isAnalyzing,
  analysisProgress,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070A10]/95 backdrop-blur-md px-3 sm:px-6 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/40 shrink-0">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-950 fill-current" strokeWidth="1.5">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-cyan-400 ring-2 ring-[#070A10]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base sm:text-lg text-white font-mono flex items-center gap-1">
                AVELUX <span className="text-cyan-400 font-sans tracking-tight">GRAND</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <Cpu className="h-3 w-3 text-emerald-400" />
                Stockfish 19
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Centipawn Loss Game Reviewer
            </p>
          </div>
        </div>

        {/* Real-time Analysis Progress Pill */}
        {isAnalyzing ? (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono text-cyan-300 font-bold">
              Reviewing: {analysisProgress}%
            </span>
            <div className="w-16 sm:w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-150"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>0 CP = Best • &lt;15 CP Sacrifice = Brilliant • &gt;201 CP = Blunder</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Flip Board */}
          <button
            onClick={onToggleFlip}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition ${
              isFlipped
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Flip Board (Hotkey: F)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isFlipped ? 'Black' : 'White'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`rounded-xl p-2 text-xs border transition ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Download / Install APK */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/25 active:scale-95 transition"
            title="Download signed APK or Install PWA"
          >
            <Download className="h-3.5 w-3.5" />
            <span>APK</span>
          </button>
        </div>
      </div>
    </header>
  );
};
