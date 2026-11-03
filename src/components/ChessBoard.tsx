import React, { useMemo } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { MoveReview, CLASSIFICATIONS_CONFIG } from '../types/chess';

interface ChessBoardProps {
  fen: string;
  isFlipped: boolean;
  currentMoveReview?: MoveReview;
  showBestMoveArrow?: boolean;
}

// Staunton pieces SVG paths
const PIECE_SVGS: Record<string, React.ReactNode> = {
  // White King
  'w-k': (
    <g fill="none" fillRule="evenodd" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 11.63V6M20 8h5" stroke="#FFFFFF" />
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#FFFFFF" stroke="#0F172A" />
      <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" fill="#FFFFFF" stroke="#0F172A" />
      <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" stroke="#0F172A" />
      <path d="M10 40.5h24.5v3H10z" fill="#FFFFFF" stroke="#0F172A" />
    </g>
  ),
  // White Queen
  'w-q': (
    <g fill="#FFFFFF" fillRule="evenodd" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0M41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0M33 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0" />
      <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12" />
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 20.5 1 27 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0" />
      <path d="M11 38.5c5.5-2 17.5-2 23 0" fill="none" />
      <path d="M10 41.5h25v2.5H10z" />
    </g>
  ),
  // White Rook
  'w-r': (
    <g fill="#FFFFFF" fillRule="evenodd" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
      <path d="M34 14l-3 3H14l-3-3" />
      <path d="M31 17v12.5H14V17" />
      <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
      <path d="M11 14h23" fill="none" />
    </g>
  ),
  // White Bishop
  'w-b': (
    <g fill="#FFFFFF" fillRule="evenodd" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <g fill="#FFFFFF">
        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
      </g>
      <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" fill="none" />
    </g>
  ),
  // White Knight
  'w-n': (
    <g fill="#FFFFFF" fillRule="evenodd" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
      <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.64 1.42-1 1-1 0-.72 1.41-1 1-1 0-.63 1.49-1 1-.36-.08-1.5-.78-2.5-1.5-1-.5-1.46-1.58-.5-2.5 1-1 3.5-2.5 3-4-1.5-.5-1.5-2.5-1.5-2.5 3-1.5 2.5-6 6.5-6.5 3.5-.5 8.5 2.5 9.5 5.5z" />
      <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#0F172A" />
      <path d="M15 15.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#0F172A" />
    </g>
  ),
  // White Pawn
  'w-p': (
    <g fill="#FFFFFF" fillRule="evenodd" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-2.78-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
    </g>
  ),

  // Black King
  'b-k': (
    <g fill="none" fillRule="evenodd" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 11.63V6M20 8h5" stroke="#FBBF24" />
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#1E293B" stroke="#000000" />
      <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" fill="#1E293B" stroke="#000000" />
      <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" stroke="#FBBF24" />
      <path d="M10 40.5h24.5v3H10z" fill="#1E293B" stroke="#000000" />
    </g>
  ),
  // Black Queen
  'b-q': (
    <g fill="#1E293B" fillRule="evenodd" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0M41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0M33 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0" fill="#38BDF8" stroke="#000000" />
      <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12" />
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 20.5 1 27 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0" />
      <path d="M11 38.5c5.5-2 17.5-2 23 0" fill="none" stroke="#38BDF8" />
      <path d="M10 41.5h25v2.5H10z" />
    </g>
  ),
  // Black Rook
  'b-r': (
    <g fill="#1E293B" fillRule="evenodd" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
      <path d="M34 14l-3 3H14l-3-3" />
      <path d="M31 17v12.5H14V17" />
      <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
      <path d="M11 14h23" fill="none" stroke="#64748B" />
    </g>
  ),
  // Black Bishop
  'b-b': (
    <g fill="#1E293B" fillRule="evenodd" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
      <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" fill="none" stroke="#64748B" />
    </g>
  ),
  // Black Knight
  'b-n': (
    <g fill="#1E293B" fillRule="evenodd" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
      <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.64 1.42-1 1-1 0-.72 1.41-1 1-1 0-.63 1.49-1 1-.36-.08-1.5-.78-2.5-1.5-1-.5-1.46-1.58-.5-2.5 1-1 3.5-2.5 3-4-1.5-.5-1.5-2.5-1.5-2.5 3-1.5 2.5-6 6.5-6.5 3.5-.5 8.5 2.5 9.5 5.5z" />
      <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#38BDF8" />
      <path d="M15 15.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#38BDF8" />
    </g>
  ),
  // Black Pawn
  'b-p': (
    <g fill="#1E293B" fillRule="evenodd" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-2.78-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
    </g>
  ),
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  isFlipped,
  currentMoveReview,
  showBestMoveArrow = true,
}) => {
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

  // Helper to convert algebraic square (e.g. 'e4') to percentage coords [xPercent, yPercent]
  const squareToPercent = (sq: string): [number, number] => {
    const file = sq[0];
    const rank = sq[1];
    const fIdx = displayFiles.indexOf(file);
    const rIdx = displayRanks.indexOf(rank);
    // Center of square
    return [(fIdx + 0.5) * 12.5, (rIdx + 0.5) * 12.5];
  };

  // Best move arrow coordinates from Stockfish 19
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

  // Played move highlight coordinates
  const playedMove = useMemo(() => {
    if (!currentMoveReview?.from || !currentMoveReview?.to) return null;
    return {
      from: currentMoveReview.from,
      to: currentMoveReview.to,
      classification: currentMoveReview.classification,
    };
  }, [currentMoveReview]);

  const badgeConfig = currentMoveReview ? CLASSIFICATIONS_CONFIG[currentMoveReview.classification] : null;

  return (
    <div className="relative aspect-square w-full max-w-[560px] rounded-2xl bg-[#090D16] p-1.5 sm:p-2.5 shadow-2xl shadow-cyan-950/20 border border-slate-800/80 select-none">
      <div className="relative w-full h-full rounded-xl overflow-hidden grid grid-cols-8 grid-rows-8 border border-slate-700/50">
        {/* Render 64 squares */}
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const sq = `${file}${rank}` as Square;
            const isDark = (fIdx + rIdx) % 2 === 1;

            // Piece on this square
            const origFileIdx = files.indexOf(file);
            const origRankIdx = 8 - parseInt(rank, 10);
            const piece = board[origRankIdx]?.[origFileIdx];

            // Highlights
            const isFrom = playedMove?.from === sq;
            const isTo = playedMove?.to === sq;
            const isBestTo = bestMoveArrow?.toSq === sq && !isTo;

            return (
              <div
                key={sq}
                data-square={sq}
                className={`relative flex items-center justify-center transition-colors duration-150 ${
                  isDark ? 'bg-[#1E293B]' : 'bg-[#334155]'
                } ${
                  isTo
                    ? 'ring-2 ring-inset ring-cyan-400 bg-cyan-900/40 shadow-inner'
                    : isFrom
                    ? 'bg-cyan-950/30'
                    : ''
                }`}
              >
                {/* Subtle Coordinate labels */}
                {fIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[9px] font-bold font-mono ${
                      isDark ? 'text-slate-400' : 'text-slate-300'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[9px] font-bold font-mono ${
                      isDark ? 'text-slate-400' : 'text-slate-300'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Piece Rendering */}
                {piece && (
                  <div className="relative z-10 w-[84%] h-[84%] flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    <svg viewBox="0 0 45 45" className="w-full h-full">
                      {PIECE_SVGS[`${piece.color}-${piece.type}`]}
                    </svg>
                  </div>
                )}

                {/* Floating Move Classification Badge on destination square */}
                {isTo && badgeConfig && (
                  <div
                    className={`absolute -top-2 -right-2 z-30 flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full text-[10px] font-extrabold tracking-tight border shadow-lg ${badgeConfig.bgColor} ${badgeConfig.borderColor} ${badgeConfig.textColor} ${badgeConfig.glowColor} animate-bounce-short backdrop-blur-sm`}
                    title={`${badgeConfig.label} (${currentMoveReview?.cpLoss} cp loss)`}
                  >
                    {badgeConfig.symbol}
                  </div>
                )}

                {/* Target ring for best move square if different */}
                {isBestTo && showBestMoveArrow && (
                  <div className="absolute inset-1 rounded-lg border-2 border-dashed border-emerald-400/70 pointer-events-none animate-pulse" />
                )}
              </div>
            );
          })
        )}

        {/* SVG Arrow Overlay for Best Move and Deviation */}
        {showBestMoveArrow && (bestMoveArrow || (playedMove && currentMoveReview?.cpLoss && currentMoveReview.cpLoss > 15)) && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Green Arrowhead for Stockfish 19 Best Move */}
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

              {/* Red/Orange Arrowhead for Blunders/Mistakes */}
              <marker
                id="arrowhead-error"
                markerWidth="6"
                markerHeight="6"
                refX="4.5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0.5, 5.5 3, 0 5.5" fill="#EF4444" />
              </marker>

              {/* Cyan Arrowhead for Brilliant sacrifices */}
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

            {/* Best Move Arrow (Stockfish 19) */}
            {bestMoveArrow && (
              <line
                x1={bestMoveArrow.x1}
                y1={bestMoveArrow.y1}
                x2={bestMoveArrow.x2}
                y2={bestMoveArrow.y2}
                stroke={currentMoveReview?.classification === 'brilliant' ? '#06B6D4' : '#10B981'}
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0.9"
                markerEnd={
                  currentMoveReview?.classification === 'brilliant'
                    ? 'url(#arrowhead-brilliant)'
                    : 'url(#arrowhead-best)'
                }
                filter="drop-shadow(0 0 4px rgba(16,185,129,0.7))"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
};
