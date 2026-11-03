import React, { useState } from 'react';
import { Search, Loader2, Sparkles, X, Swords, FileText, Globe, AlertCircle } from 'lucide-react';
import { ChessComGame } from '../types/chess';
import { fetchChessComGames, FEATURED_GAMES } from '../services/chesscomApi';

interface GameSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: ChessComGame) => void;
  initialUsername?: string;
}

const QUICK_PLAYERS = ['hikaru', 'magnuscarlsen', 'gothamchess', 'firouzja2003', 'danielnaroditsky'];

export const GameSelectorModal: React.FC<GameSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectGame,
  initialUsername = '',
}) => {
  const [activeTab, setActiveTab] = useState<'chesscom' | 'featured' | 'custom'>('chesscom');
  const [username, setUsername] = useState(initialUsername || 'hikaru');
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPgn, setCustomPgn] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (userToFetch: string) => {
    const target = userToFetch.trim();
    if (!target) return;
    setIsLoading(true);
    setError(null);

    try {
      const fetched = await fetchChessComGames(target);
      setGames(fetched);
      if (fetched.length === 0) {
        setError(`No recent games found for "${target}".`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch games from Chess.com';
      setError(msg);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPgnSubmit = () => {
    if (!customPgn.trim()) return;
    const customGame: ChessComGame = {
      id: `custom-${Date.now()}`,
      url: '',
      pgn: customPgn,
      timeControl: 'Custom PGN',
      timeClass: 'custom',
      rated: false,
      endTime: Math.floor(Date.now() / 1000),
      dateStr: new Date().toLocaleDateString(),
      white: { username: 'White', rating: 1500, result: 'Game' },
      black: { username: 'Black', rating: 1500, result: 'Game' },
    };
    onSelectGame(customGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#111827] to-[#0A0D14] border border-cyan-500/30 shadow-2xl shadow-cyan-950/40 text-slate-100">
        {/* Glow corner */}
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white font-bold">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Select Chess Game for Stockfish 19 Review
              </h2>
              <p className="text-xs text-slate-400">
                Load any Chess.com player, featured masterpiece, or custom PGN
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-4 pt-1 gap-2">
          <button
            onClick={() => setActiveTab('chesscom')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'chesscom'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Chess.com Username</span>
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'featured'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Masterpieces (Brilliant Moves)</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'custom'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Paste PGN</span>
          </button>
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'chesscom' && (
            <div className="space-y-4">
              {/* Input row */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Enter Chess.com Username
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(username)}
                      placeholder="e.g. hikaru, magnuscarlsen, gothamchess..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 font-mono transition"
                    />
                  </div>
                  <button
                    onClick={() => handleSearch(username)}
                    disabled={isLoading || !username.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition shrink-0"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span>Fetch Games</span>
                  </button>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Quick pick:</span>
                {QUICK_PLAYERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setUsername(p);
                      handleSearch(p);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-cyan-300 transition"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Error warning */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Games List */}
              {games.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Recent Games ({games.length})</span>
                    <span>Click game to review</span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {games.map((g) => {
                      const isUserWhite = g.white.username.toLowerCase() === username.toLowerCase();
                      const userWin = isUserWhite ? g.white.result === 'win' : g.black.result === 'win';

                      return (
                        <button
                          key={g.id}
                          onClick={() => {
                            onSelectGame(g);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition text-left group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Win/Loss pill */}
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                userWin
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {userWin ? 'W' : 'L'}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                <span>{g.white.username} ({g.white.rating})</span>
                                <span className="text-slate-500">vs</span>
                                <span>{g.black.username} ({g.black.rating})</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span className="uppercase text-cyan-400">{g.timeControl}</span>
                                <span>•</span>
                                <span>{g.dateStr}</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-xs text-cyan-400 font-medium group-hover:translate-x-1 transition-transform pl-2">
                            Review →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Masterpieces Tab */}
          {activeTab === 'featured' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Iconic games filled with famous sacrifices, brilliant tactical ideas, and historical depth:
              </p>

              <div className="space-y-2.5">
                {FEATURED_GAMES.map((fg) => (
                  <button
                    key={fg.id}
                    onClick={() => {
                      onSelectGame(fg);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition text-left group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {fg.white.username} ({fg.white.rating}) vs {fg.black.username} ({fg.black.rating})
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Masterpiece
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {fg.dateStr} • {fg.timeControl}
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform pl-2">
                      Review →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom PGN Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">
                Paste PGN Notation
              </label>
              <textarea
                rows={6}
                value={customPgn}
                onChange={(e) => setCustomPgn(e.target.value)}
                placeholder="1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O..."
                className="w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 p-3 text-xs font-mono text-white placeholder-slate-600 transition"
              />
              <button
                onClick={handleCustomPgnSubmit}
                disabled={!customPgn.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition"
              >
                Start Stockfish 19 Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
