import { ChessComGame } from '../types/chess';

export const FEATURED_GAMES: ChessComGame[] = [
  {
    id: 'kasparov-topalov-1999',
    url: 'https://www.chess.com/games/view/969989',
    white: { username: 'Garry Kasparov', rating: 2812, result: 'win' },
    black: { username: 'Veselin Topalov', rating: 2700, result: 'resigned' },
    timeControl: 'Standard 40/120',
    timeClass: 'classical',
    rated: true,
    endTime: 916876800,
    dateStr: '1999.01.20',
    pgn: `[Event "Hoogovens Group A"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[White "Kasparov, Garry"]
[Black "Topalov, Veselin"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
  },
  {
    id: 'tal-hecht-1962',
    url: 'https://www.chess.com/games/view/14352',
    white: { username: 'Mikhail Tal', rating: 2705, result: 'win' },
    black: { username: 'Hans-Joachim Hecht', rating: 2480, result: 'resigned' },
    timeControl: 'Standard',
    timeClass: 'classical',
    rated: true,
    endTime: -231379200,
    dateStr: '1962.10.15',
    pgn: `[Event "Varna Olympiad"]
[Site "Varna BUL"]
[Date "1962.10.15"]
[White "Tal, Mikhail"]
[Black "Hecht, Hans-Joachim"]
[Result "1-0"]

1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 Qc7 11. Bd2 e6 12. O-O-O Ngf6 13. Ne4 O-O-O 14. g3 Nxe4 15. Qxe4 Bd6 16. c4 Rhe8 17. Bc3 f5 18. Qe2 f4 19. g4 e5 20. dxe5 Nxe5 21. Rhe1 Nd3+ 22. Qxd3 Rxe1 23. Rxe1 Bc5 24. Qf5+ 1-0`,
  },
  {
    id: 'hikaru-alireza-speedchess',
    url: 'https://www.chess.com/game/live/108920192',
    white: { username: 'Hikaru Nakamura', rating: 3280, result: 'win' },
    black: { username: 'Alireza Firouzja', rating: 3195, result: 'resigned' },
    timeControl: '180+1',
    timeClass: 'blitz',
    rated: true,
    endTime: 1695484800,
    dateStr: '2023.09.23',
    pgn: `[Event "Speed Chess Championship 2023"]
[Site "Chess.com"]
[Date "2023.09.23"]
[White "Nakamura, Hikaru"]
[Black "Firouzja, Alireza"]
[Result "1-0"]

1. d4 Nf6 2. Nf3 g6 3. c4 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nbd7 7. Nc3 e5 8. e4 exd4 9. Nxd4 Re8 10. h3 a6 11. Re1 Rb8 12. Bg5 h6 13. Be3 Ne5 14. b3 c5 15. Nde2 b5 16. f4 Ned7 17. Qxd6 b4 18. e5 bxc3 19. Nxc3 Rb6 20. Qd3 Nh7 21. Rad1 g5 22. Bxc5 Rbe6 23. Bf2 gxf4 24. gxf4 Rg6 25. Kh2 1-0`,
  },
  {
    id: 'magnus-ding-2022',
    url: 'https://www.chess.com/game/live/60291039',
    white: { username: 'Magnus Carlsen', rating: 2882, result: 'win' },
    black: { username: 'Ding Liren', rating: 2806, result: 'resigned' },
    timeControl: '300+2',
    timeClass: 'blitz',
    rated: true,
    endTime: 1653840000,
    dateStr: '2022.05.29',
    pgn: `[Event "Chessable Masters 2022"]
[Site "Chess.com"]
[Date "2022.05.29"]
[White "Carlsen, Magnus"]
[Black "Ding, Liren"]
[Result "1-0"]

1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Bc5 7. O-O O-O 8. d3 Bb6 9. Bd2 Nde7 10. Na4 f6 11. b4 Be6 12. b5 Nd4 13. Nxd4 exd4 14. Bxb7 Rb8 15. Bg2 Bd5 16. Bxd5+ Qxd5 17. Qb3 Qxb3 18. axb3 Nd5 19. Rfc1 Rfe8 20. Kf1 Re6 21. Rc4 Rbe8 22. Re1 1-0`,
  },
];

export async function fetchChessComGames(username: string): Promise<ChessComGame[]> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) return [];

  try {
    // 1. Fetch archives list
    const archivesRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(cleanUsername)}/games/archives`, {
      headers: {
        'User-Agent': 'AveluxGrandChessReviewer/1.0',
      },
    });

    if (!archivesRes.ok) {
      throw new Error(`Player "${username}" not found on Chess.com (HTTP ${archivesRes.status})`);
    }

    const archivesData = await archivesRes.json();
    const archives: string[] = archivesData.archives || [];

    if (archives.length === 0) {
      throw new Error(`No games found for player "${username}".`);
    }

    // Pick the most recent archive URL (last in the array)
    const latestArchiveUrl = archives[archives.length - 1];

    const gamesRes = await fetch(latestArchiveUrl, {
      headers: {
        'User-Agent': 'AveluxGrandChessReviewer/1.0',
      },
    });

    if (!gamesRes.ok) {
      throw new Error(`Failed to load games from latest archive (HTTP ${gamesRes.status})`);
    }

    const gamesData = await gamesRes.json();
    const rawGames: Array<{
      url: string;
      pgn: string;
      fen?: string;
      time_control: string;
      time_class: string;
      rated: boolean;
      end_time: number;
      white: { username: string; rating: number; result: string; '@id'?: string };
      black: { username: string; rating: number; result: string; '@id'?: string };
    }> = gamesData.games || [];

    // Filter games with valid PGN and sort newest first
    const parsedGames: ChessComGame[] = rawGames
      .filter((g) => g.pgn && g.pgn.length > 20)
      .slice(-30) // last 30 games
      .reverse()
      .map((g, idx) => ({
        id: `chesscom-${g.end_time || Date.now()}-${idx}`,
        url: g.url || '',
        pgn: g.pgn,
        fen: g.fen,
        timeControl: formatTimeControl(g.time_control, g.time_class),
        timeClass: g.time_class || 'game',
        rated: !!g.rated,
        endTime: g.end_time,
        dateStr: new Date((g.end_time || 0) * 1000).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        white: {
          username: g.white?.username || 'White',
          rating: g.white?.rating || 1500,
          result: g.white?.result || 'unknown',
        },
        black: {
          username: g.black?.username || 'Black',
          rating: g.black?.rating || 1500,
          result: g.black?.result || 'unknown',
        },
      }));

    return parsedGames;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
}

function formatTimeControl(tc: string, timeClass: string): string {
  if (!tc) return timeClass.toUpperCase();
  if (tc.includes('+')) {
    const [base, inc] = tc.split('+');
    const baseMin = Math.round(parseInt(base, 10) / 60);
    return `${baseMin}+${inc} ${timeClass}`;
  }
  const baseSec = parseInt(tc, 10);
  if (!isNaN(baseSec)) {
    const baseMin = Math.round(baseSec / 60);
    return `${baseMin} min ${timeClass}`;
  }
  return `${tc} ${timeClass}`;
}
