import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Zap,
  Award,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Cpu,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import {
  MoveReview,
  GameReviewResult,
  ChessComGame,
  CLASSIFICATIONS_CONFIG,
  MoveClassification,
} from '../types/chess';

interface GameReviewPanelProps {
  game: ChessComGame;
  reviewResult: GameReviewResult | null;
  currentPly: number;
  onSelectPly: (ply: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onJumpToNextError: () => void;
  onJumpToNextBrilliant: () => void;
}

export const GameReviewPanel: React.FC<GameReviewPanelProps> = ({
  game,
  reviewResult,
  currentPly,
  onSelectPly,
  isPlaying,
  onTogglePlay,
  onJumpToNextError,
  onJumpToNextBrilliant,
}) => {
  const [activeTab, setActiveTab] = useState<'review' | 'moves' | 'stats'>('review');

  const moves = reviewResult?.moves || [];
  const currentMove = currentPly > 0 && currentPly <= moves.length ? moves[currentPly - 1] : null;
  const currentBadge = currentMove ? CLASSIFICATIONS_CONFIG[currentMove.classification] : null;

  // Format eval in pawns
  const formatEval = (cp: number) => {
    const val = (Math.abs(cp) / 100).toFixed(1);
    return cp > 0 ? `+${val}` : cp < 0 ? `-${val}` : '0.0';
  };

  return (
    <div className="flex flex-col w-full h-full max-h-[720px] bg-gradient-to-b from-[#0F172A] to-[#0A0D14] rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-100">
      {/* Player header strip */}
      <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          {/* White player */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-white/20">
              W
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate text-white">
                {game.white.username}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {game.white.rating} • {game.white.result}
              </div>
            </div>
          </div>

          {/* VS / Time format */}
          <div className="flex flex-col items-center px-2 shrink-0">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              {game.timeControl}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">VS</span>
          </div>

          {/* Black player */}
          <div className="flex items-center gap-2 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <div className="text-xs font-bold truncate text-white">
                {game.black.username}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {game.black.rating} • {game.black.result}
              </div>
            </div>
            <div className="h-7 w-7 rounded-lg bg-[#050811] border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-slate-800">
              B
            </div>
          </div>
        </div>

        {/* Accuracy % Comparison Bar if review ready */}
        {reviewResult && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs font-mono font-semibold mb-1">
              <span className="text-emerald-400">{reviewResult.white.accuracy}% Accuracy</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-bold">
                CAPS Evaluation
              </span>
              <span className="text-cyan-400">{reviewResult.black.accuracy}% Accuracy</span>
            </div>
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800 p-0.5 gap-0.5">
              <div
                className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${reviewResult.white.accuracy / (reviewResult.white.accuracy + reviewResult.black.accuracy) * 100}%` }}
              />
              <div
                className="h-full rounded-r-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                style={{ width: `${reviewResult.black.accuracy / (reviewResult.white.accuracy + reviewResult.black.accuracy) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-slate-800/80 bg-slate-900/40 px-2 pt-1">
        <button
          onClick={() => setActiveTab('review')}
          className={`flex-1 py-2 text-xs font-semibold transition border-b-2 ${
            activeTab === 'review'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Analysis
        </button>
        <button
          onClick={() => setActiveTab('moves')}
          className={`flex-1 py-2 text-xs font-semibold transition border-b-2 ${
            activeTab === 'moves'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Moves ({moves.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 text-xs font-semibold transition border-b-2 ${
            activeTab === 'stats'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Move Stats
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {activeTab === 'review' && (
          <div className="space-y-3.5">
            {/* Current Move Focus Card */}
            {currentMove && currentBadge ? (
              <div
                className={`relative rounded-xl p-3.5 border transition-all ${currentBadge.bgColor} ${currentBadge.borderColor} ${currentBadge.glowColor}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg font-black text-sm border shadow-md ${currentBadge.borderColor} ${currentBadge.textColor} bg-slate-950/80`}
                    >
                      {currentBadge.symbol}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {currentMove.moveNumber}.{currentMove.color === 'b' ? '..' : ''} {currentMove.san}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${currentBadge.textColor}`}>
                          {currentBadge.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono flex items-center gap-2 mt-0.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            currentMove.cpLoss === 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : currentMove.cpLoss <= 15
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              : currentMove.cpLoss <= 40
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : currentMove.cpLoss <= 100
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {currentMove.cpLoss} CP Loss
                        </span>
                        <span>Eval: {formatEval(currentMove.evalAfter)}</span>
                      </div>
                    </div>
                  </div>

                  {currentMove.isSacrifice && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-[10px] font-bold shrink-0 animate-pulse">
                      <Flame className="h-3 w-3 text-cyan-400" />
                      Piece Sacrifice
                    </div>
                  )}
                </div>

                {/* Stockfish 19 Recommendation line */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                      Stockfish 19 Choice:
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {currentMove.bestMoveSan || currentMove.bestMoveUci}
                    </span>
                  </div>

                  {/* Engine line PV */}
                  {currentMove.pvLine && currentMove.pvLine.length > 0 && (
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-300 truncate">
                      <span className="text-slate-500 mr-1.5 font-sans font-semibold">Best Line:</span>
                      {currentMove.pvLine.slice(0, 5).join(' ')}
                    </div>
                  )}

                  {/* Clean reviewer rule context */}
                  <div className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                    {currentBadge.description}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center rounded-xl bg-slate-900/50 border border-slate-800/80 text-slate-400 text-xs">
                Navigate moves or press <strong className="text-white">Play</strong> to start the Stockfish 19 review.
              </div>
            )}

            {/* Quick jump buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onJumpToNextError}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition active:scale-[0.98]"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Next Blunder / Mistake</span>
              </button>
              <button
                onClick={onJumpToNextBrilliant}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition active:scale-[0.98]"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Next Brilliant (!!)</span>
              </button>
            </div>

            {/* Mini Eval Advantage Trendline */}
            {reviewResult && reviewResult.evalGraph && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                    Advantage Trend
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    Move {currentPly} of {moves.length}
                  </span>
                </div>
                <div className="h-14 w-full flex items-center gap-[2px] pt-1">
                  {reviewResult.evalGraph.map((item, idx) => {
                    const clamped = Math.max(-800, Math.min(800, item.evalWhite));
                    const heightPercent = Math.min(100, Math.max(8, (Math.abs(clamped) / 800) * 100));
                    const isPositive = clamped >= 0;
                    const isCurrent = idx === currentPly;

                    return (
                      <button
                        key={idx}
                        onClick={() => onSelectPly(idx)}
                        className={`flex-1 flex flex-col justify-center items-center h-full group relative transition-transform ${
                          isCurrent ? 'scale-125 z-10' : 'hover:scale-110'
                        }`}
                        title={`Ply ${idx}: ${formatEval(item.evalWhite)}`}
                      >
                        <div
                          className={`w-full rounded-xs transition-colors ${
                            isCurrent
                              ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]'
                              : isPositive
                              ? 'bg-slate-300 group-hover:bg-white'
                              : 'bg-slate-700 group-hover:bg-slate-500'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Moves Tab */}
        {activeTab === 'moves' && (
          <div className="space-y-1 font-mono text-xs">
            {moves.reduce<Array<{ moveNum: number; white?: MoveReview; black?: MoveReview }>>((acc, move) => {
              if (move.color === 'w') {
                acc.push({ moveNum: move.moveNumber, white: move });
              } else {
                if (acc.length === 0 || acc[acc.length - 1].black) {
                  acc.push({ moveNum: move.moveNumber, black: move });
                } else {
                  acc[acc.length - 1].black = move;
                }
              }
              return acc;
            }, []).map((turn) => {
              const isWhiteCurrent = turn.white && turn.white.ply === currentPly;
              const isBlackCurrent = turn.black && turn.black.ply === currentPly;

              return (
                <div
                  key={turn.moveNum}
                  className="grid grid-cols-[36px_1fr_1fr] items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-800/40 transition"
                >
                  <span className="text-slate-500 font-semibold">{turn.moveNum}.</span>

                  {/* White Move */}
                  {turn.white ? (
                    <button
                      onClick={() => onSelectPly(turn.white!.ply)}
                      className={`flex items-center justify-between px-2 py-1 rounded text-left transition ${
                        isWhiteCurrent
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-xs'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span>{turn.white.san}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-black ${
                          CLASSIFICATIONS_CONFIG[turn.white.classification].textColor
                        }`}
                      >
                        {CLASSIFICATIONS_CONFIG[turn.white.classification].symbol}
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}

                  {/* Black Move */}
                  {turn.black ? (
                    <button
                      onClick={() => onSelectPly(turn.black!.ply)}
                      className={`flex items-center justify-between px-2 py-1 rounded text-left transition ${
                        isBlackCurrent
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-xs'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span>{turn.black.san}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-black ${
                          CLASSIFICATIONS_CONFIG[turn.black.classification].textColor
                        }`}
                      >
                        {CLASSIFICATIONS_CONFIG[turn.black.classification].symbol}
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Move Classification Statistics Tab */}
        {activeTab === 'stats' && reviewResult && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-cyan-400" />
              Stockfish 19 Move Breakdown
            </div>

            <div className="space-y-1.5">
              {(
                [
                  'brilliant',
                  'great',
                  'best',
                  'excellent',
                  'good',
                  'inaccuracy',
                  'mistake',
                  'blunder',
                  'book',
                ] as MoveClassification[]
              ).map((type) => {
                const meta = CLASSIFICATIONS_CONFIG[type];
                const whiteCount = reviewResult.white[type] || 0;
                const blackCount = reviewResult.black[type] || 0;

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-extrabold text-[11px] border ${meta.bgColor} ${meta.borderColor} ${meta.textColor}`}
                      >
                        {meta.symbol}
                      </span>
                      <span className="font-medium text-slate-200">{meta.label}</span>
                    </div>

                    <div className="flex items-center gap-4 font-mono font-bold">
                      <span className="text-slate-300 w-6 text-right">{whiteCount}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-300 w-6 text-right">{blackCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Average Centipawn Loss */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Avg Centipawn Loss (ACPL)</span>
              <div className="flex items-center gap-4 font-mono font-bold">
                <span className="text-emerald-400">{reviewResult.white.avgCpLoss} CP</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400">{reviewResult.black.avgCpLoss} CP</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Playback & Navigation Controls at bottom */}
      <div className="p-3 border-t border-slate-800 bg-[#090D16] flex items-center justify-between gap-1 sm:gap-2">
        <button
          onClick={() => onSelectPly(0)}
          disabled={currentPly <= 0}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
          title="Start of game"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={() => onSelectPly(Math.max(0, currentPly - 1))}
          disabled={currentPly <= 0}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
          title="Previous move (Left arrow)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="flex-1 max-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isPlaying ? 'Pause' : 'Review'}</span>
        </button>

        <button
          onClick={() => onSelectPly(Math.min(moves.length, currentPly + 1))}
          disabled={currentPly >= moves.length}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
          title="Next move (Right arrow)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => onSelectPly(moves.length)}
          disabled={currentPly >= moves.length}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition"
          title="End of game"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
