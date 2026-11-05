import React, { useMemo, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { Palette, Sparkles, HelpCircle } from 'lucide-react';
import { MoveReview, CLASSIFICATIONS_CONFIG } from '../types/chess';
import { sounds } from '../services/soundEffects';

export type PieceSetId = 'cburnett' | 'neo' | 'alpha' | 'staunty';

interface ChessBoardProps {
  fen: string;
  isFlipped: boolean;
  currentMoveReview?: MoveReview;
  showBestMoveArrow?: boolean;
  showOpponentThreat?: boolean;
  // Interactive Retry Mode Props
  isRetrying?: boolean;
  onRetryAttempt?: (isCorrect: boolean, playedSan: string) => void;
  showRetryHint?: boolean;
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

const PIECE_SET_NAMES: Record<PieceSetId, string> = {
  cburnett: 'Classic Staunton',
  neo: 'Modern Neo',
  alpha: 'Alpha Traditional',
  staunty: 'Staunty Wood',
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  isFlipped,
  currentMoveReview,
  showBestMoveArrow = true,
  showOpponentThreat = false,
  isRetrying = false,
  onRetryAttempt,
  showRetryHint = false,
}) => {
  const [themeId, setThemeId] = useState<BoardThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('avelux_board_theme') as BoardThemeId | null;
      if (saved && BOARD_THEMES[saved]) return saved;
    }
    return 'green';
  });

  const [pieceSet, setPieceSet] = useState<PieceSetId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('avelux_piece_set') as PieceSetId | null;
      if (saved && PIECE_SET_NAMES[saved]) return saved;
    }
    return 'cburnett';
  });

  // State for interactive piece selection in Retry Mode
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [retryBoardFen, setRetryBoardFen] = useState<string | null>(null);

  const theme = BOARD_THEMES[themeId];

  // Active FEN: in retry mode, defaults to fenBefore unless user played a move
  const activeFen = useMemo(() => {
    if (isRetrying) {
      return retryBoardFen || currentMoveReview?.fenBefore || fen;
    }
    return fen;
  }, [isRetrying, retryBoardFen, currentMoveReview, fen]);

  const chess = useMemo(() => {
    try {
      return new Chess(activeFen);
    } catch {
      return new Chess();
    }
  }, [activeFen]);

  const board = useMemo(() => chess.board(), [chess]);

  // Legal moves for selected piece in retry mode
  const legalDestinations = useMemo(() => {
    if (!isRetrying || !selectedSquare) return new Set<string>();
    const moves = chess.moves({ square: selectedSquare, verbose: true });
    return new Set(moves.map((m) => m.to));
  }, [isRetrying, selectedSquare, chess]);

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

  // Best move arrow
  const bestMoveArrow = useMemo(() => {
    if (isRetrying) return null; // Don't give away the solution in retry mode
    if (!showBestMoveArrow || !currentMoveReview?.bestMoveUci) return null;
    const uci = currentMoveReview.bestMoveUci;
    if (uci.length < 4) return null;
    const fromSq = uci.substring(0, 2);
    const toSq = uci.substring(2, 4);
    if (!displayFiles.includes(fromSq[0]) || !displayFiles.includes(toSq[0])) return null;

    const [x1, y1] = squareToPercent(fromSq);
    const [x2, y2] = squareToPercent(toSq);
    return { fromSq, toSq, x1, y1, x2, y2 };
  }, [showBestMoveArrow, currentMoveReview, displayFiles, displayRanks, isRetrying]);

  // Opponent threat arrow
  const threatArrow = useMemo(() => {
    if (!showOpponentThreat || !currentMoveReview?.opponentThreatUci) return null;
    const uci = currentMoveReview.opponentThreatUci;
    if (uci.length < 4) return null;
    const fromSq = uci.substring(0, 2);
    const toSq = uci.substring(2, 4);
    if (!displayFiles.includes(fromSq[0]) || !displayFiles.includes(toSq[0])) return null;

    const [x1, y1] = squareToPercent(fromSq);
    const [x2, y2] = squareToPercent(toSq);
    return { fromSq, toSq, x1, y1, x2, y2 };
  }, [showOpponentThreat, currentMoveReview, displayFiles, displayRanks]);

  const playedMove = useMemo(() => {
    if (isRetrying) return null;
    if (!currentMoveReview?.from || !currentMoveReview?.to) return null;
    return {
      from: currentMoveReview.from,
      to: currentMoveReview.to,
      classification: currentMoveReview.classification,
    };
  }, [currentMoveReview, isRetrying]);

  const badgeConfig = currentMoveReview ? CLASSIFICATIONS_CONFIG[currentMoveReview.classification] : null;

  // Best move origin square for hints
  const hintOriginSquare = useMemo(() => {
    if (showRetryHint && currentMoveReview?.bestMoveUci) {
      return currentMoveReview.bestMoveUci.substring(0, 2);
    }
    return null;
  }, [showRetryHint, currentMoveReview]);

  const handleSquareClick = (sq: Square) => {
    if (!isRetrying || !currentMoveReview) return;

    const sideToMove = chess.turn();
    const pieceOnSquare = chess.get(sq);

    // If selecting own piece
    if (pieceOnSquare && pieceOnSquare.color === sideToMove) {
      setSelectedSquare(sq);
      return;
    }

    // If attempting a move from previously selected square
    if (selectedSquare) {
      const from = selectedSquare;
      const to = sq;

      try {
        const testChess = new Chess(chess.fen());
        const moveRes = testChess.move({ from, to, promotion: 'q' });

        if (moveRes) {
          const playedUci = `${from}${to}${moveRes.promotion || ''}`;
          const isCorrect =
            playedUci === currentMoveReview.bestMoveUci ||
            moveRes.san === currentMoveReview.bestMoveSan ||
            (currentMoveReview.bestMoveUci.startsWith(`${from}${to}`));

          if (isCorrect) {
            sounds.playCorrectMove();
            setRetryBoardFen(testChess.fen());
            if (onRetryAttempt) onRetryAttempt(true, moveRes.san);
          } else {
            sounds.playWrongMove();
            if (onRetryAttempt) onRetryAttempt(false, moveRes.san);
          }
          setSelectedSquare(null);
          return;
        }
      } catch {
        // Not a legal move
      }

      setSelectedSquare(null);
    }
  };

  const cycleTheme = () => {
    setThemeId((prev) => {
      const next: BoardThemeId = prev === 'green' ? 'wood' : prev === 'wood' ? 'ice' : 'green';
      if (typeof window !== 'undefined') localStorage.setItem('avelux_board_theme', next);
      return next;
    });
  };

  const cyclePieceSet = () => {
    setPieceSet((prev) => {
      const sets: PieceSetId[] = ['cburnett', 'neo', 'alpha', 'staunty'];
      const nextIdx = (sets.indexOf(prev) + 1) % sets.length;
      const next = sets[nextIdx];
      if (typeof window !== 'undefined') localStorage.setItem('avelux_piece_set', next);
      return next;
    });
  };

  const getPieceUrl = (color: string, type: string): string => {
    const code = `${color}${type.toUpperCase()}`;
    return `/pieces/${pieceSet}/${code}.svg`;
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
              const isSelected = selectedSquare === sq;
              const isLegalDest = legalDestinations.has(sq);
              const isHintSquare = hintOriginSquare === sq;
              const isThreatTo = threatArrow?.toSq === sq;

              return (
                <div
                  key={sq}
                  data-square={sq}
                  onClick={() => handleSquareClick(sq)}
                  className={`relative flex items-center justify-center transition-colors duration-150 ${
                    isDark ? theme.darkSquare : theme.lightSquare
                  } ${isTo ? theme.highlightTo : isFrom ? theme.highlightFrom : ''} ${
                    isSelected ? 'bg-amber-400/70 ring-4 ring-inset ring-amber-300' : ''
                  } ${isHintSquare ? 'ring-4 ring-cyan-400 animate-pulse bg-cyan-400/30' : ''} ${
                    isRetrying ? 'cursor-pointer hover:brightness-105' : ''
                  }`}
                >
                  {/* Rank & file coordinates */}
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

                  {/* Standard piece rendering */}
                  {piece && (
                    <div className="relative z-10 w-[88%] h-[88%] flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      <img
                        src={getPieceUrl(piece.color, piece.type)}
                        alt={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                        className="w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                        onError={(e) => {
                          const code = `${piece.color}${piece.type.toUpperCase()}`;
                          (e.currentTarget as HTMLImageElement).src = `/pieces/${code}.svg`;
                        }}
                      />
                    </div>
                  )}

                  {/* Legal move destination marker in retry mode */}
                  {isLegalDest && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      {piece ? (
                        <div className="w-full h-full border-4 border-emerald-400/80 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3.5 h-3.5 bg-emerald-500/80 rounded-full ring-2 ring-emerald-300 shadow-md" />
                      )}
                    </div>
                  )}

                  {/* Floating Move Badge */}
                  {!isRetrying && isTo && badgeConfig && (
                    <div
                      className={`absolute -top-2 -right-2 z-30 flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full text-[10px] font-black tracking-tight border shadow-lg ${badgeConfig.bgColor} ${badgeConfig.borderColor} ${badgeConfig.textColor} ${badgeConfig.glowColor} animate-bounce-short backdrop-blur-sm`}
                      title={`${badgeConfig.label} (${currentMoveReview?.cpLoss} CP Loss)`}
                    >
                      {badgeConfig.symbol}
                    </div>
                  )}

                  {/* Target dashed box for Best Move target square */}
                  {isBestTo && showBestMoveArrow && !isRetrying && (
                    <div className="absolute inset-1 rounded-lg border-2 border-dashed border-emerald-500/90 pointer-events-none animate-pulse" />
                  )}

                  {/* Red target box for Opponent Threat */}
                  {isThreatTo && showOpponentThreat && (
                    <div className="absolute inset-1 rounded-lg border-2 border-red-500/90 bg-red-500/20 pointer-events-none animate-pulse" />
                  )}
                </div>
              );
            })
          )}

          {/* SVG Arrow Overlay for Best Move & Opponent Threat */}
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

              <marker
                id="arrowhead-threat"
                markerWidth="6"
                markerHeight="6"
                refX="4.5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0.5, 5.5 3, 0 5.5" fill="#EF4444" />
              </marker>
            </defs>

            {/* Best Move Arrow (Green or Cyan) */}
            {showBestMoveArrow && bestMoveArrow && !isRetrying && (
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
            )}

            {/* Opponent Punishment Threat Arrow (Crimson Red) */}
            {showOpponentThreat && threatArrow && (
              <line
                x1={threatArrow.x1}
                y1={threatArrow.y1}
                x2={threatArrow.x2}
                y2={threatArrow.y2}
                stroke="#EF4444"
                strokeWidth="3.2"
                strokeDasharray="4 2"
                strokeLinecap="round"
                opacity="0.95"
                markerEnd="url(#arrowhead-threat)"
                filter="drop-shadow(0 0 6px rgba(239,68,68,0.8))"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Board & Piece Customization Bar */}
      <div className="w-full flex items-center justify-between px-1 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-semibold transition"
            title="Switch Board Theme (Green, Wood, Ice)"
          >
            <Palette className="h-3 w-3 text-emerald-400" />
            <span>{theme.name}</span>
          </button>

          <button
            onClick={cyclePieceSet}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-semibold transition"
            title="Switch Piece Style (Staunton, Neo, Alpha, Staunty)"
          >
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>{PIECE_SET_NAMES[pieceSet]}</span>
          </button>
        </div>

        {isRetrying && (
          <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1 animate-pulse">
            <HelpCircle className="h-3 w-3" />
            Retry Mode Active
          </span>
        )}
      </div>
    </div>
  );
};
