import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dmcjbzyyfgmezqmrvmco.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ofp9kSxXEco5WzyI4XVN8Q_gO9mk-jz";
const ADMIN_PIN    = "1234";
const DEFAULT_UPI  = "your_upi_id@upi"; // 👈 Replace with your UPI
const SESSION_KEY  = "chessbet_v2";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─────────────────────────────────────────────────────────
//  PIECE IMAGES — lichess open-source "cburnett" set
//  (same style used on Chess.com — classic Staunton)
// ─────────────────────────────────────────────────────────
const BASE = "https://lichess1.org/assets/piece/cburnett/";
const PIECE_IMG = {
  wK: BASE + "wK.svg", wQ: BASE + "wQ.svg", wR: BASE + "wR.svg",
  wB: BASE + "wB.svg", wN: BASE + "wN.svg", wP: BASE + "wP.svg",
  bK: BASE + "bK.svg", bQ: BASE + "bQ.svg", bR: BASE + "bR.svg",
  bB: BASE + "bB.svg", bN: BASE + "bN.svg", bP: BASE + "bP.svg",
};

function Piece({ code, small }) {
  if (!PIECE_IMG[code]) return null;
  const sz = small ? "13px" : "100%";
  return (
    <img
      src={PIECE_IMG[code]}
      alt={code}
      draggable={false}
      style={{
        width: sz, height: sz,
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────
//  SESSION — survives page refresh
// ─────────────────────────────────────────────────────────
const saveSession  = d => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(d)); } catch(e) {} };
const loadSession  = ()=> { try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; } };
const clearSession = ()=> { try { localStorage.removeItem(SESSION_KEY); } catch(e) {} };

// ─────────────────────────────────────────────────────────
//  CHESS ENGINE — bulletproof
// ─────────────────────────────────────────────────────────
function initBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  ["R","N","B","Q","K","B","N","R"].forEach((p,c) => { b[0][c]="b"+p; b[7][c]="w"+p; });
  for (let c=0;c<8;c++) { b[1][c]="bP"; b[6][c]="wP"; }
  return b;
}
const col = p => p ? p[0] : null;
const opp = t => t==="w" ? "b" : "w";
const inBounds = (r,c) => r>=0&&r<8&&c>=0&&c<8;

function pseudoMoves(board, r, c, lm) {
  const p = board[r][c]; if (!p) return [];
  const t = col(p), tp = p[1], mv = [];
  const push = (tr,tc) => { if (inBounds(tr,tc) && col(board[tr][tc])!==t) mv.push([tr,tc]); };
  const ray  = (dr,dc) => { let tr=r+dr,tc=c+dc; while(inBounds(tr,tc)){ if(col(board[tr][tc])===t) break; mv.push([tr,tc]); if(board[tr][tc]) break; tr+=dr; tc+=dc; }};
  switch(tp) {
    case "P": {
      const d=t==="w"?-1:1, sr=t==="w"?6:1;
      if (inBounds(r+d,c)&&!board[r+d][c]) { mv.push([r+d,c]); if(r===sr&&!board[r+2*d][c]) mv.push([r+2*d,c]); }
      [-1,1].forEach(dc => {
        if (!inBounds(r+d,c+dc)) return;
        if (col(board[r+d][c+dc])===opp(t)) mv.push([r+d,c+dc]);
        if (lm&&lm.piece===opp(t)+"P"&&lm.to[0]===r&&lm.to[1]===c+dc&&Math.abs(lm.from[0]-lm.to[0])===2) mv.push([r+d,c+dc]);
      });
      break;
    }
    case "N": [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>push(r+dr,c+dc)); break;
    case "B": [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>ray(dr,dc)); break;
    case "R": [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>ray(dr,dc)); break;
    case "Q": [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>ray(dr,dc)); break;
    case "K": {
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>push(r+dr,c+dc));
      if(t==="w"&&r===7&&c===4){ if(!board[7][5]&&!board[7][6]&&board[7][7]==="wR") mv.push([7,6]); if(!board[7][3]&&!board[7][2]&&!board[7][1]&&board[7][0]==="wR") mv.push([7,2]); }
      if(t==="b"&&r===0&&c===4){ if(!board[0][5]&&!board[0][6]&&board[0][7]==="bR") mv.push([0,6]); if(!board[0][3]&&!board[0][2]&&!board[0][1]&&board[0][0]==="bR") mv.push([0,2]); }
      break;
    }
    default: break;
  }
  return mv;
}

function execMove(board, from, to) {
  const nb = board.map(r=>[...r]);
  const p = nb[from[0]][from[1]];
  nb[to[0]][to[1]] = p; nb[from[0]][from[1]] = null;
  if (p[1]==="K") {
    if (from[1]===4&&to[1]===6) { nb[from[0]][5]=nb[from[0]][7]; nb[from[0]][7]=null; }
    if (from[1]===4&&to[1]===2) { nb[from[0]][3]=nb[from[0]][0]; nb[from[0]][0]=null; }
  }
  if (p[1]==="P"&&from[1]!==to[1]&&!board[to[0]][to[1]]) nb[from[0]][to[1]]=null; // en passant
  if (p==="wP"&&to[0]===0) nb[0][to[1]]="wQ";
  if (p==="bP"&&to[0]===7) nb[7][to[1]]="bQ";
  return nb;
}

function kingPos(board, t) {
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (board[r][c]===t+"K") return [r,c];
  return null;
}

function isAttacked(board, r, c, byColor) {
  for (let pr=0;pr<8;pr++) for (let pc=0;pc<8;pc++) {
    if (col(board[pr][pc])!==byColor) continue;
    if (pseudoMoves(board,pr,pc,null).some(([tr,tc])=>tr===r&&tc===c)) return true;
  }
  return false;
}

function inCheck(board, t) {
  const k = kingPos(board,t); if (!k) return false;
  return isAttacked(board, k[0], k[1], opp(t));
}

function legalMoves(board, r, c, lm) {
  const t = col(board[r][c]); if (!t) return [];
  return pseudoMoves(board,r,c,lm).filter(([tr,tc]) => !inCheck(execMove(board,[r,c],[tr,tc]), t));
}

function hasLegalMoves(board, t, lm) {
  for (let r=0;r<8;r++) for (let c=0;c<8;c++)
    if (col(board[r][c])===t && legalMoves(board,r,c,lm).length>0) return true;
  return false;
}

// Returns game result after a move
function gameResult(board, turnToMove, lastMove) {
  if (!hasLegalMoves(board, turnToMove, lastMove)) {
    if (inCheck(board, turnToMove)) return { over:true, winner:opp(turnToMove), reason:"checkmate" };
    return { over:true, winner:"draw", reason:"stalemate" };
  }
  return { over:false };
}

function getCaptured(board) {
  const start = {wP:8,wN:2,wB:2,wR:2,wQ:1,bP:8,bN:2,bB:2,bR:2,bQ:1};
  const live = {};
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]) live[board[r][c]]=(live[board[r][c]]||0)+1;
  const cap={w:[],b:[]};
  Object.entries(start).forEach(([k,v])=>{ const m=v-(live[k]||0); for(let i=0;i<m;i++) cap[k[0]].push(k); });
  return cap;
}

const mkCode  = () => Math.floor(1000+Math.random()*9000).toString();
const upiLink = (pa,pn,am,tn) => `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;
const fmt     = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

// ─────────────────────────────────────────────────────────
//  FAST SYNC — 500ms polling + realtime
// ─────────────────────────────────────────────────────────
function useSync(gameId, cb, enabled=true) {
  const snap = useRef(null);
  useEffect(() => {
    if (!gameId || !enabled) return;
    const ch = supabase.channel("rc_"+gameId)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"games",filter:`id=eq.${gameId}`},
        p => { snap.current=p.new; cb(p.new); })
      .subscribe();
    const iv = setInterval(async()=>{
      const {data} = await supabase.from("games").select("*").eq("id",gameId).single();
      if (!data) return;
      const prev = snap.current;
      const changed = !prev
        || prev.board      !== data.board
        || prev.turn       !== data.turn
        || prev.status     !== data.status
        || prev.p1_paid    !== data.p1_paid
        || prev.p2_paid    !== data.p2_paid
        || prev.draw_offer !== data.draw_offer
        || prev.chat_log   !== data.chat_log
        || prev.winner     !== data.winner;
      if (changed) { snap.current=data; cb(data); }
    }, 500);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, [gameId, enabled]);
}

// ─────────────────────────────────────────────────────────
//  STYLES — Chess.com dark look
// ─────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#161512; font-family:'Noto Sans',sans-serif; color:#e0d9cc; -webkit-font-smoothing:antialiased; min-height:100vh; }
button,input,select { font-family:inherit; }

:root {
  --bg:      #161512;
  --nav:     #21201d;
  --card:    #2c2b27;
  --card2:   #363533;
  --border:  #403e3a;
  --border2: #524f49;
  --sq-l:    #f0d9b5;
  --sq-d:    #b58863;
  --sq-sel:  rgba(20,85,30,0.5);
  --sq-lm:   rgba(20,85,30,0.5);
  --sq-last: rgba(155,135,0,0.41);
  --sq-chk:  rgba(220,40,40,0.8);
  --green:   #81b64c;
  --gd:      #5b8a32;
  --gl:      #a0d060;
  --text:    #dbd7cf;
  --dim:     #8a8070;
  --dim2:    #5a5448;
  --gold:    #e5a020;
  --danger:  #df5353;
  --blue:    #5b9bd5;
}

/* ── LAYOUT ── */
.app    { min-height:100vh; display:flex; flex-direction:column; align-items:center; background:var(--bg); }
.navbar { width:100%; background:var(--nav); border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; padding:0 16px; height:50px; position:sticky; top:0; z-index:100; }
.nav-logo { display:flex; align-items:center; gap:8px; color:#fff; font-size:18px; font-weight:700; letter-spacing:-.3px; }
.nav-logo img { width:32px; height:32px; }
.nav-logo-text { color:#81b64c; }
.nav-right button { background:none; border:1px solid var(--border); border-radius:6px; color:var(--dim); font-size:12px; padding:5px 11px; cursor:pointer; }
.nav-right button:hover { border-color:var(--gold); color:var(--gold); }

.page   { width:100%; max-width:420px; padding:12px 12px 24px; display:flex; flex-direction:column; gap:10px; }
.card   { background:var(--card); border-radius:10px; padding:18px 20px; }
.card-t { font-size:17px; font-weight:700; color:#fff; margin-bottom:4px; }
.card-s { font-size:13px; color:var(--dim); margin-bottom:16px; line-height:1.6; }

/* ── INPUTS ── */
.field       { margin-bottom:10px; }
.field label { display:block; font-size:11px; font-weight:600; color:var(--dim); text-transform:uppercase; letter-spacing:.6px; margin-bottom:5px; }
input,select { width:100%; background:#1a1916; border:1.5px solid var(--border); border-radius:7px; padding:10px 13px; color:var(--text); font-size:14px; outline:none; transition:border-color .15s; }
input:focus,select:focus { border-color:var(--green); }
input::placeholder { color:var(--dim2); }

/* ── TABS ── */
.tabs { display:flex; background:#1a1916; border-radius:8px; padding:3px; margin-bottom:14px; }
.tab  { flex:1; padding:8px; text-align:center; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; color:var(--dim); transition:all .15s; }
.tab.on { background:var(--green); color:#fff; }

/* ── BUTTONS ── */
.btn  { width:100%; padding:11px; background:var(--green); border:none; border-radius:7px; color:#fff; font-size:14px; font-weight:700; cursor:pointer; letter-spacing:.2px; transition:background .15s; margin-top:2px; }
.btn:hover    { background:var(--gl); }
.btn:disabled { opacity:.4; cursor:not-allowed; }
.btn-ghost { background:transparent; border:1.5px solid var(--border); color:var(--dim); font-weight:500; margin-top:8px; }
.btn-ghost:hover { border-color:var(--green); color:var(--green); background:transparent; }
.btn-blue  { background:#1c3a70; } .btn-blue:hover  { background:#264fa0; }
.btn-red   { background:#701c1c; } .btn-red:hover   { background:#a02626; }
.btn-sm    { padding:6px 14px; font-size:12px; width:auto; border-radius:6px; margin-top:0; }

/* ── FEE BAR ── */
.fee-bar { display:flex; align-items:center; justify-content:space-between; background:#1a1916; border:1px solid var(--border); border-radius:8px; padding:12px 16px; margin-bottom:14px; }
.fee-item { text-align:center; }
.fee-num  { font-size:22px; font-weight:700; color:#fff; }
.fee-sub  { font-size:10px; color:var(--dim); text-transform:uppercase; letter-spacing:.5px; margin-top:1px; }
.fee-sep  { color:var(--dim); font-size:16px; }

/* ── ROOM CODE ── */
.code-box  { background:#1a1916; border:2px solid var(--border2); border-radius:10px; padding:20px 16px; text-align:center; margin-bottom:12px; }
.code-digits { font-size:52px; font-weight:700; color:#fff; letter-spacing:14px; font-variant-numeric:tabular-nums; line-height:1; }
.code-hint   { font-size:12px; color:var(--dim); margin-top:8px; }

/* ── MISC ── */
.dot-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--dim); justify-content:center; padding:8px 0; }
.dot     { width:7px; height:7px; border-radius:50%; background:var(--green); animation:blink 1.2s ease infinite; }
@keyframes blink { 0%,100%{opacity:1}50%{opacity:.2} }
.info-row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--border); font-size:13px; }
.info-row:last-child { border-bottom:none; }
.info-row .lbl { color:var(--dim); }
.info-row .val { color:#fff; font-weight:600; }
.info-row.big  .lbl { color:var(--gl); font-weight:700; font-size:14px; }
.info-row.big  .val { font-size:20px; font-weight:700; }
.err { color:var(--danger); font-size:12px; margin:-6px 0 8px; }

/* ── PAY STEP ── */
.pay-step { background:#1a1916; border-radius:8px; padding:14px; margin-bottom:11px; }
.pay-step-hd { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:#fff; margin-bottom:10px; }
.step-circle { width:20px; height:20px; border-radius:50%; background:var(--green); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; flex-shrink:0; }

/* ── GAME PAGE ── */
.game-page { width:100%; max-width:420px; padding:4px 8px 16px; display:flex; flex-direction:column; gap:5px; }

/* PLAYER STRIP */
.player-strip { display:flex; justify-content:space-between; align-items:center; background:var(--card); border-radius:8px; padding:8px 12px; min-height:54px; }
.ps-left  { display:flex; align-items:center; gap:9px; min-width:0; }
.ps-icon  { width:36px; height:36px; border-radius:50%; background:#1a1916; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
.ps-icon.turn-active { border-color:var(--green); box-shadow:0 0 0 3px rgba(129,182,76,.2); }
.ps-details { min-width:0; }
.ps-name { font-size:13px; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:170px; }
.ps-role { font-size:10px; color:var(--dim); margin-top:1px; }
.ps-cap  { display:flex; flex-wrap:wrap; gap:0; margin-top:2px; align-items:center; min-height:14px; }

/* CLOCK */
.clock { font-size:19px; font-weight:700; color:#e0d9cc; background:#1a1916; border:1.5px solid var(--border); border-radius:6px; padding:4px 10px; min-width:64px; text-align:center; font-variant-numeric:tabular-nums; flex-shrink:0; }
.clock.ticking { background:#1e3a10; border-color:var(--green); color:#c0f060; }
.clock.critical { background:#3a1010; border-color:var(--danger); color:#ff9090; animation:blink .6s ease infinite; }

/* BOARD */
.board-shell { width:100%; border:2px solid #444; border-radius:3px; overflow:hidden; box-shadow:0 6px 30px rgba(0,0,0,.8); }
.board-row-wrap { display:flex; }
.rank-labels { display:flex; flex-direction:column; width:16px; background:var(--sq-d); }
.rank-labels span { flex:1; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:rgba(255,255,255,.5); }
.board-grid { display:grid; grid-template-columns:repeat(8,1fr); flex:1; }
.file-labels { display:flex; margin-left:16px; background:var(--sq-l); }
.file-labels span { flex:1; height:16px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:rgba(0,0,0,.4); }

/* SQUARES */
.sq { position:relative; aspect-ratio:1; display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; }
.sq.lt  { background:var(--sq-l); }
.sq.dk  { background:var(--sq-d); }
.sq.selected     { background:var(--sq-sel)!important; }
.sq.last-from    { background:var(--sq-last)!important; }
.sq.last-to      { background:var(--sq-last)!important; }
.sq.king-check   { background:radial-gradient(ellipse at 50% 50%, rgba(255,0,0,.9) 0%, rgba(220,0,0,.5) 50%, transparent 100%)!important; }

/* legal move dot */
.sq.legal-empty::after { content:''; position:absolute; width:32%; height:32%; border-radius:50%; background:rgba(0,0,0,.2); z-index:2; pointer-events:none; }
/* legal capture ring */
.sq.legal-piece::after { content:''; position:absolute; inset:0; border-radius:50%; box-shadow:inset 0 0 0 5px rgba(0,0,0,.25); z-index:2; pointer-events:none; }

/* piece image */
.piece-img { position:absolute; inset:3%; display:flex; align-items:center; justify-content:center; z-index:1; pointer-events:none; }
.piece-img img { width:100%; height:100%; }

/* STATUS BAR */
.status-bar { padding:9px 14px; border-radius:8px; text-align:center; font-size:13px; font-weight:600; background:var(--card); border:1px solid var(--border); color:var(--text); }
.status-bar.my-turn { background:#1a2e0e; border-color:var(--green); color:#a8e060; }
.status-bar.in-check { background:#2e0e0e; border-color:var(--danger); color:#ff9090; }
.status-bar.game-over { background:var(--card2); color:var(--dim); }

/* GAME ACTIONS */
.game-btns { display:flex; gap:6px; }
.game-btns .btn { margin-top:0; }

/* OFFER BANNER */
.offer-bar { background:#232210; border:1px solid #5a5810; border-radius:8px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center; gap:8px; }
.offer-bar p { font-size:13px; color:#d4d440; }
.offer-bar div { display:flex; gap:6px; }

/* CHAT */
.chatbox { background:var(--card); border-radius:8px; overflow:hidden; }
.chat-head { padding:8px 13px; border-bottom:1px solid var(--border); font-size:11px; font-weight:700; color:var(--dim); text-transform:uppercase; letter-spacing:1px; }
.chat-msgs { height:90px; overflow-y:auto; padding:8px 12px; display:flex; flex-direction:column; gap:3px; scroll-behavior:smooth; }
.chat-msgs::-webkit-scrollbar { width:3px; }
.chat-msgs::-webkit-scrollbar-thumb { background:var(--border); }
.chat-line { font-size:12px; line-height:1.5; }
.chat-line .who { font-weight:700; margin-right:3px; }
.chat-line .who.me  { color:var(--blue); }
.chat-line .who.opp { color:var(--gl); }
.chat-sys { font-size:11px; color:var(--dim); font-style:italic; }
.chat-foot { display:flex; gap:6px; padding:7px; border-top:1px solid var(--border); }
.chat-foot input { margin-bottom:0; flex:1; padding:7px 10px; font-size:12px; border-radius:6px; }
.chat-send { padding:7px 12px; background:var(--green); border:none; border-radius:6px; color:#fff; font-size:12px; font-weight:700; cursor:pointer; }

/* WINNER */
.winner-page { width:100%; max-width:420px; padding:14px; display:flex; flex-direction:column; gap:12px; align-items:center; text-align:center; }
.win-icon  { font-size:68px; line-height:1; animation:popIn .35s ease; }
.win-title { font-size:32px; font-weight:700; color:#fff; }
.win-sub   { font-size:14px; color:var(--dim); margin-top:3px; }
@keyframes popIn { from{transform:scale(.4);opacity:0} to{transform:scale(1);opacity:1} }
.pay-link { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; padding:13px; border:none; border-radius:8px; color:#fff; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; }
.pay-link.green { background:#1a5228; }
.pay-link.blue  { background:#1a2f52; }
.pay-link:hover { opacity:.88; }

/* ADMIN */
.admin-page { width:100%; max-width:420px; padding:14px; display:flex; flex-direction:column; gap:10px; }
.stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:2px; }
.stat-box  { background:#1a1916; border-radius:8px; padding:14px; text-align:center; }
.stat-big  { font-size:26px; font-weight:700; color:#fff; }
.stat-lbl  { font-size:10px; color:var(--dim); text-transform:uppercase; letter-spacing:.5px; margin-top:3px; }
.game-row  { background:#1a1916; border-radius:7px; padding:10px 12px; margin-bottom:6px; }
.game-row-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:3px; font-size:12px; }
.game-row-upi { font-size:12px; color:var(--dim); }
.badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700; text-transform:uppercase; }
.b-done { background:#1a3a1a; color:var(--gl); }
.b-play { background:#1a2a3a; color:var(--blue); }
.b-wait { background:#2a2a1a; color:var(--gold); }

@media (max-width:360px) { .code-digits{font-size:40px;letter-spacing:10px;} .clock{font-size:16px;min-width:56px;} }
`;

// ══════════════════════════════════════════════════════════
//  LOBBY
// ══════════════════════════════════════════════════════════
function Lobby({ onCreated, onJoined, settings }) {
  const [tab,setTab]   = useState("create");
  const [upi,setUpi]   = useState("");
  const [code,setCode] = useState("");
  const [mins,setMins] = useState("10");
  const [busy,setBusy] = useState(false);
  const [err,setErr]   = useState("");
  const fee = settings?.entry_fee||10, cut = settings?.platform_cut||2, prize = fee*2-cut*2;

  const create = async () => {
    if (!upi.trim()) return setErr("Enter your UPI ID");
    setBusy(true); setErr("");
    const id = mkCode(), t = parseInt(mins)||10;
    const {error} = await supabase.from("games").insert({
      id, player1_upi:upi.trim(), board:JSON.stringify(initBoard()),
      turn:"w", status:"waiting", timer_mins:t, p1_time:t*60, p2_time:t*60,
    });
    setBusy(false);
    if (error) return setErr("Could not create room. Try again.");
    onCreated({ code:id, upi:upi.trim(), role:"w" });
  };

  const join = async () => {
    if (!upi.trim()) return setErr("Enter your UPI ID");
    if (!code.trim()) return setErr("Enter room code");
    setBusy(true); setErr("");
    const {data,error} = await supabase.from("games").select("*").eq("id",code.trim()).single();
    if (error||!data) { setBusy(false); return setErr("Room not found."); }
    if (data.status!=="waiting") { setBusy(false); return setErr("Game already started."); }
    if (data.player1_upi===upi.trim()) { setBusy(false); return setErr("You created this room!"); }
    await supabase.from("games").update({player2_upi:upi.trim(),status:"payment"}).eq("id",code.trim());
    setBusy(false);
    onJoined({ code:code.trim(), upi:upi.trim(), role:"b", game:data });
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card-t">Find a Game</div>
        <div className="card-s">Enter your UPI ID to play for real money</div>
        <div className="fee-bar">
          <div className="fee-item"><div className="fee-num">₹{fee}</div><div className="fee-sub">Entry</div></div>
          <span className="fee-sep">→</span>
          <div className="fee-item"><div className="fee-num">₹{prize}</div><div className="fee-sub">Winner Gets</div></div>
          <span className="fee-sep">+</span>
          <div className="fee-item"><div className="fee-num">₹{cut*2}</div><div className="fee-sub">Platform</div></div>
        </div>
        <div className="tabs">
          <div className={`tab${tab==="create"?" on":""}`} onClick={()=>setTab("create")}>Create Room</div>
          <div className={`tab${tab==="join"?" on":""}`} onClick={()=>setTab("join")}>Join Room</div>
        </div>
        <div className="field">
          <label>Your UPI / GPay ID</label>
          <input placeholder="e.g. 9876543210@ybl" value={upi} onChange={e=>{setUpi(e.target.value);setErr("");}} />
        </div>
        {tab==="create" && (
          <div className="field">
            <label>Time Control</label>
            <select value={mins} onChange={e=>setMins(e.target.value)}>
              <option value="3">3 minutes</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </select>
          </div>
        )}
        {tab==="join" && (
          <div className="field">
            <label>Room Code</label>
            <input placeholder="Enter 4-digit code" value={code} maxLength={4} onChange={e=>{setCode(e.target.value);setErr("");}} />
          </div>
        )}
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={busy} onClick={tab==="create"?create:join}>
          {busy ? "Please wait…" : tab==="create" ? "Create Room" : "Join Room"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  WAITING
// ══════════════════════════════════════════════════════════
function Waiting({ code, upi, onReady }) {
  useSync(code, d => { if(["payment","playing"].includes(d.status)) onReady(d); });
  return (
    <div className="page">
      <div className="card">
        <div className="card-t">Room Created ✓</div>
        <div className="card-s">Share this code with your opponent</div>
        <div className="code-box">
          <div className="code-digits">{code}</div>
          <div className="code-hint">4-digit room code — share it!</div>
        </div>
        <div style={{background:"#1a1916",borderRadius:7,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:"var(--dim)",marginBottom:3}}>YOUR UPI</div>
          <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{upi}</div>
          <div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>You will play as White ♔</div>
        </div>
        <div className="dot-row"><div className="dot"/><span>Waiting for opponent to join…</span></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PAYMENT
// ══════════════════════════════════════════════════════════
function Payment({ game, myRole, myUpi, onPaid, settings }) {
  const [paid,setPaid] = useState(false);
  const fee = settings?.entry_fee||10, ownerUpi = settings?.owner_upi||DEFAULT_UPI;
  const myField = myRole==="w" ? "p1_paid" : "p2_paid";
  const confirm = async () => { setPaid(true); await supabase.from("games").update({[myField]:true}).eq("id",game.id); };
  useSync(game.id, d => { if(d.p1_paid&&d.p2_paid) onPaid(d); });

  return (
    <div className="page">
      <div className="card">
        <div className="card-t">Pay Entry Fee</div>
        <div className="card-s">Room {game.id} · Pay ₹{fee} to start playing</div>
        <div className="pay-step">
          <div className="pay-step-hd"><div className="step-circle">1</div>Pay ₹{fee} via GPay / UPI</div>
          <div className="info-row"><span className="lbl">Pay To</span><span className="val">{ownerUpi}</span></div>
          <div className="info-row"><span className="lbl">Amount</span><span className="val">₹{fee}</span></div>
          <div className="info-row"><span className="lbl">Your UPI</span><span className="val">{myUpi}</span></div>
        </div>
        {!paid ? (
          <>
            <a className="pay-link blue" href={upiLink(ownerUpi,"ChessBet",fee,`Entry Room ${game.id}`)} style={{marginBottom:10,borderRadius:7}}>
              📱 Open GPay — Pay ₹{fee}
            </a>
            <p style={{textAlign:"center",fontSize:12,color:"var(--dim)",marginBottom:10}}>After paying, tap confirm ↓</p>
            <button className="btn" onClick={confirm}>✅ I Have Paid — Ready!</button>
          </>
        ) : (
          <div style={{textAlign:"center",padding:"14px 0"}}>
            <div style={{fontSize:40,marginBottom:8}}>✅</div>
            <div style={{fontWeight:700,color:"#fff",marginBottom:6}}>Payment confirmed!</div>
            <div className="dot-row"><div className="dot"/><span>Waiting for opponent to pay…</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  GAME BOARD
// ══════════════════════════════════════════════════════════
function Game({ game, myRole, onGameOver, settings }) {
  const [board,   setBoard]  = useState(()=>JSON.parse(game.board));
  const [turn,    setTurn]   = useState(game.turn||"w");
  const [sel,     setSel]    = useState(null);
  const [legals,  setLegals] = useState([]);
  const [lastMv,  setLastMv] = useState(null);
  const [checked, setChecked]= useState(false);
  const [ended,   setEnded]  = useState(game.status==="done");
  const [p1t,     setP1t]    = useState(game.p1_time||(game.timer_mins||10)*60);
  const [p2t,     setP2t]    = useState(game.p2_time||(game.timer_mins||10)*60);
  const [drawOff, setDrawOff]= useState(null);
  const [chat,    setChat]   = useState([{sys:true,text:"Game started! Good luck 🎯"}]);
  const [chatIn,  setChatIn] = useState("");
  const [rematch, setRematch]= useState(null);
  const chatRef  = useRef(null);
  const endedRef = useRef(game.status==="done");

  const myTurn  = turn===myRole && !ended;
  const oppRole = opp(myRole);
  const p1upi=game.player1_upi, p2upi=game.player2_upi;
  const myUpi=myRole==="w"?p1upi:p2upi, oppUpi=myRole==="w"?p2upi:p1upi;
  const myTime=myRole==="w"?p1t:p2t, oppTime=myRole==="w"?p2t:p1t;

  // ── Remote sync ────────────────────────────────────────
  useSync(game.id, d => {
    if (!d.board) return;
    const nb = JSON.parse(d.board);
    setBoard(nb); setTurn(d.turn);
    setChecked(inCheck(nb, d.turn));
    if (d.last_move) { try{setLastMv(JSON.parse(d.last_move));}catch(e){} }
    if (d.p1_time!=null) setP1t(d.p1_time);
    if (d.p2_time!=null) setP2t(d.p2_time);
    setDrawOff(d.draw_offer||null);
    if (d.chat_log) { try{setChat(JSON.parse(d.chat_log));}catch(e){} }
    if (d.rematch_req) setRematch(d.rematch_req);
    if (d.status==="done"&&!endedRef.current) {
      endedRef.current=true; setEnded(true); onGameOver(d);
    }
  }, !ended);

  // ── Timer ──────────────────────────────────────────────
  useEffect(() => {
    if (ended) return; // ← STOP timer when game ends
    const iv = setInterval(() => {
      const setter = turn==="w" ? setP1t : setP2t;
      setter(t => {
        if (t<=1) {
          clearInterval(iv);
          supabase.from("games").update({status:"done",winner:opp(turn),end_reason:"timeout"}).eq("id",game.id);
          return 0;
        }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [turn, ended, game.id]);

  useEffect(() => { chatRef.current?.scrollIntoView({behavior:"smooth"}); }, [chat]);

  // ── Move ───────────────────────────────────────────────
  const doMove = async (from, to) => {
    const nb    = execMove(board, from, to);
    const newLm = {piece:board[from[0]][from[1]], from, to};
    const nextT = opp(turn);
    const res   = gameResult(nb, nextT, newLm);

    // Update local state first (instant feedback)
    setBoard(nb); setTurn(nextT);
    setChecked(inCheck(nb,nextT));
    setSel(null); setLegals([]); setLastMv(newLm);

    const tf = turn==="w"?"p1_time":"p2_time";
    const tv = turn==="w"?p1t:p2t;

    await supabase.from("games").update({
      board:      JSON.stringify(nb),
      turn:       nextT,
      last_move:  JSON.stringify(newLm),
      [tf]:       tv,
      status:     res.over ? "done"   : "playing",
      winner:     res.over ? res.winner : null,
      end_reason: res.over ? res.reason : null,
    }).eq("id", game.id);

    if (res.over) {
      endedRef.current = true;
      setEnded(true);
      onGameOver({...game, winner:res.winner, status:"done", end_reason:res.reason, board:JSON.stringify(nb)});
    }
  };

  const handleSq = useCallback((r,c) => {
    if (!myTurn) return;
    const piece = board[r][c];
    if (sel) {
      if (legals.some(([lr,lc])=>lr===r&&lc===c)) { doMove(sel,[r,c]); return; }
      if (col(piece)===turn) { setSel([r,c]); setLegals(legalMoves(board,r,c,lastMv)); return; }
      setSel(null); setLegals([]); return;
    }
    if (col(piece)===turn) { setSel([r,c]); setLegals(legalMoves(board,r,c,lastMv)); }
  }, [board,turn,myTurn,sel,legals,lastMv]);

  const offerDraw  = async()=>{ await supabase.from("games").update({draw_offer:myRole}).eq("id",game.id); setDrawOff(myRole); };
  const acceptDraw = async()=>{ await supabase.from("games").update({status:"done",winner:"draw",end_reason:"agreement"}).eq("id",game.id); };
  const declineDraw= async()=>{ await supabase.from("games").update({draw_offer:null}).eq("id",game.id); setDrawOff(null); };
  const resign     = async()=>{ if(!window.confirm("Resign this game?")) return; await supabase.from("games").update({status:"done",winner:oppRole,end_reason:"resign"}).eq("id",game.id); };
  const sendChat   = async()=>{
    if (!chatIn.trim()) return;
    const nc=[...chat,{sender:myRole,text:chatIn.trim()}];
    setChat(nc); setChatIn("");
    await supabase.from("games").update({chat_log:JSON.stringify(nc)}).eq("id",game.id);
  };

  const cap      = getCaptured(board);
  const rows     = myRole==="b"?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
  const cols2    = myRole==="b"?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
  const kPos     = checked ? kingPos(board,turn) : null;
  const files    = myRole==="b"?"hgfedcba":"abcdefgh";

  const sqCls = (r,c,piece) => {
    const light=(r+c)%2===0;
    const isSel=sel&&sel[0]===r&&sel[1]===c;
    const isFrom=lastMv&&lastMv.from[0]===r&&lastMv.from[1]===c;
    const isTo=lastMv&&lastMv.to[0]===r&&lastMv.to[1]===c;
    const isLeg=legals.some(([lr,lc])=>lr===r&&lc===c);
    const isChk=kPos&&kPos[0]===r&&kPos[1]===c;
    let cls=`sq ${light?"lt":"dk"}`;
    if(isSel) cls+=" selected";
    else if(isFrom||isTo) cls+=" last-from";
    if(isLeg&&piece) cls+=" legal-piece";
    else if(isLeg) cls+=" legal-empty";
    if(isChk) cls+=" king-check";
    return cls;
  };

  const statusText = () => {
    if (ended) return "Game Over";
    if (myTurn&&checked) return "⚠️ You are in CHECK!";
    if (myTurn) return "Your turn to move";
    if (checked) return "Opponent is in check";
    return "Waiting for opponent…";
  };
  const statusCls = ended?"status-bar game-over":myTurn&&checked?"status-bar in-check":myTurn?"status-bar my-turn":"status-bar";

  const PlayerPanel = ({role, upiStr, isOpp}) => {
    const isActive = turn===role && !ended;
    const time = role==="w" ? p1t : p2t;
    const pieces = role==="w" ? cap.w : cap.b;
    const img = role==="w"
      ? <img src={PIECE_IMG.wP} alt="white" style={{width:"22px",height:"22px"}}/>
      : <img src={PIECE_IMG.bP} alt="black" style={{width:"22px",height:"22px"}}/>;
    return (
      <div className="player-strip">
        <div className="ps-left">
          <div className={`ps-icon${isActive?" turn-active":""}`}>{img}</div>
          <div className="ps-details">
            <div className="ps-name">{upiStr}{!isOpp&&<span style={{fontSize:10,color:"var(--dim)",marginLeft:4}}>(You)</span>}</div>
            <div className="ps-role">{role==="w"?"White":"Black"}</div>
            <div className="ps-cap">
              {pieces.map((p,i)=><span key={i} style={{display:"inline-block",width:13,height:13}}><Piece code={p} small/></span>)}
            </div>
          </div>
        </div>
        <div className={`clock${isActive?" ticking":""}${time<30?" critical":""}`}>{fmt(time)}</div>
      </div>
    );
  };

  return (
    <div className="game-page">
      <PlayerPanel role={oppRole} upiStr={oppUpi} isOpp={true}/>

      {drawOff&&drawOff!==myRole&&!ended&&(
        <div className="offer-bar">
          <p>Opponent offers a draw</p>
          <div>
            <button className="btn btn-sm" onClick={acceptDraw}>Accept</button>
            <button className="btn btn-sm btn-red" onClick={declineDraw}>Decline</button>
          </div>
        </div>
      )}
      {drawOff===myRole&&!ended&&<div className="offer-bar"><p>Draw offer sent — waiting…</p></div>}

      {/* ── BOARD ── */}
      <div className="board-shell">
        <div className="board-row-wrap">
          <div className="rank-labels">
            {rows.map(r=><span key={r}>{8-r}</span>)}
          </div>
          <div className="board-grid">
            {rows.map(r=>cols2.map(c=>{
              const piece=board[r][c];
              return (
                <div key={`${r}${c}`} className={sqCls(r,c,piece)} onClick={()=>handleSq(r,c)}>
                  {piece&&<div className="piece-img"><Piece code={piece}/></div>}
                </div>
              );
            }))}
          </div>
        </div>
        <div className="file-labels">{files.split("").map(f=><span key={f}>{f}</span>)}</div>
      </div>

      <div className={statusCls}>{statusText()}</div>

      <PlayerPanel role={myRole} upiStr={myUpi} isOpp={false}/>

      {!ended&&(
        <div className="game-btns">
          <button className="btn btn-ghost btn-sm" onClick={offerDraw} disabled={!!drawOff}>Offer Draw</button>
          <button className="btn btn-red btn-sm" onClick={resign}>Resign</button>
        </div>
      )}
      {ended&&!rematch&&<button className="btn" onClick={async()=>await supabase.from("games").update({rematch_req:myRole}).eq("id",game.id)}>Request Rematch</button>}
      {ended&&rematch&&rematch!==myRole&&<p style={{textAlign:"center",fontSize:13,color:"var(--gl)"}}>Opponent wants a rematch!</p>}

      <div className="chatbox">
        <div className="chat-head">Chat</div>
        <div className="chat-msgs">
          {chat.map((m,i)=>m.sys
            ?<div key={i} className="chat-sys">{m.text}</div>
            :<div key={i} className="chat-line">
              <span className={`who ${m.sender===myRole?"me":"opp"}`}>{m.sender===myRole?"You":oppUpi.split("@")[0]}:</span>
              {m.text}
            </div>
          )}
          <div ref={chatRef}/>
        </div>
        <div className="chat-foot">
          <input placeholder="Message…" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
          <button className="chat-send" onClick={sendChat}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  WINNER
// ══════════════════════════════════════════════════════════
function Winner({ game, myRole, onPlayAgain, settings }) {
  const w=game.winner, reason=game.end_reason;
  const isDraw=w==="draw", iWon=w===myRole;
  const fee=settings?.entry_fee||10, cut=settings?.platform_cut||2, prize=fee*2-cut*2;
  const ownerUpi=settings?.owner_upi||DEFAULT_UPI;
  const winnerUpi=w==="w"?game.player1_upi:w==="b"?game.player2_upi:null;
  const labels={checkmate:"by Checkmate",stalemate:"Stalemate",timeout:"on Time",resign:"by Resignation",agreement:"Draw agreed"};

  return (
    <div className="winner-page">
      <div className="win-icon">{isDraw?"🤝":iWon?"🏆":"😔"}</div>
      <div className="win-title">{isDraw?"Draw":iWon?"You Won!":"You Lost"}</div>
      <div className="win-sub">{labels[reason]||""}</div>
      <div className="card" style={{width:"100%",textAlign:"left"}}>
        <div style={{fontWeight:700,color:"#fff",marginBottom:12,fontSize:14}}>Payment Summary</div>
        <div className="info-row"><span className="lbl">{game.player1_upi}</span><span className="val">paid ₹{fee}</span></div>
        <div className="info-row"><span className="lbl">{game.player2_upi}</span><span className="val">paid ₹{fee}</span></div>
        <div className="info-row"><span className="lbl">Platform fee</span><span className="val">₹{cut*2}</span></div>
        {!isDraw&&<div className="info-row big"><span className="lbl">{winnerUpi} wins</span><span className="val">₹{prize}</span></div>}
        {isDraw&&<div className="info-row big"><span className="lbl">Each player refund</span><span className="val">₹{fee-cut}</span></div>}
      </div>
      {winnerUpi&&<a className="pay-link green" href={upiLink(winnerUpi,"Chess Winner",prize,`Winnings Room ${game.id}`)}>📱 Pay ₹{prize} to Winner</a>}
      <a className="pay-link blue" href={upiLink(ownerUpi,"ChessBet Fee",cut*2,`Platform fee Room ${game.id}`)}>💼 Pay ₹{cut*2} Platform Fee</a>
      <p style={{fontSize:11,color:"var(--dim)",lineHeight:1.8}}>Platform fee → {ownerUpi}</p>
      <button className="btn btn-ghost" onClick={onPlayAgain}>New Game</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════
function Admin({ onBack }) {
  const [pin,setPin]   = useState("");
  const [auth,setAuth] = useState(false);
  const [cfg,setCfg]   = useState({entry_fee:10,platform_cut:2,owner_upi:""});
  const [games,setG]   = useState([]);
  const [busy,setBusy] = useState(false);
  const [saved,setSaved]=useState(false);
  const [err,setErr]   = useState("");

  const login = () => { if(pin===ADMIN_PIN){setAuth(true);load();}else setErr("Wrong PIN"); };
  const load  = async () => {
    setBusy(true);
    const {data:s}=await supabase.from("settings").select("*").eq("id","main").single(); if(s)setCfg(s);
    const {data:g}=await supabase.from("games").select("*").order("created_at",{ascending:false}).limit(30); if(g)setG(g);
    setBusy(false);
  };
  const save = async () => { await supabase.from("settings").upsert({id:"main",...cfg}); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  const done=games.filter(g=>g.status==="done").length;
  const earned=done*(cfg.platform_cut||2)*2;

  if (!auth) return (
    <div className="page">
      <div className="card">
        <div className="card-t">Admin Panel</div>
        <div className="card-s">Enter your PIN to access settings</div>
        <input type="password" placeholder="Admin PIN" value={pin} onChange={e=>{setPin(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()}/>
        {err&&<p className="err">{err}</p>}
        <button className="btn" onClick={login}>Login</button>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="card">
        <div className="card-t" style={{marginBottom:12}}>Dashboard</div>
        <div className="stats-grid">
          <div className="stat-box"><div className="stat-big">{games.length}</div><div className="stat-lbl">Total Games</div></div>
          <div className="stat-box"><div className="stat-big">{done}</div><div className="stat-lbl">Completed</div></div>
          <div className="stat-box"><div className="stat-big">₹{earned}</div><div className="stat-lbl">Fees Earned</div></div>
          <div className="stat-box"><div className="stat-big">₹{cfg.entry_fee||10}</div><div className="stat-lbl">Entry Fee</div></div>
        </div>
      </div>
      <div className="card">
        <div className="card-t" style={{marginBottom:12}}>Settings</div>
        <div className="field"><label>Your UPI ID</label><input placeholder="yourname@upi" value={cfg.owner_upi||""} onChange={e=>setCfg({...cfg,owner_upi:e.target.value})}/></div>
        <div className="field"><label>Entry Fee per Player (₹)</label><input type="number" value={cfg.entry_fee||10} onChange={e=>setCfg({...cfg,entry_fee:parseInt(e.target.value)||10})}/></div>
        <div className="field"><label>Your Cut per Player (₹)</label><input type="number" value={cfg.platform_cut||2} onChange={e=>setCfg({...cfg,platform_cut:parseInt(e.target.value)||2})}/></div>
        <p style={{fontSize:12,color:"var(--gl)",marginBottom:12}}>Prize: ₹{(cfg.entry_fee||10)*2-(cfg.platform_cut||2)*2} · Your earnings/game: ₹{(cfg.platform_cut||2)*2}</p>
        <button className="btn" onClick={save}>{saved?"✅ Saved!":"Save Settings"}</button>
      </div>
      <div className="card">
        <div className="card-t" style={{marginBottom:10}}>Recent Games</div>
        {busy&&<p style={{color:"var(--dim)",fontSize:13}}>Loading…</p>}
        {games.map(g=>(
          <div className="game-row" key={g.id}>
            <div className="game-row-top">
              <span style={{fontWeight:700,color:"#fff"}}>Room #{g.id}</span>
              <span className={`badge ${g.status==="done"?"b-done":g.status==="playing"?"b-play":"b-wait"}`}>{g.status}</span>
            </div>
            <div className="game-row-upi">{g.player1_upi} vs {g.player2_upi||"waiting…"}</div>
            {g.winner&&<div style={{fontSize:11,color:"var(--gl)",marginTop:2}}>
              {g.winner==="draw"?"Draw":g.winner==="w"?g.player1_upi:g.player2_upi} won · {g.end_reason}
            </div>}
          </div>
        ))}
        {!busy&&games.length===0&&<p style={{color:"var(--dim)",fontSize:13}}>No games yet</p>}
      </div>
      <button className="btn btn-ghost" onClick={onBack}>← Back</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ROOT APP — with localStorage session persistence
// ══════════════════════════════════════════════════════════
export default function App() {
  const [screen,   setScreen]   = useState("lobby");
  const [session,  setSession]  = useState(null);
  const [settings, setSettings] = useState({entry_fee:10,platform_cut:2,owner_upi:DEFAULT_UPI});
  const [restoring,setRestoring]= useState(true);

  // ── Load settings ─────────────────────────────────────
  useEffect(() => {
    supabase.from("settings").select("*").eq("id","main").single()
      .then(({data})=>{ if(data) setSettings(data); });
  },[]);

  // ── RESTORE SESSION on page refresh ───────────────────
  useEffect(() => {
    const restore = async () => {
      const saved = loadSession();
      if (!saved) { setRestoring(false); return; }

      // Fetch latest game state from DB
      const {data} = await supabase.from("games").select("*").eq("id",saved.code).single();
      if (!data) { clearSession(); setRestoring(false); return; }

      // Game is over — go to winner screen
      if (data.status==="done") {
        setSession({...saved, game:data});
        setScreen("winner");
        setRestoring(false);
        return;
      }
      // Game is playing — go back to game
      if (data.status==="playing") {
        setSession({...saved, game:data});
        setScreen("game");
        setRestoring(false);
        return;
      }
      // Payment screen
      if (data.status==="payment") {
        setSession({...saved, game:data});
        setScreen("payment");
        setRestoring(false);
        return;
      }
      // Waiting for opponent
      if (data.status==="waiting" && saved.role==="w") {
        setSession({...saved, game:data});
        setScreen("waiting");
        setRestoring(false);
        return;
      }
      // Fallback
      clearSession();
      setRestoring(false);
    };
    restore();
  },[]);

  const go = (scr, sess) => {
    if (sess) { setSession(sess); saveSession({code:sess.code, upi:sess.upi, role:sess.role}); }
    setScreen(scr);
  };

  const newGame = () => { clearSession(); setSession(null); setScreen("lobby"); };

  if (restoring) return (
    <>
      <style>{CSS}</style>
      <div className="app" style={{justifyContent:"center",alignItems:"center",height:"100vh"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>♟</div>
          <div style={{fontSize:16,color:"var(--dim)"}}>Loading…</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <nav className="navbar">
          <div className="nav-logo">
            <span style={{fontSize:28}}>♟</span>
            <span>Chess<span className="nav-logo-text">Bet</span></span>
          </div>
          <div className="nav-right">
            <button onClick={()=>setScreen(s=>s==="admin"?"lobby":"admin")}>
              {screen==="admin"?"✕ Close":"⚙ Admin"}
            </button>
          </div>
        </nav>

        {screen==="admin"   && <Admin onBack={()=>setScreen("lobby")}/>}

        {screen==="lobby"   && (
          <Lobby settings={settings}
            onCreated={({code,upi,role})=>go("waiting",{code,upi,role,game:null})}
            onJoined= {({code,upi,role,game})=>go("payment",{code,upi,role,game})}
          />
        )}

        {screen==="waiting" && session && (
          <Waiting code={session.code} upi={session.upi}
            onReady={g=>go("payment",{...session,game:g})}
          />
        )}

        {screen==="payment" && session?.game && (
          <Payment game={session.game} myRole={session.role} myUpi={session.upi} settings={settings}
            onPaid={async g=>{
              await supabase.from("games").update({status:"playing"}).eq("id",g.id);
              const updated={...session,game:{...g,status:"playing"}};
              setSession(updated);
              saveSession({code:updated.code,upi:updated.upi,role:updated.role});
              setScreen("game");
            }}
          />
        )}

        {screen==="game" && session?.game && (
          <Game game={session.game} myRole={session.role} settings={settings}
            onGameOver={g=>{
              const updated={...session,game:g};
              setSession(updated);
              saveSession({code:updated.code,upi:updated.upi,role:updated.role});
              setScreen("winner");
            }}
          />
        )}

        {screen==="winner" && session?.game && (
          <Winner game={session.game} myRole={session.role} settings={settings}
            onPlayAgain={newGame}
          />
        )}
      </div>
    </>
  );
}
