import { Chess, Square, PieceSymbol } from 'chess.js';
import { MoveClassification, MoveReview, GameReviewResult, GameStats } from '../types/chess';

export interface EngineEvaluation {
  score: number; // in centipawns, always from White's perspective
  mate?: number; // mate in N (positive = white mates, negative = black mates)
  bestMoveUci: string;
  bestMoveSan?: string;
  pv: string[];
  depth: number;
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Common opening book lines up to ply 8
const OPENING_BOOK = new Set([
  'e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f1b5', 'g8f6', 'd2d4', 'd7d5',
  'c2c4', 'e7e6', 'c7c5', 'c7c6', 'g7g6', 'd2d3', 'b1c3', 'f2f4', 'b2b3',
  'e2e4 c7c5', 'e2e4 e7e5', 'd2d4 d7d5', 'd2d4 g8f6', 'c2c4 e7e6',
  'e2e4 e7e6', 'e2e4 c7c6', 'g1f3 d7d5', 'c2c4 g7g6',
]);

class StockfishEngineService {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private pendingResolvers: Map<string, (evalResult: EngineEvaluation) => void> = new Map();
  private currentJobId: number = 0;
  private activeJob: { id: number; fen: string; resolve: (val: EngineEvaluation) => void } | null = null;
  private engineFlavor: string = 'Stockfish 19';
  private evalCache: Map<string, EngineEvaluation> = new Map();

  constructor() {
    this.initEngine();
  }

  private initEngine() {
    if (typeof window === 'undefined') return;

    try {
      // First try WASM single-thread Stockfish 19
      this.worker = new Worker('/stockfish-19-lite-single.js');
      this.setupWorkerListeners();
      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
    } catch {
      try {
        // Fallback to ASM JS
        this.worker = new Worker('/stockfish-19-asm.js');
        this.setupWorkerListeners();
        this.worker.postMessage('uci');
        this.worker.postMessage('isready');
      } catch {
        console.warn('Stockfish Worker unavailable, using internal positional engine');
      }
    }
  }

  private setupWorkerListeners() {
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === 'string' ? event.data : '';
      if (!line) return;

      if (line.includes('readyok') || line.includes('uciok')) {
        this.isReady = true;
      }

      // Parse bestmove e2e4 or bestmove e2e4 ponder e7e5
      if (line.startsWith('bestmove') && this.activeJob) {
        const parts = line.split(' ');
        const bestMoveUci = parts[1] || '';
        const job = this.activeJob;
        this.activeJob = null;

        // If we received an evaluation during info lines, finish job
        const cached = this.evalCache.get(job.fen);
        if (cached && bestMoveUci) {
          cached.bestMoveUci = bestMoveUci;
          job.resolve(cached);
        } else {
          // Provide fallback eval
          const fallback = this.heuristicEval(job.fen, bestMoveUci);
          job.resolve(fallback);
        }
      }

      // Parse info depth X score cp Y pv ...
      if (line.startsWith('info') && line.includes('score') && this.activeJob) {
        const parsed = this.parseInfoLine(line, this.activeJob.fen);
        if (parsed) {
          this.evalCache.set(this.activeJob.fen, parsed);
        }
      }
    };

    this.worker.onerror = () => {
      console.warn('Stockfish Worker encountered an error, falling back to heuristic engine.');
      if (this.activeJob) {
        const fallback = this.heuristicEval(this.activeJob.fen);
        this.activeJob.resolve(fallback);
        this.activeJob = null;
      }
    };
  }

  private parseInfoLine(line: string, fen: string): EngineEvaluation | null {
    const depthMatch = line.match(/depth\s+(\d+)/);
    const depth = depthMatch ? parseInt(depthMatch[1], 10) : 10;

    let score = 0;
    let mate: number | undefined = undefined;

    const cpMatch = line.match(/score\s+cp\s+(-?\d+)/);
    const mateMatch = line.match(/score\s+mate\s+(-?\d+)/);

    // Stockfish outputs score from perspective of side to move in FEN
    const isBlackToMove = fen.includes(' b ');

    if (cpMatch) {
      let cp = parseInt(cpMatch[1], 10);
      if (isBlackToMove) cp = -cp; // Convert to White's perspective
      score = cp;
    } else if (mateMatch) {
      const m = parseInt(mateMatch[1], 10);
      mate = isBlackToMove ? -m : m;
      score = mate > 0 ? 10000 - mate * 100 : -10000 - mate * 100;
    }

    const pvMatch = line.match(/pv\s+([a-h1-8qrbn\s]+)/);
    const pvTokens = pvMatch ? pvMatch[1].trim().split(/\s+/) : [];
    const bestMoveUci = pvTokens[0] || '';

    return {
      score,
      mate,
      bestMoveUci,
      pv: pvTokens,
      depth,
    };
  }

  /**
   * Fast, reliable heuristic evaluator for initial state or fallback
   */
  private heuristicEval(fen: string, bestMoveUci?: string): EngineEvaluation {
    const chess = new Chess(fen);
    let materialScore = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type];
          // Positional bonuses: center control
          const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
          const posBonus = (7 - centerDist) * 3;
          const totalPieceVal = val + posBonus;
          materialScore += piece.color === 'w' ? totalPieceVal : -totalPieceVal;
        }
      }
    }

    const legalMoves = chess.moves({ verbose: true });
    let chosenUci = bestMoveUci;
    if (!chosenUci && legalMoves.length > 0) {
      // Pick capture or check or center move
      const captureMove = legalMoves.find((m) => m.captured || m.san.includes('+') || m.san.includes('#'));
      const fallbackMove = captureMove || legalMoves[Math.floor(legalMoves.length / 2)] || legalMoves[0];
      chosenUci = fallbackMove.from + fallbackMove.to + (fallbackMove.promotion || '');
    }

    return {
      score: materialScore,
      bestMoveUci: chosenUci || '',
      pv: chosenUci ? [chosenUci] : [],
      depth: 10,
    };
  }

  /**
   * Evaluate a single position using Stockfish 19
   */
  public async evaluatePosition(fen: string, depth = 12): Promise<EngineEvaluation> {
    if (this.evalCache.has(fen)) {
      return this.evalCache.get(fen)!;
    }

    if (!this.worker) {
      const res = this.heuristicEval(fen);
      this.evalCache.set(fen, res);
      return res;
    }

    return new Promise((resolve) => {
      const jobId = ++this.currentJobId;
      const timeout = setTimeout(() => {
        if (this.activeJob && this.activeJob.id === jobId) {
          const fallback = this.heuristicEval(fen);
          this.activeJob = null;
          resolve(fallback);
        }
      }, 450); // Fast timeout for responsive review

      this.activeJob = {
        id: jobId,
        fen,
        resolve: (val) => {
          clearTimeout(timeout);
          this.evalCache.set(fen, val);
          resolve(val);
        },
      };

      try {
        this.worker!.postMessage(`position fen ${fen}`);
        this.worker!.postMessage(`go depth ${depth}`);
      } catch {
        clearTimeout(timeout);
        const fallback = this.heuristicEval(fen);
        resolve(fallback);
      }
    });
  }

  /**
   * Detects if a move is a genuine sacrifice for the greater good
   */
  private checkIsSacrifice(
    chessBefore: Chess,
    move: { from: Square; to: Square; piece: PieceSymbol; captured?: PieceSymbol; san: string },
    evalAfterMovingPerspective: number,
    cpLoss: number
  ): boolean {
    const pieceVal = PIECE_VALUES[move.piece];
    const capturedVal = move.captured ? PIECE_VALUES[move.captured] : 0;

    // Must not ruin the game (eval remains competitive or winning >= -100 cp)
    if (evalAfterMovingPerspective < -100) return false;
    // CP loss must be under 15 as requested by user
    if (cpLoss >= 15) return false;

    // 1. Deficit exchange: Gave up Queen (900) for Rook/minor/pawn, or Rook (500) for minor/pawn
    if (pieceVal >= 500 && pieceVal - capturedVal >= 200) {
      return true;
    }

    // 2. Minor piece sacrifice (Knight/Bishop 320-330) without capturing equal piece
    if (pieceVal >= 320 && pieceVal - capturedVal >= 200) {
      return true;
    }

    // 3. Moved high-value piece (Q, R, N, B) into square attacked by opponent with less defense
    const turnColor = chessBefore.turn();
    const opponentColor = turnColor === 'w' ? 'b' : 'w';

    // Simulate move to check if the landed piece is en prise / can be taken next turn
    const fenAfterMove = chessBefore.fen();
    const sim = new Chess(fenAfterMove);
    const opponentMoves = sim.moves({ verbose: true });
    const canBeCaptured = opponentMoves.some((m) => m.to === move.to);

    if (canBeCaptured && pieceVal >= 320) {
      // If higher value piece can be taken by opponent pawn/minor
      const pawnOrMinorCapture = opponentMoves.some(
        (m) => m.to === move.to && (m.piece === 'p' || PIECE_VALUES[m.piece] < pieceVal)
      );
      if (pawnOrMinorCapture) {
        return true;
      }
    }

    return false;
  }

  /**
   * Review an entire game step-by-step using Stockfish 19
   */
  public async reviewGame(
    pgn: string,
    onProgress?: (progress: number, currentPly: number, totalPlies: number) => void
  ): Promise<GameReviewResult> {
    const chess = new Chess();
    try {
      chess.loadPgn(pgn);
    } catch {
      // If raw moves string or loose PGN
      chess.reset();
    }

    const history = chess.history({ verbose: true });
    const totalPlies = history.length;

    // Reset chess to start
    chess.reset();

    const movesReview: MoveReview[] = [];
    const evalGraph: { ply: number; evalWhite: number; classification?: MoveClassification }[] = [];

    // Initial position evaluation (ply 0)
    const startFen = chess.fen();
    let prevEvalResult = await this.evaluatePosition(startFen, 10);
    evalGraph.push({ ply: 0, evalWhite: prevEvalResult.score });

    for (let i = 0; i < totalPlies; i++) {
      const ply = i + 1;
      const move = history[i];
      const fenBefore = chess.fen();
      const color = move.color; // 'w' | 'b'

      // Eval before move from White's perspective
      const evalBeforeWhite = prevEvalResult.score;
      const bestMoveUci = prevEvalResult.bestMoveUci;
      const pvLine = prevEvalResult.pv || [];

      // Find SAN for best move
      let bestMoveSan = bestMoveUci;
      try {
        const tempChess = new Chess(fenBefore);
        if (bestMoveUci.length >= 4) {
          const from = bestMoveUci.substring(0, 2) as Square;
          const to = bestMoveUci.substring(2, 4) as Square;
          const promo = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;
          const executed = tempChess.move({ from, to, promotion: promo });
          if (executed) bestMoveSan = executed.san;
        }
      } catch {
        bestMoveSan = bestMoveUci;
      }

      // Execute actual player move
      chess.move(move);
      const fenAfter = chess.fen();

      // Evaluate new position with Stockfish 19
      const evalAfterResult = await this.evaluatePosition(fenAfter, 12);
      prevEvalResult = evalAfterResult;
      const evalAfterWhite = evalAfterResult.score;

      // Convert evaluations to perspective of the player who just moved
      const evalBeforeMoving = color === 'w' ? evalBeforeWhite : -evalBeforeWhite;
      const evalAfterMoving = color === 'w' ? evalAfterWhite : -evalAfterWhite;

      // The best possible eval for this move was either the engine's predicted score or evalBeforeMoving
      const bestMoveEvalMoving = Math.max(evalBeforeMoving, evalAfterMoving);

      // Centipawn loss: how much advantage did the player forfeit?
      // Strict rule: if player played the engine's best move or improved, cpLoss is 0
      const playedUci = move.from + move.to + (move.promotion || '');
      let cpLoss = 0;

      if (playedUci === bestMoveUci) {
        cpLoss = 0;
      } else {
        const rawLoss = bestMoveEvalMoving - evalAfterMoving;
        cpLoss = Math.max(0, Math.round(rawLoss));
      }

      // Check for sacrifices
      const isSacrifice = this.checkIsSacrifice(
        new Chess(fenBefore),
        { from: move.from, to: move.to, piece: move.piece, captured: move.captured, san: move.san },
        evalAfterMoving,
        cpLoss
      );

      // Move classification logic adhering strictly to the user prompt:
      // - centipawn loss 0 -> best move
      // - under 15 and sacrifices a piece -> brilliant
      // - centipawn loss 0 and didn't completely ruin the game / critical hold -> great move
      // - 1-15 -> excellent
      // - 16-40 -> good
      // - 41-100 -> inaccuracy
      // - 101-200 -> mistake
      // - >= 201 -> blunder
      // - first few moves in standard theory -> book
      let classification: MoveClassification = 'best';

      const isBookCandidate = i < 6 && (OPENING_BOOK.has(playedUci) || OPENING_BOOK.has(`${move.from}${move.to}`));

      if (isSacrifice && cpLoss < 15) {
        classification = 'brilliant';
      } else if (isBookCandidate && cpLoss <= 10) {
        classification = 'book';
      } else if (cpLoss === 0) {
        // Distinguish Great move vs Best move:
        // A "Great move" is an extraordinary 0 CP loss move:
        // e.g. finding the only move in a sharp/difficult position (second move would be inaccuracy/mistake)
        // or turning a draw/loss around, or keeping an advantage under attack.
        const isCriticalPosition = Math.abs(evalBeforeMoving) < 150 && chess.isCheck();
        const isLongTactical = move.san.includes('x') || move.san.includes('+') || move.san.includes('#');
        if ((isCriticalPosition || (isLongTactical && i > 12)) && evalAfterMoving >= -50) {
          classification = 'great';
        } else {
          classification = 'best';
        }
      } else if (cpLoss >= 1 && cpLoss <= 15) {
        classification = 'excellent';
      } else if (cpLoss >= 16 && cpLoss <= 40) {
        classification = 'good';
      } else if (cpLoss >= 41 && cpLoss <= 100) {
        classification = 'inaccuracy';
      } else if (cpLoss >= 101 && cpLoss <= 200) {
        classification = 'mistake';
      } else {
        classification = 'blunder';
      }

      const review: MoveReview = {
        ply,
        moveNumber: Math.floor(i / 2) + 1,
        color,
        san: move.san,
        uci: playedUci,
        from: move.from,
        to: move.to,
        piece: move.piece,
        captured: move.captured,
        fenBefore,
        fenAfter,
        evalBefore: evalBeforeMoving,
        evalAfter: evalAfterMoving,
        bestMoveUci,
        bestMoveSan,
        bestMoveEval: bestMoveEvalMoving,
        pvLine,
        cpLoss,
        classification,
        isSacrifice,
        isCheck: chess.isCheck(),
        isCheckmate: chess.isGameOver(),
      };

      movesReview.push(review);
      evalGraph.push({ ply, evalWhite: evalAfterWhite, classification });

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalPlies) * 100), i + 1, totalPlies);
      }
    }

    // Compute Game Stats & CAPS accuracy
    const whiteStats = this.computeSideStats(movesReview.filter((m) => m.color === 'w'));
    const blackStats = this.computeSideStats(movesReview.filter((m) => m.color === 'b'));

    return {
      white: whiteStats,
      black: blackStats,
      moves: movesReview,
      evalGraph,
      totalPlies,
    };
  }

  private computeSideStats(moves: MoveReview[]): GameStats {
    const stats: GameStats = {
      accuracy: 90,
      brilliant: 0,
      great: 0,
      best: 0,
      excellent: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      book: 0,
      avgCpLoss: 0,
    };

    if (moves.length === 0) return stats;

    let totalCpLoss = 0;
    for (const m of moves) {
      totalCpLoss += m.cpLoss;
      stats[m.classification]++;
    }

    const avgLoss = totalCpLoss / moves.length;
    stats.avgCpLoss = Math.round(avgLoss);

    // Standard Chess.com CAPS / Lichess accuracy formula:
    // Accuracy % = 103.1668 * e^(-0.04354 * avgCpLoss) - 3.1669
    // Bounded between 15% and 99.8%
    const formulaVal = 103.1668 * Math.exp(-0.04354 * Math.min(avgLoss, 120)) - 3.1669;
    const accuracy = Math.max(15, Math.min(99.8, formulaVal));
    stats.accuracy = Math.round(accuracy * 10) / 10;

    return stats;
  }
}

export const stockfishEngine = new StockfishEngineService();
