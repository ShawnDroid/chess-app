import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dmcjbzyyfgmezqmrvmco.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ofp9kSxXEco5WzyI4XVN8Q_gO9mk-jz";
const ADMIN_PIN    = "1234";
const OWNER_UPI    = "your_upi_id@upi";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CHESS PIECES — proper SVG like Chess.com (Neo style) ────────────────────
const SVG_PIECES = {
  wK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-width="1.5"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke="#000"/><path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-8-10-2c-3 6.5 5 10.5 5 10.5v7.5z" fill="#fff"/><path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0"/></g></svg>`,
  bK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6" stroke="#fff" stroke-width="1.5"/><path d="M20 8h5" stroke="#fff" stroke-width="1.5"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-8-10-2c-3 6.5 5 10.5 5 10.5v7.5z"/><path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0" stroke="#fff"/></g></svg>`,
  wQ: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/><path d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 25l-.3-14.1L22.5 24 15.3 10.9 15 25 6.5 13.5 9 26z"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" fill="none"/></g></svg>`,
  bQ: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/><path d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 25l-.3-14.1L22.5 24 15.3 10.9 15 25 6.5 13.5 9 26z" stroke="#fff" stroke-linejoin="miter"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" stroke="#fff" fill="none"/></g></svg>`,
  wR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"/><path d="M14 29.5v-13h17v13H14z"/><path d="M9 11.5h4v4H9v-4zM32 11.5h4v4h-4v-4zM14 11.5h17v4H14v-4z"/><path d="M9 15.5h27M9 19.5h27" fill="none"/></g></svg>`,
  bR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"/><path d="M14 29.5v-13h17v13H14z"/><path d="M9 11.5h4v4H9v-4zM32 11.5h4v4h-4v-4zM14 11.5h17v4H14v-4z"/><path d="M9 15.5h27M9 19.5h27" stroke="#fff" fill="none"/></g></svg>`,
  wB: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M17.5 26h10M15 30h15" fill="none"/></g></svg>`,
  bB: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M17.5 26h10M15 30h15" stroke="#fff" fill="none"/></g></svg>`,
  wN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path d="M24 18c.38 5.12-3 7.45-6.26 9.77C15.06 29.67 14 34 14 38.5h-1.5c0-5.56 1.06-10.09 3.74-12.23C19 24.45 22.38 22.12 22 17z"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#000" stroke="#000"/><path d="M15 15.5c-.39 1.49-1.49 3.01-1.5 4.5 3.5 1.5 9.5 1.5 13 0 0-1.5-1.12-3.01-1.5-4.5" fill="#fff"/></g></svg>`,
  bN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path d="M24 18c.38 5.12-3 7.45-6.26 9.77C15.06 29.67 14 34 14 38.5h-1.5c0-5.56 1.06-10.09 3.74-12.23C19 24.45 22.38 22.12 22 17z"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#fff" stroke="#fff"/><path d="M15 15.5c-.39 1.49-1.49 3.01-1.5 4.5 3.5 1.5 9.5 1.5 13 0 0-1.5-1.12-3.01-1.5-4.5" fill="#fff" stroke="#fff"/></g></svg>`,
  wP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M22.5 15.5c-3 0-4.3 2.1-4.3 5.2 0 2.3 1.4 3.8 2.3 5.8H24.5c.9-2 2.3-3.5 2.3-5.8 0-3.1-1.3-5.2-4.3-5.2z"/><path d="M15 39.5h15M17 36.5h11l-1-8H18z"/></g></svg>`,
  bP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M22.5 15.5c-3 0-4.3 2.1-4.3 5.2 0 2.3 1.4 3.8 2.3 5.8H24.5c.9-2 2.3-3.5 2.3-5.8 0-3.1-1.3-5.2-4.3-5.2z"/><path d="M15 39.5h15M17 36.5h11l-1-8H18z"/></g></svg>`,
};

function PieceSVG({ code, size = "100%" }) {
  const svg = SVG_PIECES[code];
  if (!svg) return null;
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

// ─── CHESS LOGIC ─────────────────────────────────────────────────────────────
function initBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  const back = ["R","N","B","Q","K","B","N","R"];
  for (let c = 0; c < 8; c++) { b[0][c]="b"+back[c]; b[1][c]="bP"; b[7][c]="w"+back[c]; b[6][c]="wP"; }
  return b;
}
const pc = p => p ? p[0] : null;
const isEnemy = (p,t) => p && pc(p) !== t;
const isFriend = (p,t) => p && pc(p) === t;
function inB(r,c) { return r>=0&&r<8&&c>=0&&c<8; }
function getRaw(board,r,c,turn,lm) {
  const p=board[r][c]; if(!p||pc(p)!==turn) return [];
  const t=p[1], mv=[];
  const add=(tr,tc)=>{ if(inB(tr,tc)&&!isFriend(board[tr][tc],turn)) mv.push([tr,tc]); };
  const slide=(dr,dc)=>{ let tr=r+dr,tc=c+dc; while(inB(tr,tc)){ if(isFriend(board[tr][tc],turn)) break; mv.push([tr,tc]); if(isEnemy(board[tr][tc],turn)) break; tr+=dr; tc+=dc; }};
  if(t==="P"){
    const d=turn==="w"?-1:1, s=turn==="w"?6:1;
    if(inB(r+d,c)&&!board[r+d][c]){ mv.push([r+d,c]); if(r===s&&!board[r+2*d][c]) mv.push([r+2*d,c]); }
    for(const dc of[-1,1]){
      if(inB(r+d,c+dc)&&isEnemy(board[r+d][c+dc],turn)) mv.push([r+d,c+dc]);
      if(lm&&lm.piece===(turn==="w"?"bP":"wP")&&lm.to[0]===r&&lm.to[1]===c+dc&&Math.abs(lm.from[0]-lm.to[0])===2) mv.push([r+d,c+dc]);
    }
  } else if(t==="N"){ for(const[dr,dc]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr,c+dc); }
  else if(t==="B"){ for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc); }
  else if(t==="R"){ for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  else if(t==="Q"){ for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  else if(t==="K"){
    for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r+dr,c+dc);
    if(turn==="w"&&r===7){ if(!board[7][5]&&!board[7][6]&&board[7][7]==="wR") mv.push([7,6]); if(!board[7][3]&&!board[7][2]&&!board[7][1]&&board[7][0]==="wR") mv.push([7,2]); }
    if(turn==="b"&&r===0){ if(!board[0][5]&&!board[0][6]&&board[0][7]==="bR") mv.push([0,6]); if(!board[0][3]&&!board[0][2]&&!board[0][1]&&board[0][0]==="bR") mv.push([0,2]); }
  }
  return mv;
}
function findKing(board,turn){ for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]===turn+"K") return[r,c]; return null; }
function applyMove(board,from,to){
  const nb=board.map(r=>[...r]);
  const p=nb[from[0]][from[1]];
  nb[to[0]][to[1]]=p; nb[from[0]][from[1]]=null;
  if(p[1]==="K"){ if(from[1]===4&&to[1]===6){nb[from[0]][5]=nb[from[0]][7];nb[from[0]][7]=null;} if(from[1]===4&&to[1]===2){nb[from[0]][3]=nb[from[0]][0];nb[from[0]][0]=null;} }
  if(p==="wP"&&to[0]===0) nb[to[0]][to[1]]="wQ";
  if(p==="bP"&&to[0]===7) nb[to[0]][to[1]]="bQ";
  return nb;
}
function isInCheck(board,turn){
  const king=findKing(board,turn); if(!king) return false;
  const opp=turn==="w"?"b":"w";
  for(let r=0;r<8;r++) for(let c=0;c<8;c++)
    if(pc(board[r][c])===opp&&getRaw(board,r,c,opp,null).some(([tr,tc])=>tr===king[0]&&tc===king[1])) return true;
  return false;
}
function getLegal(board,r,c,turn,lm){ return getRaw(board,r,c,turn,lm).filter(([tr,tc])=>!isInCheck(applyMove(board,[r,c],[tr,tc]),turn)); }
function hasAny(board,turn,lm){ for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(pc(board[r][c])===turn&&getLegal(board,r,c,turn,lm).length>0) return true; return false; }
function getCaptured(board){
  const all={wP:8,wN:2,wB:2,wR:2,wQ:1,bP:8,bN:2,bB:2,bR:2,bQ:1};
  const on={}; for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]) on[board[r][c]]=(on[board[r][c]]||0)+1;
  const cap={w:[],b:[]}; for(const[k,v]of Object.entries(all)){ const miss=v-(on[k]||0); for(let i=0;i<miss;i++) cap[k[0]].push(k); } return cap;
}
function makeCode(){ return Math.floor(1000+Math.random()*9000).toString(); }
function upiLink(pa,pn,am,tn){ return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`; }
function fmtTime(s){ const m=Math.floor(s/60); return `${m}:${(s%60).toString().padStart(2,"0")}`; }

// ─── FAST SYNC HOOK — polls every 500ms + realtime ───────────────────────────
function useGameSync(gameId, onUpdate, active = true) {
  const lastSeenRef = useRef(null);

  useEffect(() => {
    if (!gameId || !active) return;

    // Realtime subscription
    const ch = supabase.channel("sync_" + gameId)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        payload => { onUpdate(payload.new); lastSeenRef.current = payload.new; })
      .subscribe();

    // Fast polling every 500ms as backup
    const iv = setInterval(async () => {
      const { data } = await supabase.from("games").select("*").eq("id", gameId).single();
      if (!data) return;
      // Only trigger if board or turn actually changed
      const prev = lastSeenRef.current;
      if (!prev || prev.board !== data.board || prev.turn !== data.turn ||
          prev.status !== data.status || prev.draw_offer !== data.draw_offer ||
          prev.chat_log !== data.chat_log || prev.p1_paid !== data.p1_paid || prev.p2_paid !== data.p2_paid) {
        lastSeenRef.current = data;
        onUpdate(data);
      }
    }, 500);

    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, [gameId, active]);
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#1e1e1e;font-family:'Inter',sans-serif;min-height:100vh;color:#e0e0e0;-webkit-font-smoothing:antialiased;}
:root{
  --bg:#1e1e1e;--s1:#262626;--s2:#2d2d2d;--s3:#333;
  --border:#3c3c3c;--b2:#4a4a4a;
  --green:#7fa650;--gd:#5d7a38;--gl:#93bb5e;
  --cream:#f0d9b5;--brown:#b58863;
  --sq-hi:#f6f669;--sq-lf:#cdd26a;--sq-lt:#aaa23a;
  --text:#e0e0e0;--dim:#888;--dim2:#555;
  --gold:#f0a500;--danger:#e05252;--blue:#5b9bd5;
}
.app{min-height:100vh;display:flex;flex-direction:column;align-items:center;background:var(--bg);}

/* HEADER */
.hdr{width:100%;background:#1a1a1a;border-bottom:1px solid var(--border);padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:48px;position:sticky;top:0;z-index:100;}
.logo{display:flex;align-items:center;gap:6px;font-size:17px;font-weight:700;color:#fff;}
.logo-icon{font-size:22px;}
.abtn{background:none;border:1px solid var(--border);border-radius:5px;color:var(--dim);font-size:12px;padding:4px 10px;cursor:pointer;font-family:'Inter',sans-serif;}
.abtn:hover{border-color:var(--gold);color:var(--gold);}

/* LAYOUT */
.main{width:100%;max-width:440px;padding:12px;display:flex;flex-direction:column;gap:10px;}
.card{background:var(--s1);border:1px solid var(--border);border-radius:8px;padding:16px;}
.ct{font-size:16px;font-weight:700;color:#fff;margin-bottom:3px;}
.cs{font-size:13px;color:var(--dim);margin-bottom:14px;line-height:1.5;}

/* TABS */
.tabs{display:flex;background:var(--s2);border-radius:6px;padding:3px;margin-bottom:12px;}
.tab{flex:1;padding:7px;text-align:center;border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;color:var(--dim);transition:all .15s;}
.tab.on{background:var(--green);color:#fff;}

/* INPUTS */
input,select{width:100%;background:var(--s2);border:1px solid var(--border);border-radius:6px;padding:9px 12px;color:var(--text);font-family:'Inter',sans-serif;font-size:14px;margin-bottom:9px;outline:none;transition:border-color .15s;}
input:focus,select:focus{border-color:var(--green);}
input::placeholder{color:var(--dim2);}

/* BUTTONS */
.btn{width:100%;padding:10px;background:var(--green);border:none;border-radius:6px;color:#fff;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s;margin-top:2px;}
.btn:hover{background:var(--gl);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bg{background:transparent;border:1px solid var(--border);color:var(--dim);margin-top:6px;}
.bg:hover{border-color:var(--green);color:var(--green);background:transparent;}
.bb{background:#1e3a6e;}.bb:hover{background:#2a5098;}
.br{background:#6e1e1e;}.br:hover{background:#962626;}
.bsm{padding:6px 13px;font-size:12px;width:auto;border-radius:5px;margin-top:0;}

/* FEE */
.fee-row{display:flex;align-items:center;justify-content:space-between;background:var(--s2);border-radius:7px;padding:10px 13px;margin-bottom:13px;}
.fi{text-align:center;}
.fa{font-size:19px;font-weight:700;color:#fff;display:block;}
.fl{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;}

/* ROOM CODE */
.rc-box{background:var(--s2);border:2px solid var(--border);border-radius:8px;padding:16px;text-align:center;margin-bottom:12px;}
.rc{font-size:48px;font-weight:700;color:#fff;letter-spacing:12px;font-variant-numeric:tabular-nums;}
.rh{font-size:12px;color:var(--dim);margin-top:5px;}

/* MISC */
.sr{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dim);justify-content:center;padding:6px 0;}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 1.2s ease-in-out infinite;flex-shrink:0;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.ir{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;}
.ir:last-child{border-bottom:none;}
.il{color:var(--dim);}
.iv{color:#fff;font-weight:500;}
.ir.tot .il{color:var(--gl);font-weight:600;font-size:13px;}
.ir.tot .iv{font-size:17px;font-weight:700;}
.err{color:var(--danger);font-size:12px;margin-bottom:7px;margin-top:-6px;}

/* ── GAME PAGE ── */
.gp{width:100%;max-width:440px;padding:6px;display:flex;flex-direction:column;gap:5px;}

/* PLAYER PANEL */
.pp{display:flex;justify-content:space-between;align-items:center;background:var(--s1);border:1px solid var(--border);border-radius:7px;padding:7px 11px;}
.ppl{display:flex;align-items:center;gap:7px;}
.av{width:30px;height:30px;border-radius:50%;background:var(--s2);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;}
.av.act{border-color:var(--green);}
.pn{font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
.prole{font-size:10px;color:var(--dim);}
.cap{font-size:10px;color:var(--dim);min-height:13px;display:flex;flex-wrap:wrap;gap:1px;}
.tmr{font-size:16px;font-weight:700;color:#fff;background:var(--s2);border:1px solid var(--border);border-radius:5px;padding:4px 9px;min-width:58px;text-align:center;font-variant-numeric:tabular-nums;}
.tmr.at{background:var(--gd);border-color:var(--green);}
.tmr.low{color:var(--danger);border-color:var(--danger);animation:pulse .7s ease-in-out infinite;}

/* BOARD */
.board-outer{width:100%;position:relative;}
.board-frame{display:flex;flex-direction:column;width:100%;}
.board-row{display:flex;width:100%;}
.board-grid{display:grid;grid-template-columns:repeat(8,1fr);width:100%;flex:1;}
.board-side{display:flex;flex-direction:column;width:16px;justify-content:space-around;align-items:center;}
.board-bottom{display:flex;height:16px;margin-left:16px;}
.coord{font-size:9px;font-weight:600;color:var(--dim);display:flex;align-items:center;justify-content:center;flex:1;}

.sq{position:relative;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;}
.sq::before{content:'';display:block;padding-top:100%;}
.sq-inner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.sq-inner svg{width:82%;height:82%;display:block;}
.sq.lt{background:var(--cream);}
.sq.dk{background:var(--brown);}
.sq.sel{background:var(--sq-hi)!important;}
.sq.lf{background:var(--sq-lf)!important;}
.sq.lt2{background:var(--sq-lt)!important;}
.sq.lm .sq-inner::after{content:'';position:absolute;width:34%;height:34%;border-radius:50%;background:rgba(0,0,0,.18);pointer-events:none;}
.sq.lc .sq-inner::after{content:'';position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 4px rgba(0,0,0,.22);pointer-events:none;}
.sq.ck{background:radial-gradient(ellipse at center,rgba(220,50,50,0.95) 0%,rgba(180,30,30,0.7) 55%,transparent 100%)!important;}

/* STATUS BAR */
.sb{background:var(--s1);border:1px solid var(--border);border-radius:7px;padding:7px 13px;text-align:center;font-size:13px;font-weight:500;}
.sb.mt{background:#2d4a1e;border-color:var(--green);color:#b4e07a;}
.sb.ck2{background:#3d1a1a;border-color:var(--danger);color:#ff8080;}

/* ACTIONS */
.ga{display:flex;gap:5px;}
.ga .btn{margin-top:0;}

/* DRAW OFFER */
.ob{background:#2c2c10;border:1px solid #5a5a10;border-radius:7px;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;}
.ot{font-size:13px;color:#d4d440;}
.oa{display:flex;gap:5px;}

/* CHAT */
.chat{background:var(--s1);border:1px solid var(--border);border-radius:7px;overflow:hidden;}
.ch{padding:7px 12px;border-bottom:1px solid var(--border);font-size:11px;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;}
.cm{height:80px;overflow-y:auto;padding:7px 11px;display:flex;flex-direction:column;gap:3px;}
.cm::-webkit-scrollbar{width:3px;}
.cm::-webkit-scrollbar-thumb{background:var(--border);}
.msg{font-size:12px;line-height:1.4;}
.snd{font-weight:600;color:var(--gl);margin-right:3px;}
.snd.me{color:var(--blue);}
.sys{color:var(--dim);font-style:italic;font-size:11px;}
.ci{display:flex;gap:5px;padding:6px;}
.ci input{margin-bottom:0;flex:1;padding:7px 10px;font-size:12px;}
.csend{padding:7px 11px;background:var(--green);border:none;border-radius:5px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;}

/* WINNER */
.wp{width:100%;max-width:440px;padding:14px;display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center;}
.ri{font-size:56px;}
.rt{font-size:28px;font-weight:700;color:#fff;}
.rs{font-size:13px;color:var(--dim);margin-top:2px;}
.pb{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px;border:none;border-radius:7px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s;}
.pb.pg{background:#1e5c2e;}
.pb.pbl{background:#1e3d6e;}
.pb:hover{opacity:.85;}

/* ADMIN */
.ap{width:100%;max-width:440px;padding:12px;display:flex;flex-direction:column;gap:10px;}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:2px;}
.sb2{background:var(--s2);border:1px solid var(--border);border-radius:7px;padding:11px;text-align:center;}
.sn{font-size:22px;font-weight:700;color:#fff;}
.sl{font-size:10px;color:var(--dim);text-transform:uppercase;margin-top:2px;}
.gr{background:var(--s2);border-radius:6px;padding:8px 11px;margin-bottom:5px;font-size:12px;}
.gt{display:flex;justify-content:space-between;margin-bottom:3px;}
.gu{color:var(--dim);}
.badge{display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600;text-transform:uppercase;}
.bd{background:#1e3d1e;color:var(--gl);}
.bp2{background:#1e2d3d;color:var(--blue);}
.bw{background:#2d2d1e;color:#d4c050;}

/* PAY STEP */
.ps{background:var(--s2);border-radius:7px;padding:12px;margin-bottom:9px;}
.pst{font-size:13px;font-weight:600;color:#fff;margin-bottom:8px;display:flex;align-items:center;gap:7px;}
.snum{background:var(--green);color:#fff;width:19px;height:19px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}

@media(max-width:360px){.rc{font-size:38px;letter-spacing:8px;}.tmr{font-size:14px;min-width:52px;}}
`;

// ─── LOBBY ────────────────────────────────────────────────────────────────────
function LobbyScreen({ onCreated, onJoined, settings }) {
  const [tab, setTab] = useState("create");
  const [upi, setUpi] = useState("");
  const [code, setCode] = useState("");
  const [time, setTime] = useState("10");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const fee = settings?.entry_fee || 10;
  const cut = settings?.platform_cut || 2;
  const prize = fee * 2 - cut * 2;

  const create = async () => {
    if (!upi.trim()) return setErr("Enter your UPI ID");
    setLoading(true); setErr("");
    const id = makeCode();
    const mins = parseInt(time) || 10;
    const { error } = await supabase.from("games").insert({
      id, player1_upi: upi.trim(), board: JSON.stringify(initBoard()),
      turn: "w", status: "waiting", timer_mins: mins, p1_time: mins * 60, p2_time: mins * 60,
    });
    setLoading(false);
    if (error) return setErr("Could not create room. Try again.");
    onCreated({ code: id, upi: upi.trim(), role: "w" });
  };

  const join = async () => {
    if (!upi.trim()) return setErr("Enter your UPI ID");
    if (!code.trim()) return setErr("Enter room code");
    setLoading(true); setErr("");
    const { data, error } = await supabase.from("games").select("*").eq("id", code.trim()).single();
    if (error || !data) { setLoading(false); return setErr("Room not found. Check the code."); }
    if (data.status !== "waiting") { setLoading(false); return setErr("Game already started."); }
    if (data.player1_upi === upi.trim()) { setLoading(false); return setErr("You created this room!"); }
    await supabase.from("games").update({ player2_upi: upi.trim(), status: "payment" }).eq("id", code.trim());
    setLoading(false);
    onJoined({ code: code.trim(), upi: upi.trim(), role: "b", game: data });
  };

  return (
    <div className="main">
      <div className="card">
        <div className="ct">Find a Game</div>
        <div className="cs">Enter your UPI ID to play for real money</div>
        <div className="fee-row">
          <div className="fi"><span className="fa">₹{fee}</span><span className="fl">Entry</span></div>
          <span style={{color:"var(--dim)",fontSize:16}}>→</span>
          <div className="fi"><span className="fa">₹{prize}</span><span className="fl">Winner</span></div>
          <span style={{color:"var(--dim)",fontSize:16}}>+</span>
          <div className="fi"><span className="fa">₹{cut*2}</span><span className="fl">Platform</span></div>
        </div>
        <div className="tabs">
          <div className={`tab${tab==="create"?" on":""}`} onClick={()=>setTab("create")}>Create Room</div>
          <div className={`tab${tab==="join"?" on":""}`} onClick={()=>setTab("join")}>Join Room</div>
        </div>
        <input placeholder="Your UPI ID (e.g. 9876543210@ybl)" value={upi} onChange={e=>{setUpi(e.target.value);setErr("");}} />
        {tab==="create" && (
          <select value={time} onChange={e=>setTime(e.target.value)}>
            <option value="3">3 min per player</option>
            <option value="5">5 min per player</option>
            <option value="10">10 min per player</option>
            <option value="15">15 min per player</option>
          </select>
        )}
        {tab==="join" && <input placeholder="4-digit Room Code" value={code} maxLength={4} onChange={e=>{setCode(e.target.value);setErr("");}} />}
        {err && <div className="err">{err}</div>}
        <button className="btn" disabled={loading} onClick={tab==="create"?create:join}>
          {loading ? "Please wait..." : tab==="create" ? "Create Room" : "Join Room"}
        </button>
      </div>
    </div>
  );
}

// ─── WAITING ─────────────────────────────────────────────────────────────────
function WaitingScreen({ code, upi, onReady }) {
  useGameSync(code, d => { if (["payment","playing"].includes(d.status)) onReady(d); });
  return (
    <div className="main">
      <div className="card">
        <div className="ct">Room Created ✓</div>
        <div className="cs">Share this code with your opponent</div>
        <div className="rc-box"><div className="rc">{code}</div><div className="rh">4-digit room code</div></div>
        <div style={{background:"var(--s2)",borderRadius:6,padding:"10px 12px",fontSize:13}}>
          <div style={{color:"var(--dim)",marginBottom:3}}>Your UPI</div>
          <div style={{color:"#fff",fontWeight:500}}>{upi}</div>
          <div style={{color:"var(--dim)",fontSize:11,marginTop:3}}>You play as White ♔</div>
        </div>
        <div className="sr"><div className="dot" /><span>Waiting for opponent to join...</span></div>
      </div>
    </div>
  );
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────
function PaymentScreen({ game, myRole, myUpi, onPaid, settings }) {
  const [paid, setPaid] = useState(false);
  const fee = settings?.entry_fee || 10;
  const ownerUpi = settings?.owner_upi || OWNER_UPI;
  const myField = myRole === "w" ? "p1_paid" : "p2_paid";
  const href = upiLink(ownerUpi, "ChessBet", fee, `Chess entry Room ${game.id}`);

  const confirm = async () => { setPaid(true); await supabase.from("games").update({ [myField]: true }).eq("id", game.id); };

  useGameSync(game.id, d => { if (d.p1_paid && d.p2_paid) onPaid(d); });

  return (
    <div className="main">
      <div className="card">
        <div className="ct">Pay to Play</div>
        <div className="cs">Room {game.id} · Pay ₹{fee} entry fee to start the game</div>
        <div className="ps">
          <div className="pst"><div className="snum">1</div>Pay ₹{fee} via GPay / UPI</div>
          <div className="ir"><span className="il">Pay To</span><span className="iv">{ownerUpi}</span></div>
          <div className="ir"><span className="il">Amount</span><span className="iv">₹{fee}</span></div>
          <div className="ir"><span className="il">Your UPI</span><span className="iv">{myUpi}</span></div>
        </div>
        {!paid ? (
          <>
            <a className="pb pbl" href={href} style={{marginBottom:9,borderRadius:6}}>
              <span>📱</span> Open GPay — Pay ₹{fee}
            </a>
            <div style={{textAlign:"center",fontSize:12,color:"var(--dim)",marginBottom:9}}>Paid? Tap confirm below ↓</div>
            <button className="btn" onClick={confirm}>✅ I Have Paid — Ready!</button>
          </>
        ) : (
          <div style={{textAlign:"center",padding:"10px 0"}}>
            <div style={{fontSize:30,marginBottom:5}}>✅</div>
            <div style={{fontWeight:600,color:"#fff",marginBottom:4}}>Payment confirmed!</div>
            <div className="sr"><div className="dot" /><span>Waiting for opponent to pay...</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GAME ─────────────────────────────────────────────────────────────────────
function GameScreen({ game, myRole, onGameOver, settings }) {
  const [board, setBoard] = useState(() => JSON.parse(game.board));
  const [turn, setTurn] = useState(game.turn || "w");
  const [sel, setSel] = useState(null);
  const [legal, setLegal] = useState([]);
  const [lm, setLm] = useState(null);
  const [inCheck, setCheck] = useState(false);
  const [ended, setEnded] = useState(false);
  const [p1Time, setP1Time] = useState(game.p1_time || (game.timer_mins||10)*60);
  const [p2Time, setP2Time] = useState(game.p2_time || (game.timer_mins||10)*60);
  const [drawOffer, setDrawOffer] = useState(null);
  const [chat, setChat] = useState([{ sys: true, text: "Game started! Good luck 🎯" }]);
  const [chatInput, setChatInput] = useState("");
  const [rematchReq, setRematchReq] = useState(null);
  const chatRef = useRef(null);
  const myTurn = turn === myRole;
  const oppRole = myRole === "w" ? "b" : "w";
  const p1upi = game.player1_upi;
  const p2upi = game.player2_upi;
  const myUpi = myRole === "w" ? p1upi : p2upi;
  const oppUpi = myRole === "w" ? p2upi : p1upi;
  const myTime = myRole === "w" ? p1Time : p2Time;
  const oppTime = myRole === "w" ? p2Time : p1Time;

  // Sync opponent moves — fast 500ms polling
  useGameSync(game.id, d => {
    if (!d.board) return;
    const nb = JSON.parse(d.board);
    setBoard(nb);
    if (d.turn) { setTurn(d.turn); setCheck(isInCheck(nb, d.turn)); }
    if (d.last_move) setLm(JSON.parse(d.last_move));
    if (d.p1_time !== undefined) setP1Time(d.p1_time);
    if (d.p2_time !== undefined) setP2Time(d.p2_time);
    if (d.draw_offer !== undefined) setDrawOffer(d.draw_offer || null);
    if (d.chat_log) { try { setChat(JSON.parse(d.chat_log)); } catch(e){} }
    if (d.rematch_req) setRematchReq(d.rematch_req);
    if (d.status === "done" && !ended) { setEnded(true); onGameOver(d); }
  }, !ended);

  // Timer
  useEffect(() => {
    if (ended) return;
    const iv = setInterval(() => {
      if (turn === "w") setP1Time(t => { if (t <= 1) { supabase.from("games").update({ status:"done", winner:"b", end_reason:"timeout" }).eq("id", game.id); return 0; } return t - 1; });
      else setP2Time(t => { if (t <= 1) { supabase.from("games").update({ status:"done", winner:"w", end_reason:"timeout" }).eq("id", game.id); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [turn, ended, game.id]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chat]);

  const doMove = async (from, to) => {
    const nb = applyMove(board, from, to);
    const newLm = { piece: board[from[0]][from[1]], from, to };
    const nextTurn = turn === "w" ? "b" : "w";
    const check = isInCheck(nb, nextTurn);
    let status = "playing", winner = null, reason = null;
    if (!hasAny(nb, nextTurn, newLm)) { status = "done"; winner = check ? turn : "draw"; reason = check ? "checkmate" : "stalemate"; }
    setBoard(nb); setTurn(nextTurn); setCheck(check); setSel(null); setLegal([]); setLm(newLm);
    const tf = turn === "w" ? "p1_time" : "p2_time";
    const tv = turn === "w" ? p1Time : p2Time;
    await supabase.from("games").update({ board: JSON.stringify(nb), turn: nextTurn, last_move: JSON.stringify(newLm), [tf]: tv, status, winner, end_reason: reason }).eq("id", game.id);
    if (status === "done") { setEnded(true); onGameOver({ ...game, winner, status: "done", end_reason: reason, board: JSON.stringify(nb) }); }
  };

  const handleSq = useCallback((r, c) => {
    if (!myTurn || ended) return;
    const piece = board[r][c];
    if (sel) {
      const isL = legal.some(([lr,lc]) => lr===r && lc===c);
      if (isL) { doMove(sel, [r, c]); return; }
      if (pc(piece) === turn) { setSel([r,c]); setLegal(getLegal(board,r,c,turn,lm)); return; }
      setSel(null); setLegal([]); return;
    }
    if (pc(piece) === turn) { setSel([r,c]); setLegal(getLegal(board,r,c,turn,lm)); }
  }, [board, turn, myTurn, sel, legal, lm, ended]);

  const offerDraw = async () => await supabase.from("games").update({ draw_offer: myRole }).eq("id", game.id);
  const acceptDraw = async () => await supabase.from("games").update({ status:"done", winner:"draw", end_reason:"agreement" }).eq("id", game.id);
  const declineDraw = async () => await supabase.from("games").update({ draw_offer: null }).eq("id", game.id);
  const resign = async () => { if (!window.confirm("Resign this game?")) return; await supabase.from("games").update({ status:"done", winner:oppRole, end_reason:"resign" }).eq("id", game.id); };
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const nc = [...chat, { sender: myRole, text: chatInput.trim() }];
    setChat(nc); setChatInput("");
    await supabase.from("games").update({ chat_log: JSON.stringify(nc) }).eq("id", game.id);
  };
  const requestRematch = async () => await supabase.from("games").update({ rematch_req: myRole }).eq("id", game.id);

  const kingPos = inCheck ? findKing(board, turn) : null;
  const captured = getCaptured(board);
  const rows = myRole === "b" ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const cols = myRole === "b" ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const files = "abcdefgh";

  return (
    <div className="gp">
      {/* Opponent panel */}
      <div className="pp">
        <div className="ppl">
          <div className={`av${turn===oppRole&&!ended?" act":""}`}>
            {oppRole==="w"?"♙":"♟"}
          </div>
          <div>
            <div className="pn">{oppUpi}</div>
            <div className="cap">
              {(oppRole==="w"?captured.w:captured.b).map((p,i)=>(
                <span key={i} style={{display:"inline-block",width:12,height:12}}>
                  <PieceSVG code={p} />
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className={`tmr${turn===oppRole&&!ended?" at":""}${oppTime<30?" low":""}`}>{fmtTime(oppTime)}</div>
      </div>

      {/* Draw offer */}
      {drawOffer && drawOffer !== myRole && !ended && (
        <div className="ob">
          <span className="ot">Opponent offers a draw</span>
          <div className="oa">
            <button className="btn bsm" onClick={acceptDraw}>Accept</button>
            <button className="btn br bsm" onClick={declineDraw}>Decline</button>
          </div>
        </div>
      )}
      {drawOffer === myRole && !ended && <div className="ob"><span className="ot">Draw offer sent — waiting...</span></div>}

      {/* Board */}
      <div className="board-outer">
        <div style={{display:"flex"}}>
          {/* Rank labels */}
          <div style={{display:"flex",flexDirection:"column",width:16,justifyContent:"space-around"}}>
            {rows.map(r => <div key={r} className="coord">{8-r}</div>)}
          </div>
          {/* Squares */}
          <div style={{flex:1,display:"grid",gridTemplateColumns:"repeat(8,1fr)",border:"2px solid #555",borderRadius:3,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.6)"}}>
            {rows.map(r => cols.map(c => {
              const piece = board[r][c];
              const isLight = (r+c)%2===0;
              const isSel = sel && sel[0]===r && sel[1]===c;
              const isL = legal.some(([lr,lc])=>lr===r&&lc===c);
              const isLF = lm && lm.from[0]===r && lm.from[1]===c;
              const isLT = lm && lm.to[0]===r && lm.to[1]===c;
              const isCk = kingPos && kingPos[0]===r && kingPos[1]===c;
              let cls = `sq ${isLight?"lt":"dk"}`;
              if (isSel) cls += " sel";
              else if (isLF) cls += " lf";
              else if (isLT) cls += " lt2";
              if (isL && piece) cls += " lc";
              else if (isL) cls += " lm";
              if (isCk) cls += " ck";
              return (
                <div key={`${r}${c}`} className={cls} onClick={()=>handleSq(r,c)}>
                  <div className="sq-inner">
                    {piece && <PieceSVG code={piece} />}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
        {/* File labels */}
        <div style={{display:"flex",marginLeft:16,height:16}}>
          {cols.map(c => <div key={c} className="coord" style={{flex:1}}>{files[c]}</div>)}
        </div>
      </div>

      {/* Status */}
      <div className={`sb${ended?"":myTurn&&!inCheck?" mt":inCheck?" ck2":""}`}>
        {ended ? "Game Over" : myTurn ? `Your turn${inCheck?" — CHECK ⚠️":""}` : inCheck ? "Opponent in Check ⚠️" : "Opponent's turn..."}
      </div>

      {/* My panel */}
      <div className="pp">
        <div className="ppl">
          <div className={`av${myTurn&&!ended?" act":""}`}>
            {myRole==="w"?"♙":"♟"}
          </div>
          <div>
            <div className="pn">{myUpi} <span style={{fontSize:10,color:"var(--dim)"}}>(You)</span></div>
            <div className="cap">
              {(myRole==="w"?captured.w:captured.b).map((p,i)=>(
                <span key={i} style={{display:"inline-block",width:12,height:12}}>
                  <PieceSVG code={p} />
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className={`tmr${myTurn&&!ended?" at":""}${myTime<30?" low":""}`}>{fmtTime(myTime)}</div>
      </div>

      {/* Actions */}
      {!ended && (
        <div className="ga">
          <button className="btn bg bsm" onClick={offerDraw} disabled={!!drawOffer}>Draw</button>
          <button className="btn br bsm" onClick={resign}>Resign</button>
        </div>
      )}
      {ended && !rematchReq && <button className="btn" onClick={requestRematch}>Request Rematch</button>}
      {ended && rematchReq && rematchReq !== myRole && (
        <div style={{textAlign:"center",fontSize:13,color:"var(--gl)",padding:"4px"}}>Opponent wants a rematch!</div>
      )}

      {/* Chat */}
      <div className="chat">
        <div className="ch">Chat</div>
        <div className="cm" ref={chatRef}>
          {chat.map((m,i) => m.sys
            ? <div key={i} className="msg sys">{m.text}</div>
            : <div key={i} className="msg">
                <span className={`snd${m.sender===myRole?" me":""}`}>{m.sender===myRole?"You":oppUpi.split("@")[0]}:</span>
                {m.text}
              </div>
          )}
        </div>
        <div className="ci">
          <input placeholder="Message..." value={chatInput} onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendChat()} />
          <button className="csend" onClick={sendChat}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── WINNER ───────────────────────────────────────────────────────────────────
function WinnerScreen({ game, myRole, onPlayAgain, settings }) {
  const winner = game.winner;
  const reason = game.end_reason;
  const isDraw = winner === "draw";
  const iWon = winner === myRole;
  const fee = settings?.entry_fee || 10;
  const cut = settings?.platform_cut || 2;
  const prize = fee * 2 - cut * 2;
  const ownerUpi = settings?.owner_upi || OWNER_UPI;
  const winnerUpi = winner==="w" ? game.player1_upi : winner==="b" ? game.player2_upi : null;
  const winLink = winnerUpi ? upiLink(winnerUpi,"Chess Winner",prize,`Chess winnings Room ${game.id}`) : null;
  const feeLink = upiLink(ownerUpi,"ChessBet Fee",cut*2,`Platform fee Room ${game.id}`);
  const rmap = { checkmate:"by Checkmate", stalemate:"Stalemate", timeout:"on Time", resign:"by Resignation", agreement:"Draw agreed" };

  return (
    <div className="wp">
      <div className="ri">{isDraw?"🤝":iWon?"🏆":"😔"}</div>
      <div className="rt">{isDraw?"Draw":iWon?"You Won!":"You Lost"}</div>
      <div className="rs">{rmap[reason]||""}</div>
      <div className="card" style={{width:"100%",textAlign:"left"}}>
        <div style={{fontWeight:600,color:"#fff",marginBottom:10,fontSize:14}}>Payment Summary</div>
        <div className="ir"><span className="il">{game.player1_upi}</span><span className="iv">paid ₹{fee}</span></div>
        <div className="ir"><span className="il">{game.player2_upi}</span><span className="iv">paid ₹{fee}</span></div>
        <div className="ir"><span className="il">Platform fee</span><span className="iv">₹{cut*2}</span></div>
        {!isDraw&&<div className="ir tot"><span className="il">{winnerUpi} wins</span><span className="iv">₹{prize}</span></div>}
        {isDraw&&<div className="ir tot"><span className="il">Each player refund</span><span className="iv">₹{fee-cut}</span></div>}
      </div>
      {winLink && <a className="pb pg" href={winLink}><span>📱</span> Pay ₹{prize} to Winner</a>}
      <a className="pb pbl" href={feeLink}><span>💼</span> Pay ₹{cut*2} Platform Fee</a>
      <div style={{fontSize:11,color:"var(--dim)",textAlign:"center",lineHeight:1.8}}>
        Show winner this screen · Platform fee → {ownerUpi}
      </div>
      <button className="btn bg" onClick={onPlayAgain}>New Game</button>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({ onBack }) {
  const [pin, setPin] = useState("");
  const [auth, setAuth] = useState(false);
  const [settings, setSettings] = useState({ entry_fee:10, platform_cut:2, owner_upi:"" });
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const login = () => { if (pin===ADMIN_PIN) { setAuth(true); load(); } else setErr("Wrong PIN"); };
  const load = async () => {
    setLoading(true);
    const { data:s } = await supabase.from("settings").select("*").eq("id","main").single();
    if (s) setSettings(s);
    const { data:g } = await supabase.from("games").select("*").order("created_at",{ascending:false}).limit(20);
    if (g) setGames(g);
    setLoading(false);
  };
  const save = async () => {
    await supabase.from("settings").upsert({ id:"main", ...settings });
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  };
  const done = games.filter(g=>g.status==="done").length;
  const totalFees = done * (settings.platform_cut||2) * 2;

  if (!auth) return (
    <div className="main">
      <div className="card">
        <div className="ct">Admin Panel</div>
        <div className="cs">Enter your PIN to continue</div>
        <input type="password" placeholder="Admin PIN" value={pin} onChange={e=>{setPin(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&login()} />
        {err && <div className="err">{err}</div>}
        <button className="btn" onClick={login}>Login</button>
        <button className="btn bg" onClick={onBack}>Back</button>
      </div>
    </div>
  );

  return (
    <div className="ap">
      <div className="card">
        <div className="ct" style={{marginBottom:10}}>Dashboard</div>
        <div className="sg">
          <div className="sb2"><div className="sn">{games.length}</div><div className="sl">Total Games</div></div>
          <div className="sb2"><div className="sn">{done}</div><div className="sl">Completed</div></div>
          <div className="sb2"><div className="sn">₹{totalFees}</div><div className="sl">Fees Earned</div></div>
          <div className="sb2"><div className="sn">₹{settings.entry_fee||10}</div><div className="sl">Entry Fee</div></div>
        </div>
      </div>
      <div className="card">
        <div className="ct" style={{marginBottom:11}}>Settings</div>
        <div style={{fontSize:12,color:"var(--dim)",marginBottom:4}}>Your UPI ID (fees go here)</div>
        <input placeholder="yourname@upi" value={settings.owner_upi||""} onChange={e=>setSettings({...settings,owner_upi:e.target.value})} />
        <div style={{fontSize:12,color:"var(--dim)",marginBottom:4}}>Entry Fee per Player (₹)</div>
        <input type="number" value={settings.entry_fee||10} onChange={e=>setSettings({...settings,entry_fee:parseInt(e.target.value)||10})} />
        <div style={{fontSize:12,color:"var(--dim)",marginBottom:4}}>Your Cut per Player (₹)</div>
        <input type="number" value={settings.platform_cut||2} onChange={e=>setSettings({...settings,platform_cut:parseInt(e.target.value)||2})} />
        <div style={{fontSize:12,color:"var(--gl)",marginBottom:10}}>
          Prize pool: ₹{((settings.entry_fee||10)*2)-((settings.platform_cut||2)*2)} · Your earnings/game: ₹{(settings.platform_cut||2)*2}
        </div>
        <button className="btn" onClick={save}>{saved?"✅ Saved!":"Save Settings"}</button>
      </div>
      <div className="card">
        <div className="ct" style={{marginBottom:9}}>Recent Games</div>
        {loading && <div style={{color:"var(--dim)",fontSize:13}}>Loading...</div>}
        {games.map(g => (
          <div className="gr" key={g.id}>
            <div className="gt">
              <span style={{fontWeight:600,color:"#fff"}}>Room #{g.id}</span>
              <span className={`badge ${g.status==="done"?"bd":g.status==="playing"?"bp2":"bw"}`}>{g.status}</span>
            </div>
            <div className="gu">{g.player1_upi} vs {g.player2_upi||"waiting..."}</div>
            {g.winner && <div style={{fontSize:11,color:"var(--gl)",marginTop:2}}>
              Winner: {g.winner==="draw"?"Draw":g.winner==="w"?g.player1_upi:g.player2_upi}
            </div>}
          </div>
        ))}
        {!loading && games.length===0 && <div style={{color:"var(--dim)",fontSize:13}}>No games yet</div>}
      </div>
      <button className="btn bg" onClick={onBack}>← Back</button>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("lobby");
  const [session, setSession] = useState(null);
  const [settings, setSettings] = useState({ entry_fee:10, platform_cut:2, owner_upi:OWNER_UPI });

  useEffect(() => {
    supabase.from("settings").select("*").eq("id","main").single().then(({data})=>{ if(data) setSettings(data); });
  }, []);

  return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="hdr">
          <div className="logo"><span className="logo-icon">♟</span>ChessBet</div>
          <button className="abtn" onClick={()=>setScreen(s=>s==="admin"?"lobby":"admin")}>
            {screen==="admin"?"✕ Close":"⚙ Admin"}
          </button>
        </div>

        {screen==="admin" && <AdminScreen onBack={()=>setScreen("lobby")} />}

        {screen==="lobby" &&
          <LobbyScreen settings={settings}
            onCreated={({code,upi,role})=>{ setSession({code,upi,role,game:null}); setScreen("waiting"); }}
            onJoined={({code,upi,role,game})=>{ setSession({code,upi,role,game}); setScreen("payment"); }}
          />}

        {screen==="waiting" && session &&
          <WaitingScreen code={session.code} upi={session.upi}
            onReady={g=>{ setSession(s=>({...s,game:g})); setScreen("payment"); }}
          />}

        {screen==="payment" && session?.game &&
          <PaymentScreen game={session.game} myRole={session.role} myUpi={session.upi} settings={settings}
            onPaid={async g=>{
              await supabase.from("games").update({status:"playing"}).eq("id",g.id);
              setSession(s=>({...s,game:{...g,status:"playing"}}));
              setScreen("game");
            }}
          />}

        {screen==="game" && session?.game &&
          <GameScreen game={session.game} myRole={session.role} settings={settings}
            onGameOver={g=>{ setSession(s=>({...s,game:g})); setScreen("winner"); }}
          />}

        {screen==="winner" && session?.game &&
          <WinnerScreen game={session.game} myRole={session.role} settings={settings}
            onPlayAgain={()=>{ setSession(null); setScreen("lobby"); }}
          />}
      </div>
    </>
  );
}
