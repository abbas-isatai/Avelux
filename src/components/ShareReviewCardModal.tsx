import React, { useRef, useState } from 'react';
import { X, Download, Share2, Copy, Check, FileText } from 'lucide-react';
import { ChessComGame, GameReviewResult, CLASSIFICATIONS_CONFIG } from '../types/chess';

interface ShareReviewCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: ChessComGame;
  reviewResult: GameReviewResult;
}

export const ShareReviewCardModal: React.FC<ShareReviewCardModalProps> = ({
  isOpen,
  onClose,
  game,
  reviewResult,
}) => {
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const white = reviewResult.white;
  const black = reviewResult.black;

  // Generate Annotated PGN with Stockfish evaluations and tactical comments
  const generateAnnotatedPgn = (): string => {
    let pgn = `[Event "${game.timeControl || 'Casual Game'}"]\n`;
    pgn += `[Site "Avelux Grand Reviewer"]\n`;
    pgn += `[Date "${game.dateStr || new Date().toISOString().slice(0, 10)}"]\n`;
    pgn += `[White "${game.white.username}"]\n`;
    pgn += `[Black "${game.black.username}"]\n`;
    pgn += `[WhiteElo "${game.white.rating}"]\n`;
    pgn += `[BlackElo "${game.black.rating}"]\n`;
    pgn += `[Result "${game.white.result === 'win' ? '1-0' : game.black.result === 'win' ? '0-1' : '1/2-1/2'}"]\n`;
    if (reviewResult.opening) {
      pgn += `[ECO "${reviewResult.opening.eco}"]\n`;
      pgn += `[Opening "${reviewResult.opening.name}${reviewResult.opening.variation ? ': ' + reviewResult.opening.variation : ''}"]\n`;
    }
    pgn += `[Annotator "Stockfish 19 (Avelux Grand)"]\n`;
    pgn += `[WhiteAccuracy "${white.accuracy}% (Est. ELO ${white.estimatedElo})"]\n`;
    pgn += `[BlackAccuracy "${black.accuracy}% (Est. ELO ${black.estimatedElo})"]\n\n`;

    // Format moves
    const moves = reviewResult.moves;
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const wMove = moves[i];
      const bMove = moves[i + 1];

      pgn += `${moveNum}. ${wMove.san} `;

      // White annotation
      const wEvalStr = (wMove.evalAfter / 100).toFixed(2);
      const wEvalSign = wMove.evalAfter >= 0 ? `+${wEvalStr}` : wEvalStr;
      const wSymbol = CLASSIFICATIONS_CONFIG[wMove.classification].symbol;

      let wComment = `[%eval ${wEvalSign}] ${wSymbol}`;
      if (wMove.classification === 'blunder' || wMove.classification === 'mistake' || wMove.classification === 'miss') {
        wComment += ` (Stockfish best was ${wMove.bestMoveSan})`;
        if (wMove.opponentThreatSan) {
          wComment += ` [Refutation: ${wMove.opponentThreatSan}]`;
        }
      }
      pgn += `{ ${wComment} } `;

      if (bMove) {
        pgn += `${bMove.san} `;
        const bEvalStr = (bMove.evalAfter / 100).toFixed(2);
        const bEvalSign = bMove.evalAfter >= 0 ? `+${bEvalStr}` : bEvalStr;
        const bSymbol = CLASSIFICATIONS_CONFIG[bMove.classification].symbol;

        let bComment = `[%eval ${bEvalSign}] ${bSymbol}`;
        if (bMove.classification === 'blunder' || bMove.classification === 'mistake' || bMove.classification === 'miss') {
          bComment += ` (Stockfish best was ${bMove.bestMoveSan})`;
          if (bMove.opponentThreatSan) {
            bComment += ` [Refutation: ${bMove.opponentThreatSan}]`;
          }
        }
        pgn += `{ ${bComment} } `;
      }

      if (moveNum % 3 === 0) pgn += '\n';
    }

    const endResult = game.white.result === 'win' ? '1-0' : game.black.result === 'win' ? '0-1' : '1/2-1/2';
    pgn += ` ${endResult}\n`;
    return pgn;
  };

  const downloadPgn = () => {
    const pgn = generateAnnotatedPgn();
    const blob = new Blob([pgn], { type: 'application/x-chess-pgn;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${game.white.username}_vs_${game.black.username}_avelux_review.pgn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyPgnToClipboard = () => {
    const pgn = generateAnnotatedPgn();
    navigator.clipboard.writeText(pgn);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const copyCardToClipboard = () => {
    const text = `🏆 Avelux Grand Game Review (Stockfish 19)
⚔️ ${game.white.username} (${game.white.rating}) vs ${game.black.username} (${game.black.rating})
📖 Opening: ${reviewResult.opening ? `${reviewResult.opening.eco} ${reviewResult.opening.name}` : 'Custom'}
⚪ White CAPS: ${white.accuracy}% (Est. ELO ${white.estimatedElo})
⚫ Black CAPS: ${black.accuracy}% (Est. ELO ${black.estimatedElo})
🎯 Brilliant: ⚪ ${white.brilliant} | ⚫ ${black.brilliant}
🔥 Blunders: ⚪ ${white.blunder} | ⚫ ${black.blunder}
⚡ Key Moments: ${reviewResult.keyMomentPlies?.length || 0} turning points`;

    navigator.clipboard.writeText(text);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#181F2C] to-[#0E121A] border border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-lg text-white">Share Game Review</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shareable Card Graphic Preview */}
        <div
          ref={cardRef}
          className="relative rounded-2xl bg-[#0F141D] border-2 border-emerald-500/40 p-5 shadow-2xl flex flex-col gap-4 overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold tracking-wider text-emerald-400 uppercase text-[10px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Stockfish 19 Game Review
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{game.dateStr}</span>
          </div>

          {/* Opening badge */}
          {reviewResult.opening && (
            <div className="bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700/60 flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs font-mono">{reviewResult.opening.eco}</span>
              <span className="text-slate-200 text-xs font-medium truncate">
                {reviewResult.opening.name}
                {reviewResult.opening.variation ? ` • ${reviewResult.opening.variation}` : ''}
              </span>
            </div>
          )}

          {/* Match Players & Dual Accuracy Display */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            {/* White */}
            <div className="flex flex-col items-center text-center gap-1 border-r border-slate-800 pr-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold truncate max-w-full">
                <span className="w-3 h-3 rounded-full bg-white border border-slate-400 inline-block shrink-0" />
                <span className="truncate">{game.white.username}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">({game.white.rating})</span>
              <div className="text-3xl font-black text-white tracking-tight mt-1">{white.accuracy}%</div>
              <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Coach ELO: {white.estimatedElo}
              </div>
            </div>

            {/* Black */}
            <div className="flex flex-col items-center text-center gap-1 pl-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold truncate max-w-full">
                <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600 inline-block shrink-0" />
                <span className="truncate">{game.black.username}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">({game.black.rating})</span>
              <div className="text-3xl font-black text-white tracking-tight mt-1">{black.accuracy}%</div>
              <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Coach ELO: {black.estimatedElo}
              </div>
            </div>
          </div>

          {/* Classification Stats Breakdown */}
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-1.5 rounded-lg">
              <div className="text-cyan-400 font-bold text-xs">{white.brilliant} | {black.brilliant}</div>
              <div className="text-slate-400 font-medium mt-0.5">Brilliant !!</div>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-1.5 rounded-lg">
              <div className="text-indigo-400 font-bold text-xs">{white.great} | {black.great}</div>
              <div className="text-slate-400 font-medium mt-0.5">Great !</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-1.5 rounded-lg">
              <div className="text-emerald-400 font-bold text-xs">{white.best} | {black.best}</div>
              <div className="text-slate-400 font-medium mt-0.5">Best ★</div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-lg">
              <div className="text-rose-400 font-bold text-xs">{white.miss} | {black.miss}</div>
              <div className="text-slate-400 font-medium mt-0.5">Miss ✕</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 p-1.5 rounded-lg">
              <div className="text-red-400 font-bold text-xs">{white.blunder} | {black.blunder}</div>
              <div className="text-slate-400 font-medium mt-0.5">Blunder ??</div>
            </div>
          </div>

          {/* Coach Note */}
          <p className="text-[11px] text-slate-300 italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
            "{white.coachSummary || black.coachSummary || 'An intense battle evaluated by Stockfish 19.'}"
          </p>

          {/* Footer watermark */}
          <div className="text-center text-[10px] text-slate-500 font-mono">
            Analyzed with Avelux Grand • Offline Chess Reviewer
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={copyCardToClipboard}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            {copiedCard ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copiedCard ? 'Card Text Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={downloadPgn}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
          >
            <Download className="h-4 w-4" />
            <span>Download Annotated PGN</span>
          </button>
        </div>

        <button
          onClick={copyPgnToClipboard}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
        >
          <FileText className="h-3.5 w-3.5 text-cyan-400" />
          <span>{copiedPgn ? 'PGN Copied to Clipboard!' : 'Copy Annotated PGN to Clipboard'}</span>
        </button>
      </div>
    </div>
  );
};
