import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Header } from './components/Header';
import { UsernameSearchBanner } from './components/UsernameSearchBanner';
import { EvalBar } from './components/EvalBar';
import { ChessBoard } from './components/ChessBoard';
import { GameReviewPanel } from './components/GameReviewPanel';
import { PWAInstallModal } from './components/PWAInstallModal';
import { ShareReviewCardModal } from './components/ShareReviewCardModal';
import { ChessComGame, GameReviewResult } from './types/chess';
import { FEATURED_GAMES } from './services/chesscomApi';
import { stockfishEngine } from './services/chessEngine';
import { sounds } from './services/soundEffects';

export default function App() {
  const [selectedGame, setSelectedGame] = useState<ChessComGame>(FEATURED_GAMES[0]);
  const [currentUsername, setCurrentUsername] = useState<string>('hikaru');
  const [reviewResult, setReviewResult] = useState<GameReviewResult | null>(null);
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisDepth, setAnalysisDepth] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Opponent threat arrow state
  const [showOpponentThreat, setShowOpponentThreat] = useState<boolean>(false);

  // Interactive Retry Mode State
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [retryStatus, setRetryStatus] = useState<'idle' | 'success' | 'incorrect'>('idle');
  const [retryFeedback, setRetryFeedback] = useState<string>('');
  const [showRetryHint, setShowRetryHint] = useState<boolean>(false);

  const playTimerRef = useRef<number | null>(null);

  // Run Stockfish 19 Game Review
  const runGameReview = useCallback(
    async (game: ChessComGame, depth = analysisDepth) => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setIsPlaying(false);
      setIsRetrying(false);
      setRetryStatus('idle');
      setShowRetryHint(false);

      try {
        const result = await stockfishEngine.reviewGame(
          game.pgn,
          (progress) => {
            setAnalysisProgress(progress);
          },
          depth
        );
        setReviewResult(result);
        setCurrentPly(0);
      } catch (err) {
        console.error('Error reviewing game with Stockfish 19:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [analysisDepth]
  );

  // Trigger review on game selection or depth change
  useEffect(() => {
    runGameReview(selectedGame, analysisDepth);
  }, [selectedGame, analysisDepth, runGameReview]);

  // Derive FEN for current ply
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

  // Current move review object
  const currentMoveReview = React.useMemo(() => {
    if (!reviewResult || currentPly <= 0 || currentPly > reviewResult.moves.length) {
      return undefined;
    }
    return reviewResult.moves[currentPly - 1];
  }, [reviewResult, currentPly]);

  // Handle ply selection and sound effects
  const handleSelectPly = useCallback(
    (newPly: number) => {
      const clamped = Math.max(0, Math.min(newPly, reviewResult?.moves.length || 0));
      setCurrentPly(clamped);
      setIsRetrying(false);
      setRetryStatus('idle');
      setShowRetryHint(false);

      if (clamped > 0 && reviewResult?.moves[clamped - 1]) {
        const move = reviewResult.moves[clamped - 1];
        if (move.classification === 'brilliant') {
          sounds.playBrilliant();
        } else if (move.classification === 'blunder' || move.classification === 'miss') {
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
      }, 1200);
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Jump to next blunder, miss, or mistake
  const jumpToNextError = () => {
    if (!reviewResult) return;
    const moves = reviewResult.moves;
    for (let i = currentPly; i < moves.length; i++) {
      if (
        moves[i].classification === 'blunder' ||
        moves[i].classification === 'mistake' ||
        moves[i].classification === 'miss'
      ) {
        handleSelectPly(i + 1);
        return;
      }
    }
    for (let i = 0; i < currentPly; i++) {
      if (
        moves[i].classification === 'blunder' ||
        moves[i].classification === 'mistake' ||
        moves[i].classification === 'miss'
      ) {
        handleSelectPly(i + 1);
        return;
      }
    }
  };

  // Jump to next brilliant or great move
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

  // Retry Handlers
  const handleStartRetry = () => {
    setIsRetrying(true);
    setRetryStatus('idle');
    setRetryFeedback('');
    setShowRetryHint(false);
  };

  const handleCancelRetry = () => {
    setIsRetrying(false);
    setRetryStatus('idle');
    setShowRetryHint(false);
  };

  const handleRetryAttempt = (isCorrect: boolean, playedSan: string) => {
    if (isCorrect) {
      setRetryStatus('success');
      setRetryFeedback('');
    } else {
      setRetryStatus('incorrect');
      setRetryFeedback(`${playedSan} is not the optimal engine move`);
    }
  };

  const handleShowHint = () => {
    setShowRetryHint(true);
  };

  const handleRevealBestMove = () => {
    setRetryStatus('success');
    setShowRetryHint(false);
  };

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    sounds.enabled = newState;
  };

  // Centipawn evaluation from White's perspective for the eval bar
  const currentEvalScoreCp = React.useMemo(() => {
    if (!reviewResult || currentPly === 0) return 0;
    const review = reviewResult.moves[currentPly - 1];
    if (!review) return 0;
    return review.color === 'w' ? review.evalAfter : -review.evalAfter;
  }, [reviewResult, currentPly]);

  return (
    <div className="flex flex-col min-h-screen bg-[#070A10] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isFlipped={isFlipped}
        onToggleFlip={() => setIsFlipped((f) => !f)}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
      />

      {/* Prominent Chess.com Player Search & Game Picker Banner */}
      <UsernameSearchBanner
        currentUsername={currentUsername}
        onSelectGame={(game) => {
          setSelectedGame(game);
        }}
        selectedGameId={selectedGame.id}
      />

      {/* Main Review Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col justify-start">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
          {/* Left Column: Dynamic Eval Bar + Chessboard */}
          <div className="flex justify-center items-center w-full">
            <div className="flex items-stretch gap-2.5 sm:gap-3.5 w-full max-w-[600px]">
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
                  showOpponentThreat={showOpponentThreat}
                  isRetrying={isRetrying}
                  onRetryAttempt={handleRetryAttempt}
                  showRetryHint={showRetryHint}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Game Review Panel & Move Breakdown */}
          <div className="w-full h-full min-h-[520px]">
            <GameReviewPanel
              game={selectedGame}
              reviewResult={reviewResult}
              currentPly={currentPly}
              onSelectPly={handleSelectPly}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onJumpToNextError={jumpToNextError}
              onJumpToNextBrilliant={jumpToNextBrilliant}
              showOpponentThreat={showOpponentThreat}
              onToggleOpponentThreat={() => setShowOpponentThreat((prev) => !prev)}
              isRetrying={isRetrying}
              onStartRetry={handleStartRetry}
              onCancelRetry={handleCancelRetry}
              onShowHint={handleShowHint}
              onRevealBestMove={handleRevealBestMove}
              retryStatus={retryStatus}
              retryFeedback={retryFeedback}
              analysisDepth={analysisDepth}
              onChangeDepth={(d) => setAnalysisDepth(d)}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* APK & PWA Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Share Review Card & Annotated PGN Exporter Modal */}
      {reviewResult && (
        <ShareReviewCardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          game={selectedGame}
          reviewResult={reviewResult}
        />
      )}
    </div>
  );
}
