import React from 'react';
import { Volume2, VolumeX, RotateCcw, Download, Search, Sparkles, Cpu } from 'lucide-react';
import { sounds } from '../services/soundEffects';

interface HeaderProps {
  onOpenGameSelector: () => void;
  onOpenInstallModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
  isAnalyzing: boolean;
  analysisProgress: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGameSelector,
  onOpenInstallModal,
  soundEnabled,
  onToggleSound,
  isFlipped,
  onToggleFlip,
  isAnalyzing,
  analysisProgress,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-[#070A10]/90 backdrop-blur-xl px-4 py-2.5 transition">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/40">
            {/* Crown + Knight SVG */}
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-950 fill-current" strokeWidth="1.5">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5m14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-cyan-400 ring-2 ring-[#070A10]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold tracking-wider text-base sm:text-lg text-white font-mono flex items-center gap-1.5">
                AVELUX <span className="text-cyan-400 font-sans tracking-tight">GRAND</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                <Cpu className="h-3 w-3 text-emerald-400" />
                Stockfish 19
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xs:block">
              Centipawn Loss Game Reviewer
            </p>
          </div>
        </div>

        {/* Center / Progress info */}
        {isAnalyzing && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs text-cyan-300 font-mono">
              Reviewing with Stockfish 19: {analysisProgress}%
            </span>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Fetch Chess.com games */}
          <button
            onClick={onOpenGameSelector}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 active:scale-95 transition"
            title="Fetch Chess.com Games or Pick Masterpiece"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Select Game</span>
          </button>

          {/* Board flip toggle */}
          <button
            onClick={onToggleFlip}
            className={`rounded-xl p-2 text-xs border transition ${
              isFlipped
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Flip Board Perspective"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className={`rounded-xl p-2 text-xs border transition ${
              soundEnabled
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Install APK / PWA */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 px-2.5 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
            title="Install Avelux Grand APK / PWA"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Install APK</span>
          </button>
        </div>
      </div>
    </header>
  );
};
