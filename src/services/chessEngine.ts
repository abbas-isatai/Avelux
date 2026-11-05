import { Chess, Square, PieceSymbol } from 'chess.js';
import { MoveClassification, MoveReview, GameReviewResult, GameStats } from '../types/chess';

export interface EngineEvaluation {
  score: number; // in centipawns, from the perspective of the side to move
  mate?: number;
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

// Opening theory book moves (common lines)
const OPENING_BOOK = new Set([
  'e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f1b5', 'g8f6', 'd2d4', 'd7d5',
  'c2c4', 'e7e6', 'c7c5', 'c7c6', 'g7g6', 'd2d3', 'b1c3', 'f2f4', 'b2b3',
  'e2e4 c7c5', 'e2e4 e7e5', 'd2d4 d7d5', 'd2d4 g8f6', 'c2c4 e7e6',
  'e2e4 e7e6', 'e2e4 c7c6', 'g1f3 d7d5', 'c2c4 g7g6', 'g1f3 g8f6',
]);

class StockfishEngineService {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private readyPromise: Promise<void> | null = null;
  private currentResolver: ((res: EngineEvaluation) => void) | null = null;
  private currentScore: number = 0;
  private currentMate?: number = undefined;
  private currentBestMove: string = '';
  private currentPv: string[] = [];
  private currentDepth: number = 8;
  private evalCache: Map<string, EngineEvaluation> = new Map();
  private commandQueue: Array<() => void> = [];
  private isProcessing: boolean = false;

  constructor() {
    this.readyPromise = this.initEngine();
  }

  private async initEngine(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve) => {
      try {
        this.worker = new Worker('/stockfish-19-lite-single.js');
        this.worker.onmessage = (e: MessageEvent) => {
          this.handleWorkerMessage(e.data, resolve);
        };
        this.worker.onerror = (err) => {
          console.warn('Stockfish Worker error, using fallback:', err);
          this.isReady = true;
          resolve();
        };

        this.worker.postMessage('uci');
        this.worker.postMessage('isready');

        // Safety timeout for worker initialization
        setTimeout(() => {
          this.isReady = true;
          resolve();
        }, 1200);
      } catch {
        this.isReady = true;
        resolve();
      }
    });
  }

  private handleWorkerMessage(data: unknown, onReady?: () => void) {
    const line = typeof data === 'string' ? data : '';
    if (!line) return;

    if (line.includes('readyok') || line.includes('uciok')) {
      this.isReady = true;
      if (onReady) onReady();
      return;
    }

    if (line.startsWith('info ') && line.includes('score cp ')) {
      const cpMatch = line.match(/score cp (-?\d+)/);
      if (cpMatch) {
        this.currentScore = parseInt(cpMatch[1], 10);
        this.currentMate = undefined;
      }
      const pvMatch = line.match(/\bpv\s+(.+)$/);
      if (pvMatch) {
        this.currentPv = pvMatch[1].trim().split(/\s+/);
      }
      const depthMatch = line.match(/depth\s+(\d+)/);
      if (depthMatch) {
        this.currentDepth = parseInt(depthMatch[1], 10);
      }
    } else if (line.startsWith('info ') && line.includes('score mate ')) {
      const mateMatch = line.match(/score mate (-?\d+)/);
      if (mateMatch) {
        const m = parseInt(mateMatch[1], 10);
        this.currentMate = m;
        this.currentScore = m > 0 ? 10000 - m * 100 : -10000 - m * 100;
      }
      const pvMatch = line.match(/\bpv\s+(.+)$/);
      if (pvMatch) {
        this.currentPv = pvMatch[1].trim().split(/\s+/);
      }
    } else if (line.startsWith('bestmove ')) {
      const parts = line.split(' ');
      this.currentBestMove = parts[1] || '';

      if (this.currentResolver) {
        const resolve = this.currentResolver;
        this.currentResolver = null;
        resolve({
          score: this.currentScore,
          mate: this.currentMate,
          bestMoveUci: this.currentBestMove,
          pv: this.currentPv,
          depth: this.currentDepth,
        });
      }
      this.processNextInQueue();
    }
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.commandQueue.push(async () => {
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
      if (!this.isProcessing) {
        this.processNextInQueue();
      }
    });
  }

  private processNextInQueue() {
    if (this.commandQueue.length > 0) {
      this.isProcessing = true;
      const nextTask = this.commandQueue.shift();
      if (nextTask) nextTask();
    } else {
      this.isProcessing = false;
    }
  }

  /**
   * Fast positional evaluator for backup
   */
  private heuristicEval(fen: string): EngineEvaluation {
    const chess = new Chess(fen);
    let materialScore = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type];
          const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
          const posBonus = (7 - centerDist) * 3;
          const pieceVal = val + posBonus;
          materialScore += piece.color === 'w' ? pieceVal : -pieceVal;
        }
      }
    }

    // Side to move perspective
    const isBlack = fen.includes(' b ');
    const sideScore = isBlack ? -materialScore : materialScore;

    const moves = chess.moves({ verbose: true });
    let bestUci = '';
    if (moves.length > 0) {
      const captureOrCheck = moves.find((m) => m.captured || m.san.includes('+') || m.san.includes('#'));
      const picked = captureOrCheck || moves[0];
      bestUci = picked.from + picked.to + (picked.promotion || '');
    }

    return {
      score: sideScore,
      bestMoveUci: bestUci,
      pv: bestUci ? [bestUci] : [],
      depth: 6,
    };
  }

  /**
   * Evaluates a single FEN position using Stockfish 19
   */
  public async evaluateFen(fen: string, depth = 8): Promise<EngineEvaluation> {
    if (this.evalCache.has(fen)) {
      return this.evalCache.get(fen)!;
    }

    await this.readyPromise;

    if (!this.worker) {
      const h = this.heuristicEval(fen);
      this.evalCache.set(fen, h);
      return h;
    }

    return this.enqueue(
      () =>
        new Promise<EngineEvaluation>((resolve) => {
          this.currentScore = 0;
          this.currentMate = undefined;
          this.currentBestMove = '';
          this.currentPv = [];
          this.currentDepth = depth;

          const timeout = setTimeout(() => {
            if (this.currentResolver) {
              const fallback = this.heuristicEval(fen);
              this.currentResolver = null;
              this.evalCache.set(fen, fallback);
              resolve(fallback);
              this.processNextInQueue();
            }
          }, 1200);

          this.currentResolver = (result) => {
            clearTimeout(timeout);
            this.evalCache.set(fen, result);
            resolve(result);
          };

          try {
            this.worker!.postMessage(`position fen ${fen}`);
            this.worker!.postMessage(`go depth ${depth}`);
          } catch {
            clearTimeout(timeout);
            const fallback = this.heuristicEval(fen);
            resolve(fallback);
            this.processNextInQueue();
          }
        })
    );
  }

  /**
   * Detects if a move was a genuine high-value sacrifice for tactical or positional advantage:
   * e.g., Queen, Rook, or Minor piece sacrificed for a decisive win or checkmate.
   */
  private checkIsSacrifice(
    chessBefore: Chess,
    move: { from: Square; to: Square; piece: PieceSymbol; captured?: PieceSymbol; san: string },
    evalBeforePlayer: number,
    evalAfterPlayer: number,
    cpLoss: number,
    isCheckmate: boolean
  ): boolean {
    // 1. Must satisfy user prompt requirement: cpLoss < 15
    if (cpLoss >= 15) return false;

    // 2. Must not ruin the position - player must be winning or deliver mate
    // evalAfterPlayer must be decisive (at least +150 cp, or checkmate, or mate sequence)
    if (evalAfterPlayer < 150 && !isCheckmate) return false;

    const pieceVal = PIECE_VALUES[move.piece];
    const capturedVal = move.captured ? PIECE_VALUES[move.captured] : 0;

    // Only Queen, Rook, Bishop, or Knight can be sacrificed (pawns alone do not count)
    if (move.piece !== 'q' && move.piece !== 'r' && move.piece !== 'b' && move.piece !== 'n') {
      return false;
    }

    // 3. Material traded down on this move:
    const netMaterialGiven = pieceVal - capturedVal;

    // Simulate position after the move to see if the piece is actually en prise (capturable)
    const sim = new Chess(chessBefore.fen());
    sim.move(move);
    const opponentMoves = sim.moves({ verbose: true });
    const isTargetAttacked = opponentMoves.some((m) => m.to === move.to);

    // Case A: Queen sacrifice (gives up 900 for <= 500, or queen placed where it can be taken)
    if (move.piece === 'q') {
      // Queen captures lower piece (e.g. rook, minor, pawn) and is attacked, or moves to attacked square without capture
      if (netMaterialGiven >= 400 && isTargetAttacked) {
        return true;
      }
      // Or Queen was given up for forced mate sequence
      if ((isCheckmate || evalAfterPlayer > 8000) && isTargetAttacked && netMaterialGiven > 0) {
        return true;
      }
    }

    // Case B: Rook sacrifice (gives up 500 for minor piece (320), pawn (100) or nothing (0))
    if (move.piece === 'r') {
      if (netMaterialGiven >= 170 && isTargetAttacked) {
        return true;
      }
    }

    // Case C: Minor piece sacrifice (Knight or Bishop gives up 320 for pawn (100) or nothing (0))
    if (move.piece === 'b' || move.piece === 'n') {
      if (netMaterialGiven >= 200 && isTargetAttacked) {
        // Minor piece sacrifice must result in a decisive advantage (>= +220) or mate
        if (evalAfterPlayer >= 220 || isCheckmate) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Reviews an entire chess game with Stockfish 19
   */
  public async reviewGame(
    pgn: string,
    onProgress?: (progress: number, currentPly: number, totalPlies: number) => void
  ): Promise<GameReviewResult> {
    const chess = new Chess();
    try {
      chess.loadPgn(pgn);
    } catch {
      chess.reset();
    }

    const history = chess.history({ verbose: true });
    const totalPlies = history.length;
    chess.reset();

    const movesReview: MoveReview[] = [];
    const evalGraph: { ply: number; evalWhite: number; classification?: MoveClassification }[] = [];

    // Evaluate Start Position
    const startFen = chess.fen();
    let prevEval = await this.evaluateFen(startFen, 8);
    // Convert to White's perspective
    evalGraph.push({ ply: 0, evalWhite: prevEval.score });

    for (let i = 0; i < totalPlies; i++) {
      const ply = i + 1;
      const move = history[i];
      const fenBefore = chess.fen();
      const color = move.color; // 'w' or 'b'

      // In fenBefore, it is `color`'s turn to move.
      // Stockfish score is already from `color`'s perspective!
      const scoreBeforePlayer = prevEval.score;
      const bestMoveUci = prevEval.bestMoveUci;
      const pvLine = prevEval.pv || [];

      // Calculate SAN for best move
      let bestMoveSan = bestMoveUci;
      try {
        const testChess = new Chess(fenBefore);
        if (bestMoveUci.length >= 4) {
          const from = bestMoveUci.substring(0, 2) as Square;
          const to = bestMoveUci.substring(2, 4) as Square;
          const promo = bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;
          const mRes = testChess.move({ from, to, promotion: promo });
          if (mRes) bestMoveSan = mRes.san;
        }
      } catch {
        bestMoveSan = bestMoveUci;
      }

      // Execute actual player move
      chess.move(move);
      const fenAfter = chess.fen();

      // In fenAfter, it is now the opponent's turn.
      // Stockfish evaluates fenAfter from opponent's perspective!
      const evalAfterOpp = await this.evaluateFen(fenAfter, 8);
      prevEval = evalAfterOpp;

      // Convert evalAfter to player's perspective:
      const scoreAfterPlayer = -evalAfterOpp.score;
      const evalWhite = color === 'w' ? scoreAfterPlayer : -scoreAfterPlayer;

      const playedUci = move.from + move.to + (move.promotion || '');

      // Centipawn Loss Calculation:
      let cpLoss = 0;
      if (playedUci === bestMoveUci) {
        cpLoss = 0;
      } else {
        const loss = scoreBeforePlayer - scoreAfterPlayer;
        cpLoss = Math.max(0, Math.round(loss));
      }

      const isCheckmate = chess.isGameOver();

      // Detect Authentic Piece Sacrifices (Queen, Rook, or Minor for winning attack/mate)
      const isSacrifice = this.checkIsSacrifice(
        new Chess(fenBefore),
        { from: move.from, to: move.to, piece: move.piece, captured: move.captured, san: move.san },
        scoreBeforePlayer,
        scoreAfterPlayer,
        cpLoss,
        isCheckmate
      );

      // Classification exactly per user specifications and strict rarity rules:
      // - under 15 and sacrifices a piece (Queen, Rook, Minor) -> brilliant (!!)
      // - centipawn loss 0 and changes position greatly (huge swing / only save) -> great move (!)
      // - centipawn loss 0 -> best move (★)
      // - 1-15 -> excellent (✓)
      // - 16-40 -> good (○)
      // - 41-100 -> inaccuracy (?!)
      // - 101-200 -> mistake (?)
      // - >= 201 -> blunder (??)
      // - early moves in book -> book (📖)
      let classification: MoveClassification = 'best';

      const isEarlyBook = i < 8 && OPENING_BOOK.has(playedUci);

      if (isSacrifice && cpLoss < 15 && i >= 6) {
        // Authentic, rare Brilliant move (!!)
        classification = 'brilliant';
      } else if (isEarlyBook && cpLoss <= 15) {
        classification = 'book';
      } else if (cpLoss === 0) {
        // Great Move (!): Must change position greatly or be a critical turning point
        // 1. Massive swing from equal/losing to decisive winning:
        const isGameWinningSwing = scoreBeforePlayer <= 60 && scoreAfterPlayer >= 200;
        // 2. Finding the sole miraculous defensive hold from a dead lost position:
        const isGameSavingDefense = scoreBeforePlayer <= -220 && scoreAfterPlayer >= -30;
        // 3. Finding an endgame breakthrough turning a draw (<= 40) into a forced win (>= 300):
        const isEndgameBreakthrough = i > 40 && Math.abs(scoreBeforePlayer) <= 40 && scoreAfterPlayer >= 300;

        if (i > 8 && (isGameWinningSwing || isGameSavingDefense || isEndgameBreakthrough)) {
          classification = 'great';
        } else {
          // Standard optimal Stockfish 19 choice
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
        evalBefore: scoreBeforePlayer,
        evalAfter: scoreAfterPlayer,
        bestMoveUci,
        bestMoveSan,
        bestMoveEval: scoreBeforePlayer,
        pvLine,
        cpLoss,
        classification,
        isSacrifice,
        isCheck: chess.isCheck(),
        isCheckmate: chess.isGameOver(),
      };

      movesReview.push(review);
      evalGraph.push({ ply, evalWhite, classification });

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalPlies) * 100), i + 1, totalPlies);
      }
    }

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

    let totalLoss = 0;
    for (const m of moves) {
      totalLoss += m.cpLoss;
      stats[m.classification]++;
    }

    const avgLoss = Math.round(totalLoss / moves.length);
    stats.avgCpLoss = avgLoss;

    // Standard Chess.com CAPS accuracy formula
    const rawAccuracy = 103.1668 * Math.exp(-0.04354 * Math.min(avgLoss, 120)) - 3.1669;
    stats.accuracy = Math.round(Math.max(20, Math.min(99.5, rawAccuracy)) * 10) / 10;

    return stats;
  }
}

export const stockfishEngine = new StockfishEngineService();
