/**
 * Comprehensive ECO (Encyclopaedia of Chess Openings) database
 * Matches move prefix sequences to identify opening name, ECO code, and variation.
 */

export interface OpeningInfo {
  eco: string;
  name: string;
  variation?: string;
  moves: string[];
}

const OPENINGS_DATA: { eco: string; name: string; variation?: string; moves: string }[] = [
  // A - Flank Openings & Indian Defenses
  { eco: 'A00', name: 'Uncommon Opening', moves: 'a3' },
  { eco: 'A00', name: 'Polish / Sokolsky Opening', moves: 'b4' },
  { eco: 'A00', name: 'Grob Opening', moves: 'g4' },
  { eco: 'A01', name: 'Nimzo-Larsen Attack', moves: 'b3' },
  { eco: 'A04', name: 'Réti Opening', moves: 'Nf3' },
  { eco: 'A05', name: 'King\'s Indian Attack', moves: 'Nf3 Nf6 g3 g6 Bg2 Bg7 O-O O-O d3' },
  { eco: 'A10', name: 'English Opening', moves: 'c4' },
  { eco: 'A15', name: 'English Opening', variation: 'Anglo-Indian Defense', moves: 'c4 Nf6' },
  { eco: 'A20', name: 'English Opening', variation: 'King\'s English Variation', moves: 'c4 e5' },
  { eco: 'A22', name: 'English Opening', variation: 'Two Knights Variation', moves: 'c4 e5 Nc3 Nf6' },
  { eco: 'A30', name: 'English Opening', variation: 'Symmetrical Variation', moves: 'c4 c5' },
  { eco: 'A40', name: 'Queen\'s Pawn Game', moves: 'd4' },
  { eco: 'A45', name: 'Trompowsky Attack', moves: 'd4 Nf6 Bg5' },
  { eco: 'A46', name: 'Torre Attack', moves: 'd4 Nf6 Nf3 e6 Bg5' },
  { eco: 'A48', name: 'London System', moves: 'd4 Nf6 Nf3 g6 Bf4' },
  { eco: 'A46', name: 'London System', moves: 'd4 d5 Nf3 Nf6 Bf4' },
  { eco: 'A51', name: 'Budapest Gambit', moves: 'd4 Nf6 c4 e5' },
  { eco: 'A56', name: 'Benoni Defense', moves: 'd4 Nf6 c4 c5' },
  { eco: 'A80', name: 'Dutch Defense', moves: 'd4 f5' },

  // B - Semi-Open Games (excluding French)
  { eco: 'B00', name: 'King\'s Pawn Game', moves: 'e4' },
  { eco: 'B01', name: 'Scandinavian Defense', moves: 'e4 d5' },
  { eco: 'B01', name: 'Scandinavian Defense', variation: 'Mieses-Kotroc Variation', moves: 'e4 d5 exd5 Qxd5' },
  { eco: 'B02', name: 'Alekhine\'s Defense', moves: 'e4 Nf6' },
  { eco: 'B06', name: 'Modern Defense', moves: 'e4 g6' },
  { eco: 'B07', name: 'Pirc Defense', moves: 'e4 d6 d4 Nf6 Nc3 g6' },
  { eco: 'B10', name: 'Caro-Kann Defense', moves: 'e4 c6' },
  { eco: 'B12', name: 'Caro-Kann Defense', variation: 'Advance Variation', moves: 'e4 c6 d4 d5 e5' },
  { eco: 'B13', name: 'Caro-Kann Defense', variation: 'Exchange Variation', moves: 'e4 c6 d4 d5 exd5 cxd5' },
  { eco: 'B15', name: 'Caro-Kann Defense', variation: 'Classical / Main Line', moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4' },
  { eco: 'B18', name: 'Caro-Kann Defense', variation: 'Classical, Tartakower', moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5' },
  { eco: 'B20', name: 'Sicilian Defense', moves: 'e4 c5' },
  { eco: 'B21', name: 'Sicilian Defense', variation: 'Grand Prix Attack', moves: 'e4 c5 f4' },
  { eco: 'B21', name: 'Sicilian Defense', variation: 'Smith-Morra Gambit', moves: 'e4 c5 d4 cxd4 c3' },
  { eco: 'B22', name: 'Sicilian Defense', variation: 'Alapin Variation', moves: 'e4 c5 c3' },
  { eco: 'B23', name: 'Sicilian Defense', variation: 'Closed Sicilian', moves: 'e4 c5 Nc3' },
  { eco: 'B27', name: 'Sicilian Defense', variation: 'Hyperaccelerated Dragon', moves: 'e4 c5 Nf3 g6' },
  { eco: 'B30', name: 'Sicilian Defense', variation: 'Old Sicilian', moves: 'e4 c5 Nf3 Nc6' },
  { eco: 'B32', name: 'Sicilian Defense', variation: 'Open, Löwenthal / Kalashnikov', moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 e5' },
  { eco: 'B33', name: 'Sicilian Defense', variation: 'Sveshnikov Variation', moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5' },
  { eco: 'B40', name: 'Sicilian Defense', variation: 'French Variation', moves: 'e4 c5 Nf3 e6' },
  { eco: 'B41', name: 'Sicilian Defense', variation: 'Kan Variation', moves: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6' },
  { eco: 'B44', name: 'Sicilian Defense', variation: 'Taimanov Variation', moves: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6' },
  { eco: 'B50', name: 'Sicilian Defense', variation: 'Modern Variation', moves: 'e4 c5 Nf3 d6' },
  { eco: 'B52', name: 'Sicilian Defense', variation: 'Canal-Sokolsky / Moscow Attack', moves: 'e4 c5 Nf3 d6 Bb5+ Bd7' },
  { eco: 'B70', name: 'Sicilian Defense', variation: 'Dragon Variation', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6' },
  { eco: 'B75', name: 'Sicilian Defense', variation: 'Dragon, Yugoslav Attack', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3' },
  { eco: 'B80', name: 'Sicilian Defense', variation: 'Scheveningen Variation', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6' },
  { eco: 'B90', name: 'Sicilian Defense', variation: 'Najdorf Variation', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6' },
  { eco: 'B92', name: 'Sicilian Defense', variation: 'Najdorf, Opocensky / Be2', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2' },
  { eco: 'B96', name: 'Sicilian Defense', variation: 'Najdorf, Main Line with Bg5', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5' },

  // C - Open Games & French Defense
  { eco: 'C00', name: 'French Defense', moves: 'e4 e6' },
  { eco: 'C02', name: 'French Defense', variation: 'Advance Variation', moves: 'e4 e6 d4 d5 e5' },
  { eco: 'C03', name: 'French Defense', variation: 'Tarrasch Variation', moves: 'e4 e6 d4 d5 Nd2' },
  { eco: 'C10', name: 'French Defense', variation: 'Rubinstein Variation', moves: 'e4 e6 d4 d5 Nc3 dxe4' },
  { eco: 'C11', name: 'French Defense', variation: 'Classical Variation', moves: 'e4 e6 d4 d5 Nc3 Nf6' },
  { eco: 'C15', name: 'French Defense', variation: 'Winawer Variation', moves: 'e4 e6 d4 d5 Nc3 Bb4' },
  { eco: 'C20', name: 'King\'s Pawn Game', moves: 'e4 e5' },
  { eco: 'C21', name: 'Danish Gambit', moves: 'e4 e5 d4 exd4 c3' },
  { eco: 'C23', name: 'Bishop\'s Opening', moves: 'e4 e5 Bc4' },
  { eco: 'C25', name: 'Vienna Game', moves: 'e4 e5 Nc3' },
  { eco: 'C30', name: 'King\'s Gambit', moves: 'e4 e5 f4' },
  { eco: 'C33', name: 'King\'s Gambit Accepted', moves: 'e4 e5 f4 exf4' },
  { eco: 'C40', name: 'King\'s Knight Opening', moves: 'e4 e5 Nf3' },
  { eco: 'C41', name: 'Philidor Defense', moves: 'e4 e5 Nf3 d6' },
  { eco: 'C42', name: 'Petrov\'s Defense / Russian Game', moves: 'e4 e5 Nf3 Nf6' },
  { eco: 'C44', name: 'Scotch Game', moves: 'e4 e5 Nf3 Nc6 d4' },
  { eco: 'C45', name: 'Scotch Game', variation: 'Mieses Variation', moves: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6' },
  { eco: 'C46', name: 'Three Knights Opening', moves: 'e4 e5 Nf3 Nc6 Nc3' },
  { eco: 'C47', name: 'Four Knights Game', moves: 'e4 e5 Nf3 Nc6 Nc3 Nf6' },
  { eco: 'C50', name: 'Italian Game', moves: 'e4 e5 Nf3 Nc6 Bc4' },
  { eco: 'C50', name: 'Italian Game', variation: 'Giuoco Piano', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5' },
  { eco: 'C51', name: 'Evans Gambit', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4' },
  { eco: 'C53', name: 'Italian Game', variation: 'Giuoco Pianissimo', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3' },
  { eco: 'C55', name: 'Two Knights Defense', moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6' },
  { eco: 'C57', name: 'Two Knights Defense', variation: 'Fried Liver Attack', moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7' },
  { eco: 'C60', name: 'Ruy Lopez / Spanish Opening', moves: 'e4 e5 Nf3 Nc6 Bb5' },
  { eco: 'C65', name: 'Ruy Lopez', variation: 'Berlin Defense', moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6' },
  { eco: 'C67', name: 'Ruy Lopez', variation: 'Berlin Defense, Open / Endgame', moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4' },
  { eco: 'C68', name: 'Ruy Lopez', variation: 'Exchange Variation', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6' },
  { eco: 'C70', name: 'Ruy Lopez', variation: 'Morphy Defense', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4' },
  { eco: 'C78', name: 'Ruy Lopez', variation: 'Archangelsk Variation', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O b5 Bb3 Bb7' },
  { eco: 'C80', name: 'Ruy Lopez', variation: 'Open Defense', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4' },
  { eco: 'C84', name: 'Ruy Lopez', variation: 'Closed Defense', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7' },
  { eco: 'C88', name: 'Ruy Lopez', variation: 'Closed, Anti-Marshall', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O a4' },
  { eco: 'C89', name: 'Ruy Lopez', variation: 'Marshall Attack', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5' },

  // D - Closed Games & Semi-Closed Games
  { eco: 'D00', name: 'Queen\'s Pawn Game', variation: 'Chigorin / Mason', moves: 'd4 d5' },
  { eco: 'D02', name: 'London System', variation: 'Classical d5', moves: 'd4 d5 Nf3 Nf6 Bf4' },
  { eco: 'D06', name: 'Queen\'s Gambit', moves: 'd4 d5 c4' },
  { eco: 'D10', name: 'Slav Defense', moves: 'd4 d5 c4 c6' },
  { eco: 'D11', name: 'Slav Defense', variation: 'Modern Slav', moves: 'd4 d5 c4 c6 Nf3 Nf6' },
  { eco: 'D20', name: 'Queen\'s Gambit Accepted', moves: 'd4 d5 c4 dxc4' },
  { eco: 'D30', name: 'Queen\'s Gambit Declined', moves: 'd4 d5 c4 e6' },
  { eco: 'D35', name: 'Queen\'s Gambit Declined', variation: 'Exchange Variation', moves: 'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5' },
  { eco: 'D37', name: 'Queen\'s Gambit Declined', variation: 'Classical 4.Nf3', moves: 'd4 d5 c4 e6 Nc3 Nf6 Nf3' },
  { eco: 'D43', name: 'Semi-Slav Defense', moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6' },
  { eco: 'D45', name: 'Semi-Slav Defense', variation: 'Meran Variation', moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5' },
  { eco: 'D55', name: 'Queen\'s Gambit Declined', variation: 'Main Line with Bg5', moves: 'd4 d5 c4 e6 Nc3 Nf6 Nf3 Be7 Bg5' },
  { eco: 'D70', name: 'Neo-Grünfeld Defense', moves: 'd4 Nf6 c4 g6 g3 d5' },
  { eco: 'D80', name: 'Grünfeld Defense', moves: 'd4 Nf6 c4 g6 Nc3 d5' },
  { eco: 'D85', name: 'Grünfeld Defense', variation: 'Exchange Variation', moves: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3' },

  // E - Indian Defenses
  { eco: 'E00', name: 'Queen\'s Pawn Game', variation: 'Catalan Style', moves: 'd4 Nf6 c4 e6 g3' },
  { eco: 'E01', name: 'Catalan Opening', moves: 'd4 Nf6 c4 e6 g3 d5 Bg2' },
  { eco: 'E06', name: 'Catalan Opening', variation: 'Closed Variation', moves: 'd4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O' },
  { eco: 'E12', name: 'Queen\'s Indian Defense', moves: 'd4 Nf6 c4 e6 Nf3 b6' },
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: 'd4 Nf6 c4 e6 Nc3 Bb4' },
  { eco: 'E32', name: 'Nimzo-Indian Defense', variation: 'Classical / Capablanca Variation', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2' },
  { eco: 'E40', name: 'Nimzo-Indian Defense', variation: 'Rubinstein System', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 e3' },
  { eco: 'E60', name: 'King\'s Indian Defense', moves: 'd4 Nf6 c4 g6' },
  { eco: 'E61', name: 'King\'s Indian Defense', moves: 'd4 Nf6 c4 g6 Nc3 Bg7' },
  { eco: 'E70', name: 'King\'s Indian Defense', variation: 'Classical System', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6' },
  { eco: 'E90', name: 'King\'s Indian Defense', variation: 'Main Line Classical', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5' },
  { eco: 'E97', name: 'King\'s Indian Defense', variation: 'Orthodox Aronin-Taimanov', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7' },
];

/**
 * Identify opening by matching against SAN move sequence
 */
export function identifyOpening(sanMoves: string[]): OpeningInfo {
  if (!sanMoves || sanMoves.length === 0) {
    return { eco: 'A00', name: 'Chess Game', moves: [] };
  }

  // Normalize played moves (remove checks '+' or '#' or evaluations for pure move matching)
  const cleanMoves = sanMoves.map((m) => m.replace(/[+#?!]/g, '').trim());

  let bestMatch: OpeningInfo = {
    eco: 'A00',
    name: 'Uncommon Opening',
    moves: cleanMoves.slice(0, 2),
  };
  let maxMatchedPlies = 0;

  for (const entry of OPENINGS_DATA) {
    const entryMoves = entry.moves.split(' ').map((m) => m.trim());
    if (entryMoves.length > cleanMoves.length) continue;

    let match = true;
    for (let i = 0; i < entryMoves.length; i++) {
      if (entryMoves[i] !== cleanMoves[i]) {
        match = false;
        break;
      }
    }

    if (match && entryMoves.length > maxMatchedPlies) {
      maxMatchedPlies = entryMoves.length;
      bestMatch = {
        eco: entry.eco,
        name: entry.name,
        variation: entry.variation,
        moves: entryMoves,
      };
    }
  }

  return bestMatch;
}
