import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Header } from './components/Header';
import { EvalBar } from './components/EvalBar';
import { ChessBoard } from './components/ChessBoard';
import { GameReviewPanel } from './components/GameReviewPanel';
import { GameSelectorModal } from './components/GameSelectorModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { ChessComGame, GameReviewResult } from './types/chess';
import { FEATURED_GAMES } from './services/chesscomApi';
import { stockfishEngine } from './services/chessEngine';
import { sounds } from './services/soundEffects';

export default function App() {
  const [selectedGame, setSelectedGame] = useState<ChessComGame>(FEATURED_GAMES[0]);
  const [reviewResult, setReviewResult] = useState<GameReviewResult | null>(null);
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Modals
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Auto-play interval ref
  const playTimerRef = useRef<number | null>(null);

  // Start analysis for the selected game
  const runGameReview = useCallback(async (game: ChessComGame) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setIsPlaying(false);

    try {
      const result = await stockfishEngine.reviewGame(
        game.pgn,
        (progress) => {
          setAnalysisProgress(progress);
        }
      );
      setReviewResult(result);
      setCurrentPly(0);
    } catch (err) {
      console.error('Error reviewing game:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Run review on game change
  useEffect(() => {
    runGameReview(selectedGame);
  }, [selectedGame, runGameReview]);

  // Compute FEN for current ply
  const currentFen = React.useMemo(() => {
    const chess = new Chess();
    try {
      chess.loadPgn(selectedGame.pgn);
      const history = chess.history({ verbose: true });
      chess.reset();
      for (let i = 0; i < currentPly && i < history.length; i++) {
        chess.move(history[i]);
      }
      return chess.fen();
    } catch {
      return chess.fen();
    }
  }, [selectedGame, currentPly]);

  // Get current move review
  const currentMoveReview = React.useMemo(() => {
    if (!reviewResult || currentPly <= 0 || currentPly > reviewResult.moves.length) {
      return undefined;
    }
    return reviewResult.moves[currentPly - 1];
  }, [reviewResult, currentPly]);

  // Play audio sound on ply change
  const handleSelectPly = useCallback(
    (newPly: number) => {
      const clamped = Math.max(0, Math.min(newPly, reviewResult?.moves.length || 0));
      setCurrentPly(clamped);

      if (clamped > 0 && reviewResult?.moves[clamped - 1]) {
        const move = reviewResult.moves[clamped - 1];
        if (move.classification === 'brilliant') {
          sounds.playBrilliant();
        } else if (move.classification === 'blunder') {
          sounds.playBlunder();
        } else if (move.isCheck) {
          sounds.playCheck();
        } else if (move.captured) {
          sounds.playCapture();
        } else {
          sounds.playMove();
        }
      }
    },
    [reviewResult]
  );

  // Autoplay loop
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = window.setInterval(() => {
        setCurrentPly((prev) => {
          const maxPly = reviewResult?.moves.length || 0;
          if (prev >= maxPly) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          handleSelectPly(next);
          return next;
        });
      }, 1100);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, reviewResult, handleSelectPly]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        handleSelectPly(currentPly - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        handleSelectPly(currentPly + 1);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFlipped((f) => !f);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPly, handleSelectPly]);

  // Jump to next blunder / mistake
  const jumpToNextError = () => {
    if (!reviewResult) return;
    const moves = reviewResult.moves;
    for (let i = currentPly; i < moves.length; i++) {
      if (moves[i].classification === 'blunder' || moves[i].classification === 'mistake') {
        handleSelectPly(i + 1);
        return;
      }
    }
    // Loop around from beginning
    for (let i = 0; i < currentPly; i++) {
      if (moves[i].classification === 'blunder' || moves[i].classification === 'mistake') {
        handleSelectPly(i + 1);
        return;
      }
    }
  };

  // Jump to next brilliant move (!!)
  const jumpToNextBrilliant = () => {
    if (!reviewResult) return;
    const moves = reviewResult.moves;
    for (let i = currentPly; i < moves.length; i++) {
      if (moves[i].classification === 'brilliant' || moves[i].classification === 'great') {
        handleSelectPly(i + 1);
        return;
      }
    }
    for (let i = 0; i < currentPly; i++) {
      if (moves[i].classification === 'brilliant' || moves[i].classification === 'great') {
        handleSelectPly(i + 1);
        return;
      }
    }
  };

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    sounds.enabled = newState;
  };

  // Score in CP from White's perspective
  const currentEvalScoreCp = React.useMemo(() => {
    if (!reviewResult || currentPly === 0) return 0;
    const review = reviewResult.moves[currentPly - 1];
    if (!review) return 0;
    return review.color === 'w' ? review.evalAfter : -review.evalAfter;
  }, [reviewResult, currentPly]);

  return (
    <div className="flex flex-col min-h-screen bg-[#070A10] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        onOpenGameSelector={() => setIsGameSelectorOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isFlipped={isFlipped}
        onToggleFlip={() => setIsFlipped((f) => !f)}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
      />

      {/* Main Review Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
          {/* Left Column: Eval Bar + Chessboard */}
          <div className="flex justify-center items-center w-full">
            <div className="flex items-stretch gap-2 sm:gap-3 w-full max-w-[620px]">
              {/* Dynamic Evaluation Bar */}
              <EvalBar
                scoreCp={currentEvalScoreCp}
                isFlipped={isFlipped}
              />

              {/* Interactive SVG Chessboard */}
              <div className="flex-1 flex flex-col items-center">
                <ChessBoard
                  fen={currentFen}
                  isFlipped={isFlipped}
                  currentMoveReview={currentMoveReview}
                  showBestMoveArrow={true}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Game Review Panel & Move Breakdown */}
          <div className="w-full h-full min-h-[500px]">
            <GameReviewPanel
              game={selectedGame}
              reviewResult={reviewResult}
              currentPly={currentPly}
              onSelectPly={handleSelectPly}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onJumpToNextError={jumpToNextError}
              onJumpToNextBrilliant={jumpToNextBrilliant}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <GameSelectorModal
        isOpen={isGameSelectorOpen}
        onClose={() => setIsGameSelectorOpen(false)}
        onSelectGame={(game) => {
          setSelectedGame(game);
        }}
        initialUsername="hikaru"
      />

      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
