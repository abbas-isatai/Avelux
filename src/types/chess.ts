export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'book';

export interface MoveReview {
  ply: number;
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  uci: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  fenBefore: string;
  fenAfter: string;
  // Centipawns from the perspective of the moving player
  evalBefore: number;
  evalAfter: number;
  // Best move calculated by Stockfish 19
  bestMoveUci: string;
  bestMoveSan: string;
  bestMoveEval: number; // centipawns
  pvLine: string[];
  // Centipawn loss for moving side: max(0, bestMoveEval - evalAfter)
  cpLoss: number;
  classification: MoveClassification;
  isSacrifice: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
}

export interface GameStats {
  accuracy: number; // 0 - 100%
  brilliant: number;
  great: number;
  best: number;
  excellent: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
  book: number;
  avgCpLoss: number;
}

export interface GameReviewResult {
  white: GameStats;
  black: GameStats;
  moves: MoveReview[];
  evalGraph: { ply: number; evalWhite: number; classification?: MoveClassification }[];
  totalPlies: number;
}

export interface ChessComPlayer {
  username: string;
  rating: number;
  result: string;
  avatar?: string;
}

export interface ChessComGame {
  id: string;
  url: string;
  pgn: string;
  fen?: string;
  timeControl: string;
  timeClass: string;
  rated: boolean;
  endTime: number;
  dateStr: string;
  white: ChessComPlayer;
  black: ChessComPlayer;
}

export interface ClassificationMeta {
  type: MoveClassification;
  label: string;
  symbol: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  description: string;
}

export const CLASSIFICATIONS_CONFIG: Record<MoveClassification, ClassificationMeta> = {
  brilliant: {
    type: 'brilliant',
    label: 'Brilliant',
    symbol: '!!',
    color: '#06B6D4', // Electric Cyan
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-300',
    glowColor: 'shadow-[0_0_15px_rgba(6,182,212,0.6)]',
    description: 'A daring sacrifice that keeps the advantage (CP loss < 15)',
  },
  great: {
    type: 'great',
    label: 'Great Move',
    symbol: '!',
    color: '#818CF8', // Indigo / Vibrant Lavender
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-400',
    textColor: 'text-indigo-300',
    glowColor: 'shadow-[0_0_15px_rgba(129,140,248,0.5)]',
    description: 'An optimal 0 CP loss move in a critical position',
  },
  best: {
    type: 'best',
    label: 'Best Move',
    symbol: '★',
    color: '#10B981', // Emerald Green
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-300',
    glowColor: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    description: 'Top Stockfish 19 choice (0 centipawn loss)',
  },
  excellent: {
    type: 'excellent',
    label: 'Excellent',
    symbol: '✓',
    color: '#34D399', // Mint / Light Emerald
    bgColor: 'bg-emerald-400/15',
    borderColor: 'border-emerald-500/60',
    textColor: 'text-emerald-300',
    glowColor: 'shadow-[0_0_8px_rgba(52,211,153,0.3)]',
    description: 'Practically as strong as the best move (1-15 CP loss)',
  },
  good: {
    type: 'good',
    label: 'Good',
    symbol: '○',
    color: '#38BDF8', // Sky Blue
    bgColor: 'bg-sky-500/15',
    borderColor: 'border-sky-500/50',
    textColor: 'text-sky-300',
    glowColor: 'shadow-[0_0_8px_rgba(56,189,248,0.3)]',
    description: 'Solid move maintaining composure (16-40 CP loss)',
  },
  inaccuracy: {
    type: 'inaccuracy',
    label: 'Inaccuracy',
    symbol: '?!',
    color: '#FBBF24', // Amber
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-400',
    textColor: 'text-amber-300',
    glowColor: 'shadow-[0_0_10px_rgba(251,191,36,0.4)]',
    description: 'Gives up a small fraction of advantage (41-100 CP loss)',
  },
  mistake: {
    type: 'mistake',
    label: 'Mistake',
    symbol: '?',
    color: '#F97316', // Orange
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-300',
    glowColor: 'shadow-[0_0_12px_rgba(249,115,22,0.5)]',
    description: 'Significantly weakens position (101-200 CP loss)',
  },
  blunder: {
    type: 'blunder',
    label: 'Blunder',
    symbol: '??',
    color: '#EF4444', // Red
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    textColor: 'text-red-400',
    glowColor: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]',
    description: 'Game-altering error (201+ CP loss)',
  },
  book: {
    type: 'book',
    label: 'Book Move',
    symbol: '📖',
    color: '#A78BFA', // Purple
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-400',
    textColor: 'text-purple-300',
    glowColor: 'shadow-[0_0_8px_rgba(167,139,250,0.3)]',
    description: 'Standard recognized chess theory opening move',
  },
};
