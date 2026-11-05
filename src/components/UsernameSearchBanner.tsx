import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Globe, Swords, CheckCircle2, AlertCircle } from 'lucide-react';
import { ChessComGame } from '../types/chess';
import { fetchChessComGames, fetchGameByUrlOrPgn, FEATURED_GAMES } from '../services/chesscomApi';

interface UsernameSearchBannerProps {
  currentUsername: string;
  onSelectGame: (game: ChessComGame) => void;
  selectedGameId: string;
}

const QUICK_PLAYERS = ['hikaru', 'magnuscarlsen', 'gothamchess', 'firouzja2003', 'danielnaroditsky'];

export const UsernameSearchBanner: React.FC<UsernameSearchBannerProps> = ({
  currentUsername,
  onSelectGame,
  selectedGameId,
}) => {
  const [username, setUsername] = useState(currentUsername || 'hikaru');
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFetch = async (targetUser: string) => {
    const input = targetUser.trim();
    if (!input) return;
    setIsLoading(true);
    setError(null);

    // Check if input is a direct game URL (Chess.com or Lichess) or raw PGN
    if (
      input.includes('chess.com') ||
      input.includes('lichess.org') ||
      input.startsWith('[') ||
      input.match(/^1\.\s*[a-zA-Z]/)
    ) {
      try {
        const game = await fetchGameByUrlOrPgn(input);
        onSelectGame(game);
        setIsExpanded(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to import game from URL/PGN';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsExpanded(true);
    try {
      const fetched = await fetchChessComGames(input);
      setGames(fetched);
      if (fetched.length === 0) {
        setError(`No recent games found for "${input}".`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch games from Chess.com';
      setError(msg);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800/80 p-3 sm:p-4 backdrop-blur-md">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Main Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider shrink-0">
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">Chess.com Player:</span>
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch(username)}
              placeholder="Enter Chess.com username, game URL (Chess.com / Lichess), or paste PGN..."
              className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 font-mono transition"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleFetch(username)}
              disabled={isLoading || !username.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>Load Game</span>
            </button>

            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              {isExpanded ? 'Hide Games' : 'Browse Games'}
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-slate-400 mr-1 font-medium">Quick Players:</span>
          {QUICK_PLAYERS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setUsername(p);
                handleFetch(p);
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 transition"
            >
              {p}
            </button>
          ))}

          <span className="text-slate-600 mx-1">|</span>

          <span className="text-[11px] text-slate-400 mr-1 font-medium">Masterpieces:</span>
          <button
            onClick={() => onSelectGame(FEATURED_GAMES[0])}
            className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-mono text-amber-300 transition"
          >
            Kasparov 1999
          </button>
          <button
            onClick={() => onSelectGame(FEATURED_GAMES[1])}
            className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-mono text-amber-300 transition"
          >
            Tal Queen Sac
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Expandable Games List Drawer */}
        {isExpanded && games.length > 0 && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Recent Chess.com Games for &quot;{username}&quot; ({games.length})</span>
              <span className="text-[11px] text-cyan-400">Click any game to load and review with Stockfish 19</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {games.map((g) => {
                const isUserWhite = g.white.username.toLowerCase() === username.toLowerCase();
                const userWin = isUserWhite ? g.white.result === 'win' : g.black.result === 'win';
                const isSelected = g.id === selectedGameId;

                return (
                  <button
                    key={g.id}
                    onClick={() => onSelectGame(g)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-400'
                        : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-6 w-6 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          userWin
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {userWin ? 'W' : 'L'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {g.white.username} vs {g.black.username}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {g.timeControl} • {g.dateStr}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-cyan-400 shrink-0 ml-2">
                      Review →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
