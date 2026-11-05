import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Zap,
  AlertTriangle,
  Flame,
  Cpu,
  BarChart2,
  TrendingUp,
  Layers,
  Crosshair,
  ShieldAlert,
  Share2,
  Settings,
  BookOpen,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Award,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  MoveReview,
  GameReviewResult,
  ChessComGame,
  CLASSIFICATIONS_CONFIG,
  MoveClassification,
} from '../types/chess';
import { sounds, SoundPack } from '../services/soundEffects';

interface GameReviewPanelProps {
  game: ChessComGame;
  reviewResult: GameReviewResult | null;
  currentPly: number;
  onSelectPly: (ply: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onJumpToNextError: () => void;
  onJumpToNextBrilliant: () => void;
  // Threat Arrow
  showOpponentThreat: boolean;
  onToggleOpponentThreat: () => void;
  // Interactive Retry Mode
  isRetrying: boolean;
  onStartRetry: () => void;
  onCancelRetry: () => void;
  onShowHint: () => void;
  onRevealBestMove: () => void;
  retryStatus: 'idle' | 'success' | 'incorrect';
  retryFeedback: string;
  // Depth & Sound Settings
  analysisDepth: number;
  onChangeDepth: (depth: number) => void;
  onOpenShareModal: () => void;
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
  showOpponentThreat,
  onToggleOpponentThreat,
  isRetrying,
  onStartRetry,
  onCancelRetry,
  onShowHint,
  onRevealBestMove,
  retryStatus,
  retryFeedback,
  analysisDepth,
  onChangeDepth,
  onOpenShareModal,
}) => {
  const [activeTab, setActiveTab] = useState<'review' | 'keymoments' | 'moves' | 'stats'>('review');
  const [showSettings, setShowSettings] = useState(false);
  const [soundPack, setSoundPack] = useState<SoundPack>(sounds.soundPack);

  const moves = reviewResult?.moves || [];
  const currentMove = currentPly > 0 && currentPly <= moves.length ? moves[currentPly - 1] : null;
  const currentBadge = currentMove ? CLASSIFICATIONS_CONFIG[currentMove.classification] : null;

  const isCurrentError =
    currentMove &&
    (currentMove.classification === 'blunder' ||
      currentMove.classification === 'mistake' ||
      currentMove.classification === 'miss' ||
      currentMove.classification === 'inaccuracy');

  const formatEval = (cp: number) => {
    const val = (Math.abs(cp) / 100).toFixed(1);
    return cp > 0 ? `+${val}` : cp < 0 ? `-${val}` : '0.0';
  };

  const handleSoundPackChange = (pack: SoundPack) => {
    setSoundPack(pack);
    sounds.setSoundPack(pack);
    sounds.playMove();
  };

  // Extract key moments list
  const keyMomentMoves = React.useMemo(() => {
    if (!reviewResult) return [];
    const plies = reviewResult.keyMomentPlies || [];
    return plies
      .map((p) => reviewResult.moves[p - 1])
      .filter((m): m is MoveReview => !!m);
  }, [reviewResult]);

  return (
    <div className="flex flex-col w-full h-full max-h-[780px] bg-[#0B0F17] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
      {/* 1. Player Matchup & Accuracy Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          {/* White Player */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 ring-2 ring-white/20 shadow-md">
              W
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold truncate text-white">
                {game.white.username}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {game.white.rating}
                {reviewResult && (
                  <span className="text-emerald-400 font-bold ml-1.5">
                    (Est. {reviewResult.white.estimatedElo})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Tools: Share & Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenShareModal}
              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition"
              title="Share Review Card & Download Annotated PGN"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
              title="Review Engine Settings & Depth"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Black Player */}
          <div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold truncate text-white">
                {game.black.username}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {game.black.rating}
                {reviewResult && (
                  <span className="text-cyan-400 font-bold ml-1.5">
                    (Est. {reviewResult.black.estimatedElo})
                  </span>
                )}
              </div>
            </div>
            <div className="h-8 w-8 rounded-xl bg-[#030712] border border-slate-700 text-slate-200 font-black flex items-center justify-center text-xs shrink-0 ring-2 ring-slate-800 shadow-md">
              B
            </div>
          </div>
        </div>

        {/* Opening Name & ECO Code Banner */}
        {reviewResult?.opening && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="font-mono font-bold text-amber-400 text-[11px]">{reviewResult.opening.eco}</span>
              <span className="font-medium text-[11px] truncate text-slate-200">
                {reviewResult.opening.name}
                {reviewResult.opening.variation ? `: ${reviewResult.opening.variation}` : ''}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider shrink-0 ml-2">
              {game.timeControl}
            </span>
          </div>
        )}

        {/* Settings Flyout Drawer */}
        {showSettings && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 animate-fade-in text-xs">
            {/* Analysis Depth Selector */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                Stockfish 19 Depth:
              </span>
              <div className="flex items-center gap-1">
                {[
                  { depth: 8, label: 'Fast (8)' },
                  { depth: 10, label: 'Standard (10)' },
                  { depth: 14, label: 'Deep (14)' },
                ].map((d) => (
                  <button
                    key={d.depth}
                    onClick={() => onChangeDepth(d.depth)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                      analysisDepth === d.depth
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Pack Selector */}
            <div className="flex items-center justify-between border-t border-slate-900 pt-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                Sound Pack:
              </span>
              <div className="flex items-center gap-1">
                {(['chesscom', 'lichess', 'mechanical', 'retro'] as SoundPack[]).map((pack) => (
                  <button
                    key={pack}
                    onClick={() => handleSoundPackChange(pack)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition ${
                      soundPack === pack
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pack}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CAPS Accuracy Meters */}
        {reviewResult && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
              <span className="text-emerald-400 font-extrabold text-sm">
                {reviewResult.white.accuracy}% <span className="text-[10px] font-sans text-slate-400 font-normal">Accuracy</span>
              </span>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400">
                CAPS Score
              </span>
              <span className="text-cyan-400 font-extrabold text-sm">
                <span className="text-[10px] font-sans text-slate-400 font-normal">Accuracy</span> {reviewResult.black.accuracy}%
              </span>
            </div>
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-950 p-0.5 gap-1 border border-slate-800">
              <div
                className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${(reviewResult.white.accuracy / (reviewResult.white.accuracy + reviewResult.black.accuracy)) * 100}%`,
                }}
              />
              <div
                className="h-full rounded-r-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                style={{
                  width: `${(reviewResult.black.accuracy / (reviewResult.white.accuracy + reviewResult.black.accuracy)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Clean Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-[#070A10] px-2 pt-1 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 shrink-0 transition ${
            activeTab === 'review'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Move Review</span>
        </button>

        <button
          onClick={() => setActiveTab('keymoments')}
          className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 shrink-0 transition ${
            activeTab === 'keymoments'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Key Moments ({keyMomentMoves.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moves')}
          className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 shrink-0 transition ${
            activeTab === 'moves'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All Moves ({moves.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 shrink-0 transition ${
            activeTab === 'stats'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Stats & Coach</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
        {/* Tab 1: Current Move Analysis */}
        {activeTab === 'review' && (
          <div className="space-y-3.5">
            {/* Active Move Card */}
            {currentMove && currentBadge ? (
              <div
                className={`relative rounded-2xl p-4 border transition-all ${currentBadge.bgColor} ${currentBadge.borderColor} ${currentBadge.glowColor} bg-[#0E1524]`}
              >
                {/* Header: Badge + Move SAN */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-xl font-black text-base border shadow-lg ${currentBadge.borderColor} ${currentBadge.textColor} bg-slate-950`}
                    >
                      {currentBadge.symbol}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-white font-mono">
                          {currentMove.moveNumber}.{currentMove.color === 'b' ? '..' : ''} {currentMove.san}
                        </span>
                        <span className={`text-xs font-black uppercase tracking-wider ${currentBadge.textColor}`}>
                          {currentBadge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            currentMove.cpLoss === 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : currentMove.cpLoss <= 15
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              : currentMove.cpLoss <= 40
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : currentMove.cpLoss <= 100
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : currentMove.cpLoss <= 200
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {currentMove.cpLoss} CP Loss
                        </span>
                        <span className="text-slate-300">
                          Eval: {formatEval(currentMove.evalAfter)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {currentMove.isSacrifice && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-black shadow-md shadow-cyan-500/20 animate-pulse">
                      <Flame className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Sacrifice</span>
                    </div>
                  )}
                </div>

                {/* Stockfish 19 Recommendation */}
                <div className="mt-3.5 pt-3 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 font-medium">
                      <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                      Stockfish 19 Best Move:
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {currentMove.bestMoveSan || currentMove.bestMoveUci}
                    </span>
                  </div>

                  {/* Engine Continuation Line */}
                  {currentMove.pvLine && currentMove.pvLine.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 truncate">
                      <span className="text-slate-500 font-sans font-bold mr-1.5">Engine Line:</span>
                      {currentMove.pvLine.slice(0, 6).join(' ')}
                    </div>
                  )}

                  {/* Move Description */}
                  <div className="text-xs text-slate-300 pt-0.5 leading-relaxed">
                    {currentBadge.description}
                  </div>
                </div>

                {/* Threat Refutation preview if available */}
                {currentMove.opponentThreatSan && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                      <span>Opponent Refutation:</span>
                      <span className="font-mono font-bold text-red-400">{currentMove.opponentThreatSan}</span>
                    </div>

                    <button
                      onClick={onToggleOpponentThreat}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        showOpponentThreat
                          ? 'bg-red-500/30 border-red-500 text-red-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {showOpponentThreat ? 'Hide Threat Arrow' : 'Show Threat Arrow'}
                    </button>
                  </div>
                )}

                {/* Interactive Retry Prompt for Blunders/Mistakes/Misses */}
                {isCurrentError && (
                  <div className="mt-3.5 pt-3 border-t border-slate-700/60 space-y-2">
                    {!isRetrying ? (
                      <button
                        onClick={onStartRetry}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 active:scale-98 transition"
                      >
                        <Crosshair className="h-4 w-4" />
                        <span>Retry Move: Can You Find the Best Move?</span>
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/50 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                            <Crosshair className="h-4 w-4 animate-spin text-amber-400" />
                            Find Stockfish's Move
                          </span>
                          <button
                            onClick={onCancelRetry}
                            className="text-[11px] text-slate-400 hover:text-white transition"
                          >
                            Exit Retry
                          </button>
                        </div>

                        {retryStatus === 'idle' && (
                          <p className="text-xs text-slate-300">
                            Move the piece directly on the board to test your candidate line!
                          </p>
                        )}

                        {retryStatus === 'success' && (
                          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>
                              <strong>Brilliant find!</strong> That was Stockfish's best move!
                            </span>
                          </div>
                        )}

                        {retryStatus === 'incorrect' && (
                          <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500 text-rose-300 text-xs flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                            <span>
                              <strong>Incorrect!</strong> {retryFeedback || 'That move does not solve the tactical issue.'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={onShowHint}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[11px] font-bold border border-slate-800 transition"
                          >
                            <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Show Hint</span>
                          </button>
                          <button
                            onClick={onRevealBestMove}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-[11px] font-bold border border-slate-800 transition"
                          >
                            <span>Reveal Best Move</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs space-y-2">
                <div className="font-semibold text-slate-200">Start of Game (Move 0)</div>
                <div>Press <strong>Next</strong> or <strong>Auto Play</strong> to review the first move with Stockfish 19.</div>
              </div>
            )}

            {/* Quick Action Shortcuts: Next Blunder / Next Brilliant */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onJumpToNextError}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition active:scale-95 shadow-sm"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Next Error / Blunder</span>
              </button>
              <button
                onClick={onJumpToNextBrilliant}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition active:scale-95 shadow-sm"
              >
                <Zap className="h-4 w-4" />
                <span>Next Brilliant (!!)</span>
              </button>
            </div>

            {/* Interactive Advantage Graph */}
            {reviewResult && reviewResult.evalGraph && (
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    Advantage Progression
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Move {currentPly} / {moves.length}
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
                        title={`Move ${idx}: ${formatEval(item.evalWhite)}`}
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

        {/* Tab 2: Key Moments (Storyline) */}
        {activeTab === 'keymoments' && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Decisive Turning Points ({keyMomentMoves.length})
            </div>

            {keyMomentMoves.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                No major tactical turning points detected. Both players maintained high accuracy!
              </div>
            ) : (
              keyMomentMoves.map((m) => {
                const badge = CLASSIFICATIONS_CONFIG[m.classification];
                const isSelected = m.ply === currentPly;

                return (
                  <button
                    key={m.ply}
                    onClick={() => onSelectPly(m.ply)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40'
                        : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border shrink-0 ${badge.bgColor} ${badge.borderColor} ${badge.textColor}`}
                      >
                        {badge.symbol}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                          <span>
                            {m.moveNumber}.{m.color === 'b' ? '..' : ''} {m.san}
                          </span>
                          <span className={`text-[10px] font-sans font-bold uppercase ${badge.textColor}`}>
                            • {badge.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          Eval: {formatEval(m.evalAfter)} • Best was {m.bestMoveSan}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-400">Ply {m.ply}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Full Move List */}
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
                  className="grid grid-cols-[38px_1fr_1fr] items-center gap-1.5 py-1 px-2 rounded-xl hover:bg-slate-800/40 transition"
                >
                  <span className="text-slate-500 font-bold">{turn.moveNum}.</span>

                  {turn.white ? (
                    <button
                      onClick={() => onSelectPly(turn.white!.ply)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                        isWhiteCurrent
                          ? 'bg-cyan-500/25 text-cyan-300 font-black border border-cyan-400 shadow-md'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold">{turn.white.san}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                          CLASSIFICATIONS_CONFIG[turn.white.classification].textColor
                        } ${CLASSIFICATIONS_CONFIG[turn.white.classification].bgColor}`}
                      >
                        {CLASSIFICATIONS_CONFIG[turn.white.classification].symbol}
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}

                  {turn.black ? (
                    <button
                      onClick={() => onSelectPly(turn.black!.ply)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                        isBlackCurrent
                          ? 'bg-cyan-500/25 text-cyan-300 font-black border border-cyan-400 shadow-md'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold">{turn.black.san}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                          CLASSIFICATIONS_CONFIG[turn.black.classification].textColor
                        } ${CLASSIFICATIONS_CONFIG[turn.black.classification].bgColor}`}
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

        {/* Tab 4: Move Classification Stats & Coach Persona */}
        {activeTab === 'stats' && reviewResult && (
          <div className="space-y-3.5">
            {/* Coach ELO Ratings */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Performance Rating (Coach ELO)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">White Est. Rating</div>
                  <div className="text-xl font-black text-emerald-400">{reviewResult.white.estimatedElo}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{reviewResult.white.accuracy}% accuracy</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Black Est. Rating</div>
                  <div className="text-xl font-black text-cyan-400">{reviewResult.black.estimatedElo}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{reviewResult.black.accuracy}% accuracy</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 italic pt-1 leading-relaxed">
                "{reviewResult.white.coachSummary || reviewResult.black.coachSummary}"
              </p>
            </div>

            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-cyan-400" />
              Move Classification Counts
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
                  'miss',
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
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs border ${meta.bgColor} ${meta.borderColor} ${meta.textColor}`}
                      >
                        {meta.symbol}
                      </span>
                      <span className="font-bold text-slate-200">{meta.label}</span>
                    </div>

                    <div className="flex items-center gap-4 font-mono font-bold text-xs">
                      <span className="text-slate-300 w-6 text-right">{whiteCount}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-300 w-6 text-right">{blackCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Average Centipawn Loss (ACPL)</span>
              <div className="flex items-center gap-4 font-mono font-bold">
                <span className="text-emerald-400">{reviewResult.white.avgCpLoss} CP</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400">{reviewResult.black.avgCpLoss} CP</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Playback Navigation Bar */}
      <div className="p-3 border-t border-slate-800 bg-[#070A10] flex items-center justify-between gap-1.5 sm:gap-2">
        <button
          onClick={() => onSelectPly(0)}
          disabled={currentPly <= 0}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition"
          title="Start of Game"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={() => onSelectPly(Math.max(0, currentPly - 1))}
          disabled={currentPly <= 0}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition"
          title="Previous Move (Left Arrow)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="flex-1 max-w-[130px] flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-md shadow-cyan-500/25 active:scale-95 transition"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
        </button>

        <button
          onClick={() => onSelectPly(Math.min(moves.length, currentPly + 1))}
          disabled={currentPly >= moves.length}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition"
          title="Next Move (Right Arrow)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => onSelectPly(moves.length)}
          disabled={currentPly >= moves.length}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition"
          title="End of Game"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
