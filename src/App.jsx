import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dmcjbzyyfgmezqmrvmco.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ofp9kSxXEco5WzyI4XVN8Q_gO9mk-jz";
const ADMIN_PIN    = "1234";
const DEFAULT_UPI  = "your_upi_id@upi";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ══════════════════════════════════════════════════════════════
//  CHESS.COM STAUNTON PIECES — Standard SVG pieces
// ══════════════════════════════════════════════════════════════
const PIECE_SVG = {
  wK: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 11.63V6" strokeLinejoin="miter"/>
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" strokeLinecap="butt" strokeLinejoin="miter"/>
        <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-8-10-2c-3 6.5 5 10.5 5 10.5v7.5z" fill="#fff"/>
        <path d="M11.5 30c5.5-3 15.5-3 21 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0"/>
        <path d="M20 8h5" strokeLinejoin="miter"/>
      </g>
    </svg>
  ),
  bK: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 11.63V6" stroke="#fff" strokeLinejoin="miter"/>
        <path d="M20 8h5" stroke="#fff" strokeLinejoin="miter"/>
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#000" strokeLinecap="butt" strokeLinejoin="miter"/>
        <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-8-10-2c-3 6.5 5 10.5 5 10.5v7.5z" fill="#000" stroke="#000"/>
        <path d="M11.5 30c5.5-3 15.5-3 21 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" stroke="#fff"/>
      </g>
    </svg>
  ),
  wQ: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M9 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM20 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM31 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/>
        <path d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 23l-3.3-14.2L22.5 24l-5.2-15.2L14 23 6.5 13.5 9 26z" strokeLinecap="butt"/>
        <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
        <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" fill="none"/>
      </g>
    </svg>
  ),
  bQ: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="#000" stroke="#000" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M9 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM20 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM31 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/>
        <path d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 23l-3.3-14.2L22.5 24l-5.2-15.2L14 23 6.5 13.5 9 26z" stroke="#fff" strokeLinejoin="miter"/>
        <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
        <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" stroke="#fff" fill="none"/>
      </g>
    </svg>
  ),
  wR: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinejoin="miter"/>
        <path d="M34 14l-3 3H14l-3-3"/>
        <path d="M31 17v12.5H14V17"/>
        <path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>
        <path d="M11 14h23" fill="none" strokeLinejoin="miter"/>
      </g>
    </svg>
  ),
  bR: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="#000" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinejoin="miter"/>
        <path d="M34 14l-3 3H14l-3-3"/>
        <path d="M31 17v12.5H14V17"/>
        <path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>
        <path d="M11 14h23" fill="none" stroke="#fff" strokeLinejoin="miter"/>
        <path d="M34 14l-3 3H14l-3-3" stroke="#fff"/>
        <path d="M31 17v12.5H14V17" stroke="#fff"/>
      </g>
    </svg>
  ),
  wB: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" fill="#fff"/>
        <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill="#fff"/>
        <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" fill="#fff"/>
        <path d="M17.5 26h10M15 30h15" stroke="#000"/>
      </g>
    </svg>
  ),
  bB: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" fill="#000"/>
        <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill="#000"/>
        <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" fill="#000"/>
        <path d="M17.5 26h10M15 30h15" stroke="#fff"/>
      </g>
    </svg>
  ),
  wN: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/>
        <path d="M24 18c.38 5.12-3 7.45-6.26 9.77C15.06 29.67 14 34 14 38.5h-1.5c0-5.56 1.06-10.09 3.74-12.23C19 24.45 22.38 22.12 22 17z" fill="#fff"/>
        <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#000" stroke="#000"/>
        <path d="M14.933 15.75c-.792 0-1.327.21-1.677.444C14.113 14.577 15.79 14 18 14c2.966 0 5.575 1.318 6.507 3.5H23l-1 2h-2.5l-.5 1.5h3l.5 3.5H18c-.955 0-1.5-.5-1.5-1.5V21.5l-1.5.5v-6.25z" fill="#fff"/>
      </g>
    </svg>
  ),
  bN: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#000"/>
        <path d="M24 18c.38 5.12-3 7.45-6.26 9.77C15.06 29.67 14 34 14 38.5h-1.5c0-5.56 1.06-10.09 3.74-12.23C19 24.45 22.38 22.12 22 17z" fill="#000"/>
        <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#fff" stroke="#fff"/>
        <path d="M14.933 15.75c-.792 0-1.327.21-1.677.444C14.113 14.577 15.79 14 18 14c2.966 0 5.575 1.318 6.507 3.5H23l-1 2h-2.5l-.5 1.5h3l.5 3.5H18c-.955 0-1.5-.5-1.5-1.5V21.5l-1.5.5v-6.25z" fill="#fff" stroke="#fff"/>
      </g>
    </svg>
  ),
  wP: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  bP: () => (
    <svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#000" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

function Piece({ code }) {
  const Comp = PIECE_SVG[code];
  if (!Comp) return null;
  return (
    <div style={{ width: "88%", height: "88%", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <Comp />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  CHESS ENGINE — bulletproof
// ══════════════════════════════════════════════════════════════
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
      if (inBounds(r+d,c) && !board[r+d][c]) {
        mv.push([r+d,c]);
        if (r===sr && !board[r+2*d][c]) mv.push([r+2*d,c]);
      }
      [-1,1].forEach(dc => {
        if (inBounds(r+d,c+dc)) {
          if (col(board[r+d][c+dc])===opp(t)) mv.push([r+d,c+dc]);
          // en passant
          if (lm && lm.piece===opp(t)+"P" && lm.to[0]===r && lm.to[1]===c+dc && Math.abs(lm.from[0]-lm.to[0])===2) mv.push([r+d,c+dc]);
        }
      });
      break;
    }
    case "N": [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>push(r+dr,c+dc)); break;
    case "B": [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>ray(dr,dc)); break;
    case "R": [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>ray(dr,dc)); break;
    case "Q": [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>ray(dr,dc)); break;
    case "K": {
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>push(r+dr,c+dc));
      // castling (simplified)
      if (t==="w"&&r===7&&c===4){ if(!board[7][5]&&!board[7][6]&&board[7][7]==="wR") mv.push([7,6]); if(!board[7][3]&&!board[7][2]&&!board[7][1]&&board[7][0]==="wR") mv.push([7,2]); }
      if (t==="b"&&r===0&&c===4){ if(!board[0][5]&&!board[0][6]&&board[0][7]==="bR") mv.push([0,6]); if(!board[0][3]&&!board[0][2]&&!board[0][1]&&board[0][0]==="bR") mv.push([0,2]); }
      break;
    }
  }
  return mv;
}

function execMove(board, from, to) {
  const nb = board.map(r=>[...r]);
  const p = nb[from[0]][from[1]];
  nb[to[0]][to[1]] = p; nb[from[0]][from[1]] = null;
  // castling rook
  if (p[1]==="K") {
    if (from[1]===4&&to[1]===6) { nb[from[0]][5]=nb[from[0]][7]; nb[from[0]][7]=null; }
    if (from[1]===4&&to[1]===2) { nb[from[0]][3]=nb[from[0]][0]; nb[from[0]][0]=null; }
  }
  // en passant capture
  if (p[1]==="P" && from[1]!==to[1] && !board[to[0]][to[1]]) nb[from[0]][to[1]]=null;
  // promotion
  if (p==="wP"&&to[0]===0) nb[0][to[1]]="wQ";
  if (p==="bP"&&to[0]===7) nb[7][to[1]]="bQ";
  return nb;
}

function kingSquare(board, t) {
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (board[r][c]===t+"K") return [r,c];
  return null;
}

function isAttacked(board, r, c, byColor) {
  for (let pr=0;pr<8;pr++) for (let pc2=0;pc2<8;pc2++) {
    if (col(board[pr][pc2])!==byColor) continue;
    if (pseudoMoves(board,pr,pc2,null).some(([tr,tc])=>tr===r&&tc===c)) return true;
  }
  return false;
}

function inCheck(board, t) {
  const k = kingSquare(board, t); if (!k) return false;
  return isAttacked(board, k[0], k[1], opp(t));
}

// Legal moves — filters out moves that leave king in check
function legalMoves(board, r, c, lm) {
  const t = col(board[r][c]); if (!t) return [];
  return pseudoMoves(board,r,c,lm).filter(([tr,tc]) => {
    const nb = execMove(board,[r,c],[tr,tc]);
    return !inCheck(nb, t);
  });
}

function hasLegalMoves(board, t, lm) {
  for (let r=0;r<8;r++) for (let c=0;c<8;c++)
    if (col(board[r][c])===t && legalMoves(board,r,c,lm).length>0) return true;
  return false;
}

// Returns: { status: "playing"|"checkmate"|"stalemate", winner: "w"|"b"|"draw"|null }
function gameResult(board, turnToMove, lastMove) {
  const anyMoves = hasLegalMoves(board, turnToMove, lastMove);
  if (anyMoves) return { status:"playing", winner:null };
  if (inCheck(board, turnToMove)) return { status:"checkmate", winner:opp(turnToMove) };
  return { status:"stalemate", winner:"draw" };
}

function getCaptured(board) {
  const start = {wP:8,wN:2,wB:2,wR:2,wQ:1,bP:8,bN:2,bB:2,bR:2,bQ:1};
  const live = {};
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) if(board[r][c]) live[board[r][c]]=(live[board[r][c]]||0)+1;
  const cap = {w:[],b:[]};
  Object.entries(start).forEach(([k,v])=>{ const miss=v-(live[k]||0); for(let i=0;i<miss;i++) cap[k[0]].push(k); });
  return cap;
}

const mkCode = () => Math.floor(1000+Math.random()*9000).toString();
const upiLink = (pa,pn,am,tn) => `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;
const fmt = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

// ══════════════════════════════════════════════════════════════
//  FAST SYNC — 500ms polling + realtime
// ══════════════════════════════════════════════════════════════
function useSync(gameId, cb, enabled=true) {
  const snap = useRef(null);
  useEffect(() => {
    if (!gameId || !enabled) return;
    const ch = supabase.channel("r"+gameId)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"games",filter:`id=eq.${gameId}`},
        p => { snap.current=p.new; cb(p.new); })
      .subscribe();
    const iv = setInterval(async()=>{
      const {data} = await supabase.from("games").select("*").eq("id",gameId).single();
      if (!data) return;
      const prev = snap.current;
      const changed = !prev||prev.board!==data.board||prev.turn!==data.turn||prev.status!==data.status||prev.p1_paid!==data.p1_paid||prev.p2_paid!==data.p2_paid||prev.draw_offer!==data.draw_offer||prev.chat_log!==data.chat_log;
      if (changed) { snap.current=data; cb(data); }
    },500);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  },[gameId,enabled]);
}

// ══════════════════════════════════════════════════════════════
//  STYLES — Chess.com premium dark UI
// ══════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body { background: #161512; font-family: 'Roboto', sans-serif; color: #e0d9cc; -webkit-font-smoothing: antialiased; min-height: 100vh; }

:root {
  --bg:      #161512;
  --surface: #1e1c18;
  --card:    #262421;
  --border:  #3d3a34;
  --border2: #4a4640;
  --green:   #81b64c;
  --gd:      #5e8c34;
  --gl:      #99cc5e;
  --cream:   #f0d9b5;
  --brown:   #b58863;
  --hi-y:    #f6f669cc;
  --hi-lf:   #cdd26acc;
  --hi-lt:   #aaa23acc;
  --hi-dot:  rgba(0,0,0,0.2);
  --hi-ring: rgba(0,0,0,0.22);
  --text:    #e0d9cc;
  --dim:     #8a8070;
  --dim2:    #5a5448;
  --gold:    #e8a020;
  --danger:  #df5353;
  --blue:    #5b9bd5;
  --shadow:  0 8px 32px rgba(0,0,0,0.7);
}

/* ── APP SHELL ── */
.app { min-height:100vh; display:flex; flex-direction:column; align-items:center; background:var(--bg); }
.hdr { width:100%; background:#1a1814; border-bottom:1px solid var(--border); padding:0 16px; display:flex; align-items:center; justify-content:space-between; height:52px; position:sticky; top:0; z-index:200; }
.logo { display:flex; align-items:center; gap:8px; font-size:20px; font-weight:700; color:#fff; letter-spacing:-.3px; }
.logo-pawn { font-size:26px; }
.abtn { background:none; border:1px solid var(--border); border-radius:6px; color:var(--dim); font-size:12px; padding:5px 12px; cursor:pointer; font-family:inherit; transition:all .15s; }
.abtn:hover { border-color:var(--gold); color:var(--gold); }

/* ── LOBBY / CARD SCREENS ── */
.scr { width:100%; max-width:420px; padding:14px; display:flex; flex-direction:column; gap:12px; }
.card { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:20px; }
.card-t { font-size:18px; font-weight:700; color:#fff; margin-bottom:4px; }
.card-s { font-size:13px; color:var(--dim); margin-bottom:16px; line-height:1.6; }

/* TABS */
.tabs { display:flex; background:var(--surface); border-radius:7px; padding:3px; margin-bottom:14px; gap:3px; }
.tab { flex:1; padding:8px; text-align:center; border-radius:5px; font-size:13px; font-weight:500; cursor:pointer; color:var(--dim); transition:all .15s; }
.tab.on { background:var(--green); color:#fff; }

/* INPUTS */
input, select { width:100%; background:var(--surface); border:1px solid var(--border); border-radius:7px; padding:10px 13px; color:var(--text); font-family:inherit; font-size:14px; margin-bottom:10px; outline:none; transition:border-color .15s; }
input:focus, select:focus { border-color:var(--green); }
input::placeholder { color:var(--dim2); }
label { display:block; font-size:12px; color:var(--dim); margin-bottom:5px; }

/* BUTTONS */
.btn { width:100%; padding:11px; background:var(--green); border:none; border-radius:7px; color:#fff; font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; transition:background .15s; margin-top:2px; letter-spacing:.2px; }
.btn:hover { background:var(--gl); }
.btn:disabled { opacity:.4; cursor:not-allowed; }
.btn-ghost { background:transparent; border:1px solid var(--border); color:var(--dim); font-weight:500; margin-top:8px; }
.btn-ghost:hover { border-color:var(--green); color:var(--green); background:transparent; }
.btn-blue  { background:#1e3a6e; } .btn-blue:hover  { background:#2a519e; }
.btn-red   { background:#6e1e1e; } .btn-red:hover   { background:#962626; }
.btn-sm { padding:6px 14px; font-size:12px; width:auto; border-radius:6px; margin-top:0; }

/* FEE ROW */
.fee-row { display:flex; align-items:center; justify-content:space-between; background:var(--surface); border-radius:8px; padding:12px 16px; margin-bottom:14px; }
.fee-item { text-align:center; }
.fee-amt  { font-size:22px; font-weight:700; color:#fff; display:block; }
.fee-lbl  { font-size:10px; color:var(--dim); text-transform:uppercase; letter-spacing:.5px; }
.fee-arrow { color:var(--dim); font-size:18px; }

/* ROOM CODE */
.rc-wrap { background:var(--surface); border:2px solid var(--border2); border-radius:10px; padding:20px; text-align:center; margin-bottom:14px; }
.rc { font-size:52px; font-weight:700; color:#fff; letter-spacing:14px; font-variant-numeric:tabular-nums; }
.rc-hint { font-size:12px; color:var(--dim); margin-top:6px; }

/* STATUS ROW */
.status-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--dim); justify-content:center; padding:8px 0; }
.pulse-dot { width:7px; height:7px; border-radius:50%; background:var(--green); animation:pulse 1.2s ease infinite; flex-shrink:0; }
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.25} }

/* INFO ROWS */
.ir { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid var(--border); font-size:13px; }
.ir:last-child { border-bottom:none; }
.ir .lbl { color:var(--dim); }
.ir .val { color:#fff; font-weight:600; }
.ir.total .lbl { color:var(--gl); font-weight:700; font-size:14px; }
.ir.total .val { font-size:20px; font-weight:700; }
.err-msg { color:var(--danger); font-size:12px; margin:-6px 0 8px; }

/* ── GAME SCREEN ── */
.game-scr { width:100%; max-width:440px; padding:6px 8px; display:flex; flex-direction:column; gap:6px; }

/* PLAYER PANEL */
.pp { display:flex; justify-content:space-between; align-items:center; background:var(--card); border:1px solid var(--border); border-radius:8px; padding:8px 12px; min-height:52px; }
.pp-left { display:flex; align-items:center; gap:9px; min-width:0; }
.pp-icon { width:34px; height:34px; border-radius:50%; background:var(--surface); border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.pp-icon.active { border-color:var(--green); box-shadow:0 0 0 2px rgba(129,182,76,.25); }
.pp-name { font-size:13px; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }
.pp-role { font-size:10px; color:var(--dim); margin-top:1px; }
.pp-cap  { font-size:11px; color:var(--dim); min-height:13px; display:flex; flex-wrap:wrap; gap:1px; align-items:center; margin-top:1px; }
.pp-cap span { display:inline-block; width:11px; height:11px; }

/* TIMER */
.timer { font-size:18px; font-weight:700; color:#fff; background:var(--surface); border:1.5px solid var(--border); border-radius:6px; padding:4px 10px; min-width:62px; text-align:center; font-variant-numeric:tabular-nums; flex-shrink:0; transition:all .3s; }
.timer.active { background:#2a3d1c; border-color:var(--green); color:#c5f07a; }
.timer.low    { background:#3d1c1c; border-color:var(--danger); color:#ff9090; animation:pulse .6s ease infinite; }

/* BOARD WRAPPER */
.board-wrap { width:100%; border-radius:4px; overflow:hidden; box-shadow:var(--shadow); border:2px solid #555; }
.board-with-coords { display:flex; flex-direction:column; }
.board-inner { display:flex; }
.rank-col { display:flex; flex-direction:column; width:18px; justify-content:space-around; }
.file-row { display:flex; margin-left:18px; height:18px; }
.coord-lbl { font-size:9px; font-weight:700; color:var(--dim); display:flex; align-items:center; justify-content:center; flex:1; }
.board-grid { display:grid; grid-template-columns:repeat(8,1fr); flex:1; }

/* SQUARES */
.sq { position:relative; display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; aspect-ratio:1; }
.sq.light { background:var(--cream); }
.sq.dark  { background:var(--brown); }
.sq.sel   { background:var(--hi-y)!important; }
.sq.from  { background:var(--hi-lf)!important; }
.sq.to    { background:var(--hi-lt)!important; }

/* legal move dot */
.sq.legal::after { content:''; position:absolute; width:30%; height:30%; border-radius:50%; background:var(--hi-dot); pointer-events:none; z-index:2; }
/* legal capture ring */
.sq.legal-cap::after { content:''; position:absolute; inset:0; border-radius:50%; box-shadow:inset 0 0 0 5px var(--hi-ring); pointer-events:none; z-index:2; }

/* check glow */
.sq.check-sq { background: radial-gradient(ellipse at center, #ff4c4c 0%, rgba(200,30,30,.65) 50%, transparent 100%) !important; }

/* piece container */
.piece-wrap { position:absolute; inset:3%; display:flex; align-items:center; justify-content:center; z-index:1; pointer-events:none; }
.piece-wrap svg { width:100%; height:100%; display:block; }

/* STATUS BAR */
.status-bar { padding:8px 14px; border-radius:8px; text-align:center; font-size:13px; font-weight:600; background:var(--card); border:1px solid var(--border); color:var(--text); letter-spacing:.1px; }
.status-bar.myturn  { background:#1e3010; border-color:var(--green); color:#a8e060; }
.status-bar.danger  { background:#2e0f0f; border-color:var(--danger); color:#ff9090; }
.status-bar.ended   { background:var(--surface); color:var(--dim); }

/* GAME ACTIONS */
.game-actions { display:flex; gap:6px; }
.game-actions .btn { margin-top:0; }

/* DRAW OFFER BANNER */
.offer-banner { background:#222010; border:1px solid #5a5410; border-radius:8px; padding:10px 13px; display:flex; justify-content:space-between; align-items:center; gap:8px; }
.offer-text  { font-size:13px; color:#d4d040; }
.offer-btns  { display:flex; gap:6px; }

/* CHAT */
.chat-box { background:var(--card); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
.chat-hdr { padding:7px 12px; border-bottom:1px solid var(--border); font-size:11px; font-weight:700; color:var(--dim); text-transform:uppercase; letter-spacing:1px; }
.chat-log { height:90px; overflow-y:auto; padding:8px 12px; display:flex; flex-direction:column; gap:3px; }
.chat-log::-webkit-scrollbar { width:3px; }
.chat-log::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }
.chat-msg { font-size:12px; line-height:1.5; }
.chat-msg .who { font-weight:700; margin-right:3px; }
.chat-msg .who.me  { color:var(--blue); }
.chat-msg .who.opp { color:var(--gl); }
.chat-sys { font-size:11px; color:var(--dim); font-style:italic; }
.chat-input-row { display:flex; gap:6px; padding:7px; border-top:1px solid var(--border); }
.chat-input-row input { margin-bottom:0; flex:1; padding:7px 10px; font-size:12px; border-radius:6px; }
.chat-send { padding:7px 13px; background:var(--green); border:none; border-radius:6px; color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; }

/* ── WINNER SCREEN ── */
.winner-scr { width:100%; max-width:420px; padding:14px; display:flex; flex-direction:column; gap:12px; align-items:center; text-align:center; }
.winner-icon  { font-size:64px; line-height:1; margin-bottom:4px; animation:pop .4s ease; }
@keyframes pop { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }
.winner-title { font-size:32px; font-weight:700; color:#fff; }
.winner-sub   { font-size:14px; color:var(--dim); margin-top:3px; }
.pay-btn { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; padding:13px; border:none; border-radius:8px; color:#fff; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; transition:opacity .15s; font-family:inherit; }
.pay-btn:hover { opacity:.88; }
.pay-btn.green { background:#1a5228; }
.pay-btn.blue  { background:#1a2f52; }

/* ── ADMIN ── */
.admin-scr { width:100%; max-width:420px; padding:14px; display:flex; flex-direction:column; gap:12px; }
.stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:4px; }
.stat-box { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px; text-align:center; }
.stat-num { font-size:26px; font-weight:700; color:#fff; }
.stat-lbl { font-size:10px; color:var(--dim); text-transform:uppercase; letter-spacing:.5px; margin-top:2px; }
.game-item { background:var(--surface); border-radius:7px; padding:10px 12px; margin-bottom:6px; font-size:12px; }
.game-item-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:3px; }
.game-item-upi { color:var(--dim); }
.badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700; text-transform:uppercase; }
.b-done    { background:#1a3a1a; color:var(--gl); }
.b-play    { background:#1a2a3a; color:var(--blue); }
.b-wait    { background:#2a2a1a; color:var(--gold); }

/* PAY STEP */
.pay-step { background:var(--surface); border-radius:8px; padding:14px; margin-bottom:11px; }
.pay-step-title { font-size:13px; font-weight:700; color:#fff; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
.step-num { background:var(--green); color:#fff; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }

@media (max-width:360px) { .rc { font-size:40px; letter-spacing:10px; } .timer { font-size:15px; min-width:54px; } }
`;

// ══════════════════════════════════════════════════════════════
//  LOBBY
// ══════════════════════════════════════════════════════════════
function Lobby({ onCreated, onJoined, settings }) {
  const [tab,setTab] = useState("create");
  const [upi,setUpi] = useState("");
  const [code,setCode] = useState("");
  const [mins,setMins] = useState("10");
  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState("");
  const fee = settings?.entry_fee||10, cut = settings?.platform_cut||2, prize = fee*2-cut*2;

  const create = async () => {
    if (!upi.trim()) return setErr("Enter your UPI ID");
    setBusy(true); setErr("");
    const id = mkCode(), t = parseInt(mins)||10;
    const { error } = await supabase.from("games").insert({ id, player1_upi:upi.trim(), board:JSON.stringify(initBoard()), turn:"w", status:"waiting", timer_mins:t, p1_time:t*60, p2_time:t*60 });
    setBusy(false);
    if (error) return setErr("Could not create room. Try again.");
    onCreated({ code:id, upi:upi.trim(), role:"w" });
  };

  const join = async () => {
    if (!upi.trim()) return setErr("Enter your UPI ID");
    if (!code.trim()) return setErr("Enter room code");
    setBusy(true); setErr("");
    const { data, error } = await supabase.from("games").select("*").eq("id",code.trim()).single();
    if (error||!data) { setBusy(false); return setErr("Room not found. Check the code."); }
    if (data.status!=="waiting") { setBusy(false); return setErr("Game already started or full."); }
    if (data.player1_upi===upi.trim()) { setBusy(false); return setErr("You created this room — share code!"); }
    await supabase.from("games").update({ player2_upi:upi.trim(), status:"payment" }).eq("id",code.trim());
    setBusy(false);
    onJoined({ code:code.trim(), upi:upi.trim(), role:"b", game:data });
  };

  return (
    <div className="scr">
      <div className="card">
        <div className="card-t">♟ Find a Game</div>
        <div className="card-s">Enter your UPI ID and play for real money</div>
        <div className="fee-row">
          <div className="fee-item"><span className="fee-amt">₹{fee}</span><span className="fee-lbl">Entry</span></div>
          <span className="fee-arrow">→</span>
          <div className="fee-item"><span className="fee-amt">₹{prize}</span><span className="fee-lbl">Winner</span></div>
          <span className="fee-arrow">+</span>
          <div className="fee-item"><span className="fee-amt">₹{cut*2}</span><span className="fee-lbl">Platform</span></div>
        </div>
        <div className="tabs">
          <div className={`tab${tab==="create"?" on":""}`} onClick={()=>setTab("create")}>Create Room</div>
          <div className={`tab${tab==="join"?" on":""}`} onClick={()=>setTab("join")}>Join Room</div>
        </div>
        <label>Your UPI / GPay ID</label>
        <input placeholder="e.g. 9876543210@ybl" value={upi} onChange={e=>{setUpi(e.target.value);setErr("");}} />
        {tab==="create" && (<><label>Time Control</label><select value={mins} onChange={e=>setMins(e.target.value)}><option value="3">3 min</option><option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option></select></>)}
        {tab==="join"   && (<><label>Room Code</label><input placeholder="4-digit code" value={code} maxLength={4} onChange={e=>{setCode(e.target.value);setErr("");}} /></>)}
        {err && <p className="err-msg">{err}</p>}
        <button className="btn" disabled={busy} onClick={tab==="create"?create:join}>{busy?"Please wait…":tab==="create"?"Create Room":"Join Room"}</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  WAITING
// ══════════════════════════════════════════════════════════════
function Waiting({ code, upi, onReady }) {
  useSync(code, d => { if(["payment","playing"].includes(d.status)) onReady(d); });
  return (
    <div className="scr">
      <div className="card">
        <div className="card-t">Room Created ✓</div>
        <div className="card-s">Share this code with your opponent</div>
        <div className="rc-wrap"><div className="rc">{code}</div><div className="rc-hint">4-digit room code</div></div>
        <div style={{background:"var(--surface)",borderRadius:7,padding:"11px 13px"}}>
          <div style={{fontSize:11,color:"var(--dim)",marginBottom:3}}>Your UPI</div>
          <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{upi}</div>
          <div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>You play as White ♔</div>
        </div>
        <div className="status-row"><div className="pulse-dot"/><span>Waiting for opponent to join…</span></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAYMENT
// ══════════════════════════════════════════════════════════════
function Payment({ game, myRole, myUpi, onPaid, settings }) {
  const [paid, setPaid] = useState(false);
  const fee = settings?.entry_fee||10, ownerUpi = settings?.owner_upi||DEFAULT_UPI;
  const myField = myRole==="w" ? "p1_paid" : "p2_paid";

  const confirm = async () => { setPaid(true); await supabase.from("games").update({[myField]:true}).eq("id",game.id); };
  useSync(game.id, d => { if(d.p1_paid&&d.p2_paid) onPaid(d); });

  return (
    <div className="scr">
      <div className="card">
        <div className="card-t">Pay Entry Fee</div>
        <div className="card-s">Room {game.id} · Both players must pay ₹{fee} to start</div>
        <div className="pay-step">
          <div className="pay-step-title"><div className="step-num">1</div>Pay ₹{fee} via GPay / UPI</div>
          <div className="ir"><span className="lbl">Pay To</span><span className="val">{ownerUpi}</span></div>
          <div className="ir"><span className="lbl">Amount</span><span className="val">₹{fee}</span></div>
          <div className="ir"><span className="lbl">Your UPI</span><span className="val">{myUpi}</span></div>
        </div>
        {!paid ? (
          <>
            <a className="pay-btn blue" href={upiLink(ownerUpi,"ChessBet",fee,`Entry Room ${game.id}`)} style={{marginBottom:10,borderRadius:7}}>
              📱 Open GPay — Pay ₹{fee}
            </a>
            <p style={{textAlign:"center",fontSize:12,color:"var(--dim)",marginBottom:10}}>After paying, confirm below ↓</p>
            <button className="btn" onClick={confirm}>✅ I Have Paid — Ready!</button>
          </>
        ) : (
          <div style={{textAlign:"center",padding:"14px 0"}}>
            <div style={{fontSize:36,marginBottom:8}}>✅</div>
            <div style={{fontWeight:700,color:"#fff",marginBottom:6}}>Payment confirmed!</div>
            <div className="status-row"><div className="pulse-dot"/><span>Waiting for opponent to pay…</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  GAME
// ══════════════════════════════════════════════════════════════
function Game({ game, myRole, onGameOver, settings }) {
  const [board,  setBoard]  = useState(() => JSON.parse(game.board));
  const [turn,   setTurn]   = useState(game.turn||"w");
  const [sel,    setSel]    = useState(null);
  const [moves,  setMoves]  = useState([]);   // legal moves for selected piece
  const [lastMv, setLastMv] = useState(null);
  const [checked,setChecked]= useState(false);
  const [ended,  setEnded]  = useState(false);
  const [p1t,    setP1t]    = useState(game.p1_time||(game.timer_mins||10)*60);
  const [p2t,    setP2t]    = useState(game.p2_time||(game.timer_mins||10)*60);
  const [drawOff,setDrawOff]= useState(null);
  const [chat,   setChat]   = useState([{sys:true,text:"Game started! Good luck 🎯"}]);
  const [chatIn, setChatIn] = useState("");
  const [rematch,setRematch]= useState(null);
  const chatEndRef = useRef(null);
  const endedRef   = useRef(false);   // ref so async callbacks see latest value

  const myTurn  = turn === myRole;
  const oppRole = opp(myRole);
  const p1upi   = game.player1_upi, p2upi = game.player2_upi;
  const myUpi   = myRole==="w" ? p1upi : p2upi;
  const oppUpi  = myRole==="w" ? p2upi : p1upi;
  const myTime  = myRole==="w" ? p1t : p2t;
  const oppTime = myRole==="w" ? p2t : p1t;

  // ── Sync remote state ──────────────────────────────────────
  useSync(game.id, d => {
    if (!d.board) return;
    const nb = JSON.parse(d.board);
    setBoard(nb);
    setTurn(d.turn);
    setChecked(inCheck(nb, d.turn));
    if (d.last_move) { try { setLastMv(JSON.parse(d.last_move)); } catch(e){} }
    if (d.p1_time!=null) setP1t(d.p1_time);
    if (d.p2_time!=null) setP2t(d.p2_time);
    setDrawOff(d.draw_offer||null);
    if (d.chat_log) { try { setChat(JSON.parse(d.chat_log)); } catch(e){} }
    if (d.rematch_req) setRematch(d.rematch_req);
    if (d.status==="done" && !endedRef.current) { endedRef.current=true; setEnded(true); onGameOver(d); }
  }, !ended);

  // ── Timer (only ticks when game is active) ─────────────────
  useEffect(() => {
    if (ended) return;
    const iv = setInterval(() => {
      const setter = turn==="w" ? setP1t : setP2t;
      setter(t => {
        if (t <= 1) {
          // timeout — stop immediately
          clearInterval(iv);
          const w = opp(turn);
          supabase.from("games").update({ status:"done", winner:w, end_reason:"timeout" }).eq("id", game.id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [turn, ended, game.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chat]);

  // ── Make a move ────────────────────────────────────────────
  const applyAndSync = async (from, to) => {
    const nb     = execMove(board, from, to);
    const newLm  = { piece:board[from[0]][from[1]], from, to };
    const nextT  = opp(turn);
    const result = gameResult(nb, nextT, newLm);   // CHECK GAME RESULT

    // Immediately update local state
    setBoard(nb); setTurn(nextT); setChecked(inCheck(nb,nextT));
    setSel(null); setMoves([]);  setLastMv(newLm);

    const isOver = result.status !== "playing";
    const dbStatus = isOver ? "done" : "playing";
    const dbWinner = isOver ? result.winner : null;
    const dbReason = isOver ? result.status : null;  // "checkmate" | "stalemate"

    const timeField = turn==="w" ? "p1_time" : "p2_time";
    const timeVal   = turn==="w" ? p1t       : p2t;

    await supabase.from("games").update({
      board:       JSON.stringify(nb),
      turn:        nextT,
      last_move:   JSON.stringify(newLm),
      [timeField]: timeVal,
      status:      dbStatus,
      winner:      dbWinner,
      end_reason:  dbReason,
    }).eq("id", game.id);

    if (isOver) {
      endedRef.current = true;
      setEnded(true);
      onGameOver({ ...game, winner:dbWinner, status:"done", end_reason:dbReason, board:JSON.stringify(nb) });
    }
  };

  const handleSquare = useCallback((r, c) => {
    if (!myTurn || ended) return;
    const piece = board[r][c];
    if (sel) {
      const legal = moves.some(([lr,lc])=>lr===r&&lc===c);
      if (legal) { applyAndSync(sel,[r,c]); return; }
      // reselect own piece
      if (col(piece)===turn) { setSel([r,c]); setMoves(legalMoves(board,r,c,lastMv)); return; }
      setSel(null); setMoves([]);
      return;
    }
    if (col(piece)===turn) { setSel([r,c]); setMoves(legalMoves(board,r,c,lastMv)); }
  }, [board, turn, myTurn, sel, moves, lastMv, ended]);

  // ── Game actions ───────────────────────────────────────────
  const offerDraw  = async () => { await supabase.from("games").update({draw_offer:myRole}).eq("id",game.id); setDrawOff(myRole); };
  const acceptDraw = async () => { await supabase.from("games").update({status:"done",winner:"draw",end_reason:"agreement"}).eq("id",game.id); };
  const declineDraw= async () => { await supabase.from("games").update({draw_offer:null}).eq("id",game.id); setDrawOff(null); };
  const resign     = async () => {
    if (!window.confirm("Resign this game?")) return;
    await supabase.from("games").update({status:"done",winner:oppRole,end_reason:"resign"}).eq("id",game.id);
  };
  const sendChat = async () => {
    if (!chatIn.trim()) return;
    const nc = [...chat, {sender:myRole, text:chatIn.trim()}];
    setChat(nc); setChatIn("");
    await supabase.from("games").update({chat_log:JSON.stringify(nc)}).eq("id",game.id);
  };
  const reqRematch = async () => { await supabase.from("games").update({rematch_req:myRole}).eq("id",game.id); };

  // ── Board rendering ────────────────────────────────────────
  const cap     = getCaptured(board);
  const rows    = myRole==="b" ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const cols2   = myRole==="b" ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const files   = "abcdefgh";
  const kingPos = checked ? kingSquare(board, turn) : null;

  const sqClass = (r,c,piece) => {
    const light = (r+c)%2===0;
    const isSel = sel&&sel[0]===r&&sel[1]===c;
    const isFrom= lastMv&&lastMv.from[0]===r&&lastMv.from[1]===c;
    const isTo  = lastMv&&lastMv.to[0]===r&&lastMv.to[1]===c;
    const isLeg = moves.some(([lr,lc])=>lr===r&&lc===c);
    const isLegCap = isLeg && !!piece;
    const isChk = kingPos&&kingPos[0]===r&&kingPos[1]===c;
    let cls = `sq ${light?"light":"dark"}`;
    if (isSel)      cls += " sel";
    else if (isFrom)cls += " from";
    else if (isTo)  cls += " to";
    if (isLegCap)   cls += " legal-cap";
    else if (isLeg) cls += " legal";
    if (isChk)      cls += " check-sq";
    return cls;
  };

  // ── Status bar text ────────────────────────────────────────
  const statusText = () => {
    if (ended) return "Game Over";
    if (myTurn) return checked ? "⚠️ You are in CHECK — move your king!" : "Your turn to move";
    return checked ? "Opponent is in Check" : "Opponent's turn…";
  };
  const statusCls = ended ? "status-bar ended" : myTurn ? (checked?"status-bar danger":"status-bar myturn") : (checked?"status-bar danger":"status-bar");

  return (
    <div className="game-scr">
      {/* ── Opponent panel ── */}
      <div className="pp">
        <div className="pp-left">
          <div className={`pp-icon${turn===oppRole&&!ended?" active":""}`}>{oppRole==="w"?"♙":"♟"}</div>
          <div>
            <div className="pp-name">{oppUpi}</div>
            <div className="pp-role">{oppRole==="w"?"White":"Black"}</div>
            <div className="pp-cap">
              {(oppRole==="w"?cap.w:cap.b).map((p,i)=>(
                <span key={i}><Piece code={p}/></span>
              ))}
            </div>
          </div>
        </div>
        <div className={`timer${turn===oppRole&&!ended?" active":""}${oppTime<30?" low":""}`}>{fmt(oppTime)}</div>
      </div>

      {/* ── Draw offer banner ── */}
      {drawOff && drawOff!==myRole && !ended && (
        <div className="offer-banner">
          <span className="offer-text">Opponent offers a draw</span>
          <div className="offer-btns">
            <button className="btn btn-sm" onClick={acceptDraw}>Accept</button>
            <button className="btn btn-sm btn-red" onClick={declineDraw}>Decline</button>
          </div>
        </div>
      )}
      {drawOff===myRole && !ended && (
        <div className="offer-banner"><span className="offer-text">Draw offer sent — waiting…</span></div>
      )}

      {/* ── BOARD ── */}
      <div className="board-wrap">
        <div className="board-with-coords">
          <div className="board-inner">
            {/* rank labels */}
            <div className="rank-col">
              {rows.map(r=><div key={r} className="coord-lbl">{8-r}</div>)}
            </div>
            {/* squares */}
            <div className="board-grid">
              {rows.map(r=>cols2.map(c=>{
                const piece=board[r][c];
                return (
                  <div key={`${r}${c}`} className={sqClass(r,c,piece)} onClick={()=>handleSquare(r,c)}>
                    {piece && <div className="piece-wrap"><Piece code={piece}/></div>}
                  </div>
                );
              }))}
            </div>
          </div>
          {/* file labels */}
          <div className="file-row">
            {cols2.map(c=><div key={c} className="coord-lbl">{files[c]}</div>)}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className={statusCls}>{statusText()}</div>

      {/* ── My panel ── */}
      <div className="pp">
        <div className="pp-left">
          <div className={`pp-icon${myTurn&&!ended?" active":""}`}>{myRole==="w"?"♙":"♟"}</div>
          <div>
            <div className="pp-name">{myUpi} <span style={{fontSize:10,color:"var(--dim)"}}>(You)</span></div>
            <div className="pp-role">{myRole==="w"?"White":"Black"}</div>
            <div className="pp-cap">
              {(myRole==="w"?cap.w:cap.b).map((p,i)=>(
                <span key={i}><Piece code={p}/></span>
              ))}
            </div>
          </div>
        </div>
        <div className={`timer${myTurn&&!ended?" active":""}${myTime<30?" low":""}`}>{fmt(myTime)}</div>
      </div>

      {/* ── In-game actions ── */}
      {!ended && (
        <div className="game-actions">
          <button className="btn btn-ghost btn-sm" onClick={offerDraw} disabled={!!drawOff}>Offer Draw</button>
          <button className="btn btn-red btn-sm" onClick={resign}>Resign</button>
        </div>
      )}
      {ended && !rematch && (
        <button className="btn" onClick={reqRematch}>Request Rematch</button>
      )}
      {ended && rematch && rematch!==myRole && (
        <p style={{textAlign:"center",fontSize:13,color:"var(--gl)",padding:"4px"}}>Opponent wants a rematch!</p>
      )}

      {/* ── Chat ── */}
      <div className="chat-box">
        <div className="chat-hdr">Chat</div>
        <div className="chat-log">
          {chat.map((m,i)=>m.sys
            ? <div key={i} className="chat-sys">{m.text}</div>
            : <div key={i} className="chat-msg">
                <span className={`who ${m.sender===myRole?"me":"opp"}`}>
                  {m.sender===myRole ? "You" : oppUpi.split("@")[0]}:
                </span>
                {m.text}
              </div>
          )}
          <div ref={chatEndRef}/>
        </div>
        <div className="chat-input-row">
          <input placeholder="Message…" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} />
          <button className="chat-send" onClick={sendChat}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  WINNER
// ══════════════════════════════════════════════════════════════
function Winner({ game, myRole, onPlayAgain, settings }) {
  const w = game.winner, reason = game.end_reason;
  const isDraw = w==="draw", iWon = w===myRole;
  const fee = settings?.entry_fee||10, cut = settings?.platform_cut||2, prize = fee*2-cut*2;
  const ownerUpi = settings?.owner_upi||DEFAULT_UPI;
  const winnerUpi = w==="w" ? game.player1_upi : w==="b" ? game.player2_upi : null;
  const rl = { checkmate:"by Checkmate", stalemate:"Stalemate", timeout:"on Time", resign:"by Resignation", agreement:"Draw agreed" };

  return (
    <div className="winner-scr">
      <div className="winner-icon">{isDraw?"🤝":iWon?"🏆":"😔"}</div>
      <div className="winner-title">{isDraw?"Draw":iWon?"You Won!":"You Lost"}</div>
      <div className="winner-sub">{rl[reason]||""}</div>
      <div className="card" style={{width:"100%",textAlign:"left"}}>
        <div style={{fontWeight:700,color:"#fff",marginBottom:12,fontSize:14}}>Payment Summary</div>
        <div className="ir"><span className="lbl">{game.player1_upi} paid</span><span className="val">₹{fee}</span></div>
        <div className="ir"><span className="lbl">{game.player2_upi} paid</span><span className="val">₹{fee}</span></div>
        <div className="ir"><span className="lbl">Platform fee (₹{cut}×2)</span><span className="val">₹{cut*2}</span></div>
        {!isDraw && <div className="ir total"><span className="lbl">{winnerUpi} wins</span><span className="val">₹{prize}</span></div>}
        {isDraw  && <div className="ir total"><span className="lbl">Each player refund</span><span className="val">₹{fee-cut}</span></div>}
      </div>
      {winnerUpi && <a className="pay-btn green" href={upiLink(winnerUpi,"Chess Winner",prize,`Winnings Room ${game.id}`)}>📱 Pay ₹{prize} to {winnerUpi}</a>}
      <a className="pay-btn blue" href={upiLink(ownerUpi,"ChessBet Fee",cut*2,`Platform fee Room ${game.id}`)}>💼 Pay ₹{cut*2} Platform Fee</a>
      <p style={{fontSize:11,color:"var(--dim)",lineHeight:1.8}}>Platform fee → {ownerUpi}</p>
      <button className="btn btn-ghost" onClick={onPlayAgain}>New Game</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════════
function Admin({ onBack }) {
  const [pin,setPIN]   = useState("");
  const [auth,setAuth] = useState(false);
  const [cfg,setCfg]   = useState({ entry_fee:10, platform_cut:2, owner_upi:"" });
  const [games,setGames]= useState([]);
  const [busy,setBusy] = useState(false);
  const [saved,setSaved]= useState(false);
  const [err,setErr]   = useState("");

  const login = () => { if(pin===ADMIN_PIN){setAuth(true);load();}else setErr("Wrong PIN"); };
  const load  = async () => {
    setBusy(true);
    const {data:s} = await supabase.from("settings").select("*").eq("id","main").single();
    if (s) setCfg(s);
    const {data:g} = await supabase.from("games").select("*").order("created_at",{ascending:false}).limit(30);
    if (g) setGames(g);
    setBusy(false);
  };
  const save  = async () => { await supabase.from("settings").upsert({id:"main",...cfg}); setSaved(true); setTimeout(()=>setSaved(false),2000); };

  const done = games.filter(g=>g.status==="done").length;
  const earned = done*(cfg.platform_cut||2)*2;

  if (!auth) return (
    <div className="scr">
      <div className="card">
        <div className="card-t">Admin Panel</div>
        <div className="card-s">Enter your PIN to access admin settings</div>
        <input type="password" placeholder="Admin PIN" value={pin} onChange={e=>{setPIN(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()} />
        {err && <p className="err-msg">{err}</p>}
        <button className="btn" onClick={login}>Login</button>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );

  return (
    <div className="admin-scr">
      <div className="card">
        <div className="card-t" style={{marginBottom:12}}>Dashboard</div>
        <div className="stat-grid">
          <div className="stat-box"><div className="stat-num">{games.length}</div><div className="stat-lbl">Total Games</div></div>
          <div className="stat-box"><div className="stat-num">{done}</div><div className="stat-lbl">Completed</div></div>
          <div className="stat-box"><div className="stat-num">₹{earned}</div><div className="stat-lbl">Fees Earned</div></div>
          <div className="stat-box"><div className="stat-num">₹{cfg.entry_fee||10}</div><div className="stat-lbl">Entry Fee</div></div>
        </div>
      </div>
      <div className="card">
        <div className="card-t" style={{marginBottom:12}}>Settings</div>
        <label>Your UPI ID (all fees go here)</label>
        <input placeholder="yourname@upi" value={cfg.owner_upi||""} onChange={e=>setCfg({...cfg,owner_upi:e.target.value})} />
        <label>Entry Fee per Player (₹)</label>
        <input type="number" value={cfg.entry_fee||10} onChange={e=>setCfg({...cfg,entry_fee:parseInt(e.target.value)||10})} />
        <label>Your Cut per Player (₹)</label>
        <input type="number" value={cfg.platform_cut||2} onChange={e=>setCfg({...cfg,platform_cut:parseInt(e.target.value)||2})} />
        <p style={{fontSize:12,color:"var(--gl)",marginBottom:12}}>Prize: ₹{(cfg.entry_fee||10)*2-(cfg.platform_cut||2)*2} · Your earnings/game: ₹{(cfg.platform_cut||2)*2}</p>
        <button className="btn" onClick={save}>{saved?"✅ Saved!":"Save Settings"}</button>
      </div>
      <div className="card">
        <div className="card-t" style={{marginBottom:10}}>Recent Games</div>
        {busy && <p style={{color:"var(--dim)",fontSize:13}}>Loading…</p>}
        {games.map(g=>(
          <div className="game-item" key={g.id}>
            <div className="game-item-top">
              <span style={{fontWeight:700,color:"#fff"}}>Room #{g.id}</span>
              <span className={`badge ${g.status==="done"?"b-done":g.status==="playing"?"b-play":"b-wait"}`}>{g.status}</span>
            </div>
            <div className="game-item-upi">{g.player1_upi} vs {g.player2_upi||"waiting…"}</div>
            {g.winner && <div style={{fontSize:11,color:"var(--gl)",marginTop:2}}>Winner: {g.winner==="draw"?"Draw":g.winner==="w"?g.player1_upi:g.player2_upi} · {g.end_reason}</div>}
          </div>
        ))}
        {!busy && games.length===0 && <p style={{color:"var(--dim)",fontSize:13}}>No games yet</p>}
      </div>
      <button className="btn btn-ghost" onClick={onBack}>← Back to Game</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [screen,  setScreen]  = useState("lobby");
  const [session, setSession] = useState(null);
  const [settings,setSettings]= useState({ entry_fee:10, platform_cut:2, owner_upi:DEFAULT_UPI });

  useEffect(() => {
    supabase.from("settings").select("*").eq("id","main").single()
      .then(({data}) => { if(data) setSettings(data); });
  }, []);

  const goto = s => setScreen(s);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Header */}
        <div className="hdr">
          <div className="logo"><span className="logo-pawn">♟</span>ChessBet</div>
          <button className="abtn" onClick={()=>goto(screen==="admin"?"lobby":"admin")}>
            {screen==="admin" ? "✕ Close" : "⚙ Admin"}
          </button>
        </div>

        {screen==="admin" && <Admin onBack={()=>goto("lobby")} />}

        {screen==="lobby" && (
          <Lobby settings={settings}
            onCreated={({code,upi,role})=>{ setSession({code,upi,role,game:null}); goto("waiting"); }}
            onJoined= {({code,upi,role,game})=>{ setSession({code,upi,role,game}); goto("payment"); }}
          />
        )}

        {screen==="waiting" && session && (
          <Waiting code={session.code} upi={session.upi}
            onReady={g=>{ setSession(s=>({...s,game:g})); goto("payment"); }}
          />
        )}

        {screen==="payment" && session?.game && (
          <Payment game={session.game} myRole={session.role} myUpi={session.upi} settings={settings}
            onPaid={async g=>{
              await supabase.from("games").update({status:"playing"}).eq("id",g.id);
              setSession(s=>({...s,game:{...g,status:"playing"}}));
              goto("game");
            }}
          />
        )}

        {screen==="game" && session?.game && (
          <Game game={session.game} myRole={session.role} settings={settings}
            onGameOver={g=>{ setSession(s=>({...s,game:g})); goto("winner"); }}
          />
        )}

        {screen==="winner" && session?.game && (
          <Winner game={session.game} myRole={session.role} settings={settings}
            onPlayAgain={()=>{ setSession(null); goto("lobby"); }}
          />
        )}
      </div>
    </>
  );
}
