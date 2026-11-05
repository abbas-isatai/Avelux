import React, { useMemo, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { Palette } from 'lucide-react';
import { MoveReview, CLASSIFICATIONS_CONFIG } from '../types/chess';

interface ChessBoardProps {
  fen: string;
  isFlipped: boolean;
  currentMoveReview?: MoveReview;
  showBestMoveArrow?: boolean;
}

export type BoardThemeId = 'green' | 'wood' | 'ice';

interface BoardTheme {
  id: BoardThemeId;
  name: string;
  lightSquare: string;
  darkSquare: string;
  lightCoord: string;
  darkCoord: string;
  highlightTo: string;
  highlightFrom: string;
}

const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  green: {
    id: 'green',
    name: 'Tournament Green',
    lightSquare: 'bg-[#EEEED2]',
    darkSquare: 'bg-[#769656]',
    lightCoord: 'text-[#769656]',
    darkCoord: 'text-[#EEEED2]',
    highlightTo: 'bg-[#F7EC74]/85 ring-2 ring-inset ring-amber-400 shadow-inner',
    highlightFrom: 'bg-[#F7EC74]/55',
  },
  wood: {
    id: 'wood',
    name: 'Warm Wood',
    lightSquare: 'bg-[#F0D9B5]',
    darkSquare: 'bg-[#B58863]',
    lightCoord: 'text-[#B58863]',
    darkCoord: 'text-[#F0D9B5]',
    highlightTo: 'bg-[#C8D654]/85 ring-2 ring-inset ring-amber-500 shadow-inner',
    highlightFrom: 'bg-[#C8D654]/55',
  },
  ice: {
    id: 'ice',
    name: 'Ice Blue',
    lightSquare: 'bg-[#E2E8F0]',
    darkSquare: 'bg-[#64748B]',
    lightCoord: 'text-[#475569]',
    darkCoord: 'text-[#F1F5F9]',
    highlightTo: 'bg-cyan-300/85 ring-2 ring-inset ring-cyan-500 shadow-inner',
    highlightFrom: 'bg-cyan-300/50',
  },
};

// Helper to get standard official Staunton vector piece URL
const getPieceUrl = (color: string, type: string): string => {
  const code = `${color}${type.toUpperCase()}`;
  return `/pieces/${code}.svg`;
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  isFlipped,
  currentMoveReview,
  showBestMoveArrow = true,
}) => {
  const [themeId, setThemeId] = useState<BoardThemeId>('green');
  const theme = BOARD_THEMES[themeId];

  const board = useMemo(() => {
    try {
      const chess = new Chess(fen);
      return chess.board();
    } catch {
      return new Chess().board();
    }
  }, [fen]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = isFlipped ? [...files].reverse() : files;
  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;

  const squareToPercent = (sq: string): [number, number] => {
    const file = sq[0];
    const rank = sq[1];
    const fIdx = displayFiles.indexOf(file);
    const rIdx = displayRanks.indexOf(rank);
    return [(fIdx + 0.5) * 12.5, (rIdx + 0.5) * 12.5];
  };

  const bestMoveArrow = useMemo(() => {
    if (!showBestMoveArrow || !currentMoveReview?.bestMoveUci) return null;
    const uci = currentMoveReview.bestMoveUci;
    if (uci.length < 4) return null;
    const fromSq = uci.substring(0, 2);
    const toSq = uci.substring(2, 4);
    if (!displayFiles.includes(fromSq[0]) || !displayFiles.includes(toSq[0])) return null;

    const [x1, y1] = squareToPercent(fromSq);
    const [x2, y2] = squareToPercent(toSq);
    return { fromSq, toSq, x1, y1, x2, y2 };
  }, [showBestMoveArrow, currentMoveReview, displayFiles, displayRanks]);

  const playedMove = useMemo(() => {
    if (!currentMoveReview?.from || !currentMoveReview?.to) return null;
    return {
      from: currentMoveReview.from,
      to: currentMoveReview.to,
      classification: currentMoveReview.classification,
    };
  }, [currentMoveReview]);

  const badgeConfig = currentMoveReview ? CLASSIFICATIONS_CONFIG[currentMoveReview.classification] : null;

  const cycleTheme = () => {
    setThemeId((prev) => {
      if (prev === 'green') return 'wood';
      if (prev === 'wood') return 'ice';
      return 'green';
    });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[560px] gap-2">
      <div className="relative aspect-square w-full rounded-2xl bg-[#141A24] p-1.5 sm:p-2.5 shadow-2xl shadow-black/60 border border-slate-700/80 select-none">
        <div className="relative w-full h-full rounded-xl overflow-hidden grid grid-cols-8 grid-rows-8 border border-slate-800/60 shadow-inner">
          {displayRanks.map((rank, rIdx) =>
            displayFiles.map((file, fIdx) => {
              const sq = `${file}${rank}` as Square;
              const isDark = (fIdx + rIdx) % 2 === 1;

              const origFileIdx = files.indexOf(file);
              const origRankIdx = 8 - parseInt(rank, 10);
              const piece = board[origRankIdx]?.[origFileIdx];

              const isFrom = playedMove?.from === sq;
              const isTo = playedMove?.to === sq;
              const isBestTo = bestMoveArrow?.toSq === sq && !isTo;

              return (
                <div
                  key={sq}
                  data-square={sq}
                  className={`relative flex items-center justify-center transition-colors duration-150 ${
                    isDark ? theme.darkSquare : theme.lightSquare
                  } ${isTo ? theme.highlightTo : isFrom ? theme.highlightFrom : ''}`}
                >
                  {/* Clean rank & file coordinates */}
                  {fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] font-black font-mono select-none pointer-events-none ${
                        isDark ? theme.darkCoord : theme.lightCoord
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[9px] font-black font-mono select-none pointer-events-none ${
                        isDark ? theme.darkCoord : theme.lightCoord
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Standard official piece rendering */}
                  {piece && (
                    <div className="relative z-10 w-[88%] h-[88%] flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      <img
                        src={getPieceUrl(piece.color, piece.type)}
                        alt={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                        className="w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                        onError={(e) => {
                          const code = `${piece.color}${piece.type.toUpperCase()}`;
                          (e.currentTarget as HTMLImageElement).src =
                            `https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/cburnett/${code}.svg`;
                        }}
                      />
                    </div>
                  )}

                  {/* Floating Move Badge */}
                  {isTo && badgeConfig && (
                    <div
                      className={`absolute -top-2 -right-2 z-30 flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full text-[10px] font-black tracking-tight border shadow-lg ${badgeConfig.bgColor} ${badgeConfig.borderColor} ${badgeConfig.textColor} ${badgeConfig.glowColor} animate-bounce-short backdrop-blur-sm`}
                      title={`${badgeConfig.label} (${currentMoveReview?.cpLoss} CP Loss)`}
                    >
                      {badgeConfig.symbol}
                    </div>
                  )}

                  {/* Target dashed box for Best Move target square */}
                  {isBestTo && showBestMoveArrow && (
                    <div className="absolute inset-1 rounded-lg border-2 border-dashed border-emerald-500/90 pointer-events-none animate-pulse" />
                  )}
                </div>
              );
            })
          )}

          {/* SVG Arrow Overlay for Best Move */}
          {showBestMoveArrow && bestMoveArrow && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <marker
                  id="arrowhead-best"
                  markerWidth="6"
                  markerHeight="6"
                  refX="4.5"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0.5, 5.5 3, 0 5.5" fill="#10B981" />
                </marker>

                <marker
                  id="arrowhead-brilliant"
                  markerWidth="6"
                  markerHeight="6"
                  refX="4.5"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0.5, 5.5 3, 0 5.5" fill="#06B6D4" />
                </marker>
              </defs>

              <line
                x1={bestMoveArrow.x1}
                y1={bestMoveArrow.y1}
                x2={bestMoveArrow.x2}
                y2={bestMoveArrow.y2}
                stroke={currentMoveReview?.classification === 'brilliant' ? '#06B6D4' : '#10B981'}
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0.95"
                markerEnd={
                  currentMoveReview?.classification === 'brilliant'
                    ? 'url(#arrowhead-brilliant)'
                    : 'url(#arrowhead-best)'
                }
                filter="drop-shadow(0 0 4px rgba(16,185,129,0.7))"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Board Theme Quick Switcher */}
      <div className="w-full flex items-center justify-between px-1 text-xs text-slate-400">
        <span className="text-[11px] font-mono">
          Theme: <strong className="text-slate-200">{theme.name}</strong>
        </span>
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-semibold transition"
          title="Switch Board Theme (Green, Wood, Ice)"
        >
          <Palette className="h-3 w-3 text-emerald-400" />
          <span>Change Theme</span>
        </button>
      </div>
    </div>
  );
};
