import { useState, useCallback, useEffect } from "react";

const OWNER_GPAY = "8754992499@upi"; // TODO: Replace with your UPI ID

// --- Chess Logic ---
const PIECES = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

function initBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRow = ["R","N","B","Q","K","B","N","R"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = "b" + backRow[c];
    b[1][c] = "bP";
    b[6][c] = "wP";
    b[7][c] = "b".replace("b","w") + backRow[c];
    b[7][c] = "w" + backRow[c];
  }
  return b;
}

function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function color(p) { return p ? p[0] : null; }
function enemy(p, turn) { return p && color(p) !== turn; }
function friendly(p, turn) { return p && color(p) === turn; }

function getMoves(board, r, c, turn, lastMove) {
  const piece = board[r][c];
  if (!piece || color(piece) !== turn) return [];
  const type = piece[1];
  const moves = [];
  const add = (tr, tc) => {
    if (inBounds(tr, tc) && !friendly(board[tr][tc], turn)) moves.push([tr, tc]);
  };
  const slide = (dr, dc) => {
    let tr = r + dr, tc = c + dc;
    while (inBounds(tr, tc)) {
      if (friendly(board[tr][tc], turn)) break;
      moves.push([tr, tc]);
      if (enemy(board[tr][tc], turn)) break;
      tr += dr; tc += dc;
    }
  };

  if (type === "P") {
    const dir = turn === "w" ? -1 : 1;
    const start = turn === "w" ? 6 : 1;
    if (inBounds(r+dir, c) && !board[r+dir][c]) {
      moves.push([r+dir, c]);
      if (r === start && !board[r+2*dir][c]) moves.push([r+2*dir, c]);
    }
    for (const dc of [-1, 1]) {
      if (inBounds(r+dir, c+dc) && enemy(board[r+dir][c+dc], turn)) moves.push([r+dir, c+dc]);
      // En passant
      if (lastMove && lastMove.piece === (turn === "w" ? "bP" : "wP") &&
          lastMove.to[0] === r && lastMove.to[1] === c+dc &&
          Math.abs(lastMove.from[0] - lastMove.to[0]) === 2) {
        moves.push([r+dir, c+dc]);
      }
    }
  } else if (type === "N") {
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr, c+dc);
  } else if (type === "B") {
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc);
  } else if (type === "R") {
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc);
  } else if (type === "Q") {
    for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc);
  } else if (type === "K") {
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r+dr, c+dc);
    // Castling (simplified)
    if (turn === "w" && r === 7) {
      if (!board[7][5] && !board[7][6] && board[7][7] === "wR") moves.push([7,6]);
      if (!board[7][3] && !board[7][2] && !board[7][1] && board[7][0] === "wR") moves.push([7,2]);
    }
    if (turn === "b" && r === 0) {
      if (!board[0][5] && !board[0][6] && board[0][7] === "bR") moves.push([0,6]);
      if (!board[0][3] && !board[0][2] && !board[0][1] && board[0][0] === "bR") moves.push([0,2]);
    }
  }
  return moves;
}

function findKing(board, turn) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === turn + "K") return [r, c];
  return null;
}

function isInCheck(board, turn) {
  const king = findKing(board, turn);
  if (!king) return false;
  const opp = turn === "w" ? "b" : "w";
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (color(board[r][c]) === opp) {
        const mvs = getMoves(board, r, c, opp, null);
        if (mvs.some(([tr,tc]) => tr === king[0] && tc === king[1])) return true;
      }
  return false;
}

function applyMove(board, from, to) {
  const nb = board.map(r => [...r]);
  const piece = nb[from[0]][from[1]];
  nb[to[0]][to[1]] = piece;
  nb[from[0]][from[1]] = null;
  // Castling rook move
  if (piece[1] === "K") {
    if (from[1] === 4 && to[1] === 6) { nb[from[0]][5] = nb[from[0]][7]; nb[from[0]][7] = null; }
    if (from[1] === 4 && to[1] === 2) { nb[from[0]][3] = nb[from[0]][0]; nb[from[0]][0] = null; }
  }
  // Pawn promotion
  if (piece === "wP" && to[0] === 0) nb[to[0]][to[1]] = "wQ";
  if (piece === "bP" && to[0] === 7) nb[to[0]][to[1]] = "bQ";
  return nb;
}

function getLegalMoves(board, r, c, turn, lastMove) {
  return getMoves(board, r, c, turn, lastMove).filter(([tr,tc]) => {
    const nb = applyMove(board, [r,c], [tr,tc]);
    return !isInCheck(nb, turn);
  });
}

function hasAnyLegalMoves(board, turn, lastMove) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (color(board[r][c]) === turn && getLegalMoves(board, r, c, turn, lastMove).length > 0)
        return true;
  return false;
}

// --- UI ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: #0a0a0f;
    font-family: 'Crimson Pro', serif;
    min-height: 100vh;
    color: #e8dcc8;
  }

  :root {
    --gold: #c9a84c;
    --gold-light: #f0d080;
    --dark: #0a0a0f;
    --surface: #12121a;
    --surface2: #1a1a26;
    --border: #2a2a3a;
    --text: #e8dcc8;
    --text-dim: #8a8070;
    --white-sq: #f0d9b5;
    --black-sq: #b58863;
    --highlight: rgba(201,168,76,0.45);
    --danger: #c0392b;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background: radial-gradient(ellipse at top, #1a1428 0%, #0a0a0f 60%);
  }

  .logo {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 6vw, 48px);
    font-weight: 900;
    color: var(--gold);
    letter-spacing: 3px;
    text-align: center;
    padding: 20px 0 4px;
    text-shadow: 0 0 40px rgba(201,168,76,0.3);
  }

  .tagline {
    font-size: 14px;
    color: var(--text-dim);
    letter-spacing: 4px;
    text-transform: uppercase;
    margin-bottom: 24px;
    text-align: center;
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 28px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.6);
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: var(--gold);
    margin-bottom: 6px;
  }

  .card-sub {
    font-size: 14px;
    color: var(--text-dim);
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .player-section {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .player-label {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .player-label span { font-size: 18px; }

  input {
    width: 100%;
    background: #0d0d15;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 11px 14px;
    color: var(--text);
    font-family: 'Crimson Pro', serif;
    font-size: 16px;
    margin-bottom: 10px;
    transition: border-color 0.2s;
    outline: none;
  }
  input:focus { border-color: var(--gold); }
  input::placeholder { color: var(--text-dim); }
  input:last-child { margin-bottom: 0; }

  .fee-box {
    background: linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03));
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .fee-item { text-align: center; }
  .fee-num {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: var(--gold-light);
    display: block;
  }
  .fee-label { font-size: 11px; color: var(--text-dim); letter-spacing: 1px; }
  .fee-arrow { color: var(--text-dim); font-size: 20px; }

  .btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #b8922a, #c9a84c, #b8922a);
    border: none;
    border-radius: 8px;
    color: #0a0a0f;
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    box-shadow: 0 4px 20px rgba(201,168,76,0.25);
  }
  .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(201,168,76,0.4); }
  .btn:active { transform: translateY(0); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
    font-size: 13px;
    letter-spacing: 1px;
    box-shadow: none;
    padding: 10px;
  }
  .btn-ghost:hover { border-color: var(--gold); color: var(--gold); box-shadow: none; }

  /* Game screen */
  .game-wrap {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .player-bar {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 16px;
  }

  .player-info { display: flex; align-items: center; gap: 10px; }
  .player-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    background: var(--surface2);
    border: 2px solid var(--border);
  }
  .player-name-bar {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    color: var(--text);
  }
  .player-gpay { font-size: 11px; color: var(--text-dim); }
  .active-indicator {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 8px var(--gold);
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .turn-banner {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    color: var(--gold);
    letter-spacing: 2px;
    text-align: center;
    padding: 8px 20px;
    background: rgba(201,168,76,0.07);
    border: 1px solid rgba(201,168,76,0.15);
    border-radius: 8px;
    width: 100%;
  }

  .board-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    max-width: 480px;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    width: 100%;
    height: 100%;
    border: 3px solid var(--gold);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 0 40px rgba(201,168,76,0.15), 0 8px 32px rgba(0,0,0,0.6);
  }

  .sq {
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    position: relative;
    transition: background 0.1s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .sq.light { background: var(--white-sq); }
  .sq.dark { background: var(--black-sq); }
  .sq.selected { background: var(--highlight) !important; }
  .sq.legal { background: rgba(201,168,76,0.25) !important; }
  .sq.legal::after {
    content: '';
    position: absolute;
    width: 30%;
    height: 30%;
    border-radius: 50%;
    background: rgba(201,168,76,0.6);
  }
  .sq.legal.has-piece::after { display: none; }
  .sq.legal.has-piece { box-shadow: inset 0 0 0 3px rgba(201,168,76,0.7); }
  .sq.in-check { background: rgba(192,57,43,0.55) !important; }

  .piece {
    font-size: clamp(22px, 5.5vw, 42px);
    line-height: 1;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
    z-index: 1;
    transition: transform 0.1s;
  }
  .sq:active .piece { transform: scale(0.92); }

  .coord-file {
    position: absolute;
    bottom: 1px;
    right: 2px;
    font-size: 9px;
    font-weight: 700;
    opacity: 0.5;
    color: inherit;
  }
  .coord-rank {
    position: absolute;
    top: 1px;
    left: 2px;
    font-size: 9px;
    font-weight: 700;
    opacity: 0.5;
  }

  /* Winner screen */
  .winner-wrap {
    width: 100%;
    max-width: 440px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .winner-crown {
    font-size: 64px;
    animation: float 2s ease-in-out infinite;
  }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

  .winner-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 7vw, 48px);
    font-weight: 900;
    color: var(--gold);
    text-shadow: 0 0 30px rgba(201,168,76,0.5);
  }

  .winner-name {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: var(--text);
    margin-top: -8px;
  }

  .payment-card {
    background: var(--surface);
    border: 1px solid rgba(201,168,76,0.3);
    border-radius: 12px;
    padding: 20px;
  }

  .payment-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    font-size: 15px;
  }
  .payment-row:last-child { border-bottom: none; }
  .payment-row .label { color: var(--text-dim); }
  .payment-row .value { color: var(--text); font-weight: 600; }
  .payment-row.total .label { color: var(--gold); font-family: 'Playfair Display', serif; }
  .payment-row.total .value { color: var(--gold-light); font-size: 20px; font-family: 'Playfair Display', serif; }

  .gpay-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px;
    background: #1a73e8;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(26,115,232,0.35);
  }
  .gpay-btn:hover { background: #1557b0; transform: translateY(-1px); }

  .platform-note {
    font-size: 12px;
    color: var(--text-dim);
    text-align: center;
    line-height: 1.6;
  }

  .check-badge {
    display: inline-block;
    background: rgba(192,57,43,0.2);
    border: 1px solid #c0392b;
    color: #e74c3c;
    font-size: 12px;
    letter-spacing: 2px;
    padding: 2px 10px;
    border-radius: 4px;
    text-transform: uppercase;
    margin-left: 8px;
    animation: shake 0.4s ease-in-out;
  }
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-4px)}
    40%{transform:translateX(4px)}
    60%{transform:translateX(-4px)}
    80%{transform:translateX(4px)}
  }

  .divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 4px 0;
  }

  @media (max-width: 380px) {
    .card { padding: 18px 14px; }
    .player-section { padding: 12px; }
  }
`;

function generateUPILink(pa, pn, amount, tn) {
  return `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${amount}&cu=INR&tn=${encodeURIComponent(tn)}`;
}

// ===================== LOBBY =====================
function LobbyScreen({ onStart }) {
  const [p1, setP1] = useState({ name: "", gpay: "" });
  const [p2, setP2] = useState({ name: "", gpay: "" });

  const canStart = p1.name.trim() && p1.gpay.trim() && p2.name.trim() && p2.gpay.trim();

  return (
    <div className="card">
      <div className="card-title">New Game</div>
      <div className="card-sub">Two players. One winner. The stakes are real.</div>

      <div className="fee-box">
        <div className="fee-item">
          <span className="fee-num">₹10</span>
          <span className="fee-label">Each Player</span>
        </div>
        <div className="fee-arrow">→</div>
        <div className="fee-item">
          <span className="fee-num">₹16</span>
          <span className="fee-label">Winner Gets</span>
        </div>
        <div className="fee-arrow">+</div>
        <div className="fee-item">
          <span className="fee-num">₹4</span>
          <span className="fee-label">Platform Fee</span>
        </div>
      </div>

      <div className="player-section">
        <div className="player-label"><span>♔</span> Player 1 — White</div>
        <input placeholder="Your name" value={p1.name} onChange={e => setP1({...p1, name: e.target.value})} />
        <input placeholder="GPay / UPI ID (e.g. 9876543210@upi)" value={p1.gpay} onChange={e => setP1({...p1, gpay: e.target.value})} />
      </div>

      <div className="player-section">
        <div className="player-label"><span>♚</span> Player 2 — Black</div>
        <input placeholder="Your name" value={p2.name} onChange={e => setP2({...p2, name: e.target.value})} />
        <input placeholder="GPay / UPI ID (e.g. 9876543210@upi)" value={p2.gpay} onChange={e => setP2({...p2, gpay: e.target.value})} />
      </div>

      <button className="btn" disabled={!canStart} onClick={() => onStart(p1, p2)}>
        Start Match
      </button>
    </div>
  );
}

// ===================== BOARD =====================
function GameScreen({ players, onGameOver }) {
  const [board, setBoard] = useState(initBoard);
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [inCheck, setInCheck] = useState(false);
  const [status, setStatus] = useState(""); // checkmate / stalemate

  const currentPlayer = turn === "w" ? players[0] : players[1];

  const handleSquare = useCallback((r, c) => {
    if (status) return;
    const piece = board[r][c];

    if (selected) {
      const isLegal = legalMoves.some(([lr,lc]) => lr === r && lc === c);
      if (isLegal) {
        const nb = applyMove(board, selected, [r, c]);
        const nextTurn = turn === "w" ? "b" : "w";
        const lm = { piece: board[selected[0]][selected[1]], from: selected, to: [r,c] };

        setBoard(nb);
        setLastMove(lm);
        setSelected(null);
        setLegalMoves([]);

        const check = isInCheck(nb, nextTurn);
        setInCheck(check);

        if (!hasAnyLegalMoves(nb, nextTurn, lm)) {
          const winner = check ? turn : null; // null = stalemate
          setTimeout(() => onGameOver(winner, nb), 200);
          setStatus(check ? "checkmate" : "stalemate");
          return;
        }
        setTurn(nextTurn);
        return;
      }
      if (friendly(piece, turn)) {
        const moves = getLegalMoves(board, r, c, turn, lastMove);
        setSelected([r, c]);
        setLegalMoves(moves);
        return;
      }
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    if (friendly(piece, turn)) {
      const moves = getLegalMoves(board, r, c, turn, lastMove);
      setSelected([r, c]);
      setLegalMoves(moves);
    }
  }, [board, turn, selected, legalMoves, lastMove, status, onGameOver]);

  const kingPos = inCheck ? findKing(board, turn) : null;

  return (
    <div className="game-wrap">
      {/* Black player bar (top) */}
      <div className="player-bar">
        <div className="player-info">
          <div className="player-avatar">♚</div>
          <div>
            <div className="player-name-bar">{players[1].name}</div>
            <div className="player-gpay">{players[1].gpay}</div>
          </div>
        </div>
        {turn === "b" && !status && <div className="active-indicator" />}
      </div>

      {/* Turn banner */}
      <div className="turn-banner">
        {status === "checkmate" ? `Checkmate — ${turn === "w" ? players[1].name : players[0].name} wins!`
         : status === "stalemate" ? "Stalemate — Draw!"
         : `${currentPlayer.name}'s turn ${inCheck ? "— CHECK ⚠" : ""}`}
      </div>

      {/* Board */}
      <div className="board-wrap">
        <div className="board">
          {board.map((row, r) => row.map((piece, c) => {
            const isLight = (r + c) % 2 === 0;
            const isSel = selected && selected[0] === r && selected[1] === c;
            const isLegal = legalMoves.some(([lr,lc]) => lr === r && lc === c);
            const isKingCheck = kingPos && kingPos[0] === r && kingPos[1] === c;
            let cls = `sq ${isLight ? "light" : "dark"}`;
            if (isSel) cls += " selected";
            else if (isLegal) cls += " legal";
            if (isKingCheck) cls += " in-check";
            if (isLegal && piece) cls += " has-piece";
            return (
              <div key={`${r}${c}`} className={cls} onClick={() => handleSquare(r, c)}>
                {piece && <span className="piece">{PIECES[piece]}</span>}
                {c === 0 && <span className="coord-rank" style={{color: isLight?"#b58863":"#f0d9b5"}}>{8-r}</span>}
                {r === 7 && <span className="coord-file" style={{color: isLight?"#b58863":"#f0d9b5"}}>{"abcdefgh"[c]}</span>}
              </div>
            );
          }))}
        </div>
      </div>

      {/* White player bar (bottom) */}
      <div className="player-bar">
        <div className="player-info">
          <div className="player-avatar">♔</div>
          <div>
            <div className="player-name-bar">{players[0].name}</div>
            <div className="player-gpay">{players[0].gpay}</div>
          </div>
        </div>
        {turn === "w" && !status && <div className="active-indicator" />}
      </div>
    </div>
  );
}

// ===================== WINNER =====================
function WinnerScreen({ winner, players, onPlayAgain }) {
  const winnerPlayer = winner === "w" ? players[0] : winner === "b" ? players[1] : null;
  const loserPlayer = winner === "w" ? players[1] : winner === "b" ? players[0] : null;

  const winnerUPI = generateUPILink(
    winnerPlayer?.gpay || "",
    winnerPlayer?.name || "",
    16,
    `Chess winnings from ${loserPlayer?.name}`
  );

  const platformUPI = generateUPILink(
    OWNER_GPAY,
    "ChessApp",
    4,
    `Platform fee from ${players[0].name} vs ${players[1].name}`
  );

  return (
    <div className="winner-wrap">
      <div>
        <div className="winner-crown">{winnerPlayer ? "👑" : "🤝"}</div>
        <div className="winner-title">{winnerPlayer ? "Victory!" : "Draw!"}</div>
        {winnerPlayer && <div className="winner-name">{winnerPlayer.name} wins the match</div>}
      </div>

      <div className="payment-card">
        <div style={{fontFamily:"'Playfair Display',serif", color:"var(--gold)", marginBottom:14, fontSize:16}}>
          Payment Summary
        </div>
        <div className="payment-row">
          <span className="label">{players[0].name} paid</span>
          <span className="value">₹10</span>
        </div>
        <div className="payment-row">
          <span className="label">{players[1].name} paid</span>
          <span className="value">₹10</span>
        </div>
        <div className="payment-row">
          <span className="label">Platform fee (₹2 × 2)</span>
          <span className="value">₹4</span>
        </div>
        <div className="payment-row total">
          <span className="label">{winnerPlayer ? `${winnerPlayer.name} receives` : "Refund each"}</span>
          <span className="value">₹{winnerPlayer ? 16 : 10}</span>
        </div>
      </div>

      {winnerPlayer && (
        <>
          <a className="gpay-btn" href={winnerUPI}>
            <span style={{fontSize:20}}>📱</span>
            Pay ₹16 to {winnerPlayer.name} via GPay
          </a>

          <a className="gpay-btn" href={platformUPI} style={{background:"#2d6a4f", boxShadow:"0 4px 20px rgba(45,106,79,0.35)"}}>
            <span style={{fontSize:20}}>💼</span>
            Pay ₹4 Platform Fee via GPay
          </a>

          <div className="platform-note">
            Tap the buttons above to open Google Pay / any UPI app.<br />
            Winner's UPI: <strong style={{color:"var(--text)"}}>{winnerPlayer.gpay}</strong>
          </div>
        </>
      )}

      <button className="btn btn-ghost" onClick={onPlayAgain}>
        New Game
      </button>
    </div>
  );
}

// ===================== APP =====================
export default function App() {
  const [screen, setScreen] = useState("lobby"); // lobby | game | winner
  const [players, setPlayers] = useState(null);
  const [winner, setWinner] = useState(null);

  const handleStart = (p1, p2) => {
    setPlayers([p1, p2]);
    setScreen("game");
  };

  const handleGameOver = (w) => {
    setWinner(w);
    setScreen("winner");
  };

  const handlePlayAgain = () => {
    setPlayers(null);
    setWinner(null);
    setScreen("lobby");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="logo">♟ CHECKMATE</div>
        <div className="tagline">Real Stakes · Real Chess</div>

        {screen === "lobby" && <LobbyScreen onStart={handleStart} />}
        {screen === "game" && players && (
          <GameScreen players={players} onGameOver={handleGameOver} />
        )}
        {screen === "winner" && players && (
          <WinnerScreen winner={winner} players={players} onPlayAgain={handlePlayAgain} />
        )}
      </div>
    </>
  );
}
