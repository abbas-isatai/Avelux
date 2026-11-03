import React from 'react';

interface EvalBarProps {
  scoreCp: number; // in centipawns from White's perspective
  mate?: number; // mate in N from White's perspective
  isFlipped: boolean; // if true, Black is on bottom
}

export const EvalBar: React.FC<EvalBarProps> = ({ scoreCp, mate, isFlipped }) => {
  // Compute percentage fill for White (0% to 100%)
  let whitePercent = 50;

  if (mate !== undefined && mate !== 0) {
    // Mate
    whitePercent = mate > 0 ? 100 : 0;
  } else {
    // Sigmoid mapping for smooth, readable eval progression:
    // formula: 50 + 50 * (2 / (1 + exp(-0.004 * scoreCp)) - 1)
    const clampedCp = Math.max(-1500, Math.min(1500, scoreCp));
    const normalized = 2 / (1 + Math.exp(-0.0035 * clampedCp)) - 1;
    whitePercent = 50 + normalized * 48; // bounded within 2% to 98%
  }

  // Format the text label
  let displayScore = '0.0';
  let isWhiteLeading = scoreCp >= 0;

  if (mate !== undefined && mate !== 0) {
    displayScore = `M${Math.abs(mate)}`;
    isWhiteLeading = mate > 0;
  } else {
    const pawns = (Math.abs(scoreCp) / 100).toFixed(1);
    displayScore = scoreCp > 0 ? `+${pawns}` : scoreCp < 0 ? `-${pawns}` : '0.0';
  }

  // If flipped, Black is on bottom, so the bottom percentage represents Black's share
  const fillHeight = isFlipped ? 100 - whitePercent : whitePercent;

  return (
    <div className="relative flex flex-col items-center w-7 sm:w-8 h-full min-h-[320px] sm:min-h-[460px] md:min-h-[520px] rounded-xl overflow-hidden bg-[#0F172A] border border-slate-700/80 shadow-inner select-none transition-all duration-300">
      {/* Black's section (top when not flipped, bottom when flipped) */}
      <div
        className="w-full bg-[#090D16] transition-all duration-300 relative flex items-start justify-center pt-1.5"
        style={{ height: `${100 - fillHeight}%` }}
      >
        {/* Label when Black is clearly leading */}
        {((!isFlipped && !isWhiteLeading && whitePercent < 45) || (isFlipped && isWhiteLeading && whitePercent > 55)) && (
          <span className="text-[10px] font-mono font-bold tracking-tighter text-slate-400 px-1 py-0.5 rounded bg-black/40 backdrop-blur-xs">
            {displayScore}
          </span>
        )}
      </div>

      {/* Thin division indicator */}
      <div className="w-full h-0.5 bg-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.8)] z-10 shrink-0" />

      {/* White's section (bottom when not flipped, top when flipped) */}
      <div
        className="w-full bg-gradient-to-t from-slate-100 to-slate-200 text-slate-900 transition-all duration-300 relative flex items-end justify-center pb-1.5 shadow-sm"
        style={{ height: `${fillHeight}%` }}
      >
        {/* Label when White is clearly leading or even */}
        {((!isFlipped && isWhiteLeading && whitePercent >= 45) || (isFlipped && !isWhiteLeading && whitePercent <= 55)) && (
          <span className="text-[10px] font-mono font-bold tracking-tighter text-slate-900 px-1 py-0.5 rounded bg-white/70 backdrop-blur-xs">
            {displayScore}
          </span>
        )}
      </div>

      {/* Center 0.0 marker tick */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[1px] bg-slate-500/40 pointer-events-none" />
    </div>
  );
};
