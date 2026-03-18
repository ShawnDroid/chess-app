import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG ───────────────────────────────────────────────
const CF_APP_ID    = import.meta.env.VITE_CF_APP_ID;
const CF_SECRET    = import.meta.env.VITE_CF_SECRET;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const CF_ENV        = "TEST"; // Change to "PROD" when going live
const OWNER_UPI     = "8754992499@upi";
const OWNER_ACC     = "50100213282980";
const SESSION_KEY   = "chessbet_v3";
const ENTRY_FEE     = 10;
const PLATFORM_CUT  = 2; // per player
const PRIZE         = ENTRY_FEE * 2 - PLATFORM_CUT * 2; // 16

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CASHFREE PAYMENT ─────────────────────────────────────
// Cashfree JS SDK is loaded via script tag in index.html
// We call their hosted checkout which handles all UPI/card/netbanking

async function createCashfreeOrder(orderId, amount, customerPhone, customerName) {
  // In production this MUST be a backend call to protect your secret key
  // For now using Cashfree test sandbox directly
  const res = await fetch(
    CF_ENV === "TEST"
      ? "https://sandbox.cashfree.com/pg/orders"
      : "https://api.cashfree.com/pg/orders",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CF_APP_ID,
        "x-client-secret": CF_SECRET,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify({
        order_id:       orderId,
        order_amount:   amount,
        order_currency: "INR",
        customer_details: {
          customer_id:    orderId,
          customer_phone: customerPhone.replace(/\D/g,"").slice(-10) || "9999999999",
          customer_name:  customerName || "Player",
          customer_email: "player@chessbet.app",
        },
        order_meta: {
          return_url: window.location.href,
          notify_url: "", // Add webhook URL if you have backend
        },
      }),
    }
  );
  const data = await res.json();
  return data; // contains payment_session_id
}

async function triggerCashfreeCheckout(sessionId) {
  return new Promise((resolve, reject) => {
    if (!window.Cashfree) { reject(new Error("Cashfree SDK not loaded")); return; }
    const cashfree = window.Cashfree({ mode: CF_ENV === "TEST" ? "sandbox" : "production" });
    cashfree.checkout({
      paymentSessionId: sessionId,
      redirectTarget:   "_modal",
    }).then(result => {
      if (result.error)   reject(result.error);
      else if (result.paymentDetails) resolve(result.paymentDetails);
      else resolve(result);
    }).catch(reject);
  });
}

async function verifyPayment(orderId) {
  const res = await fetch(
    (CF_ENV === "TEST"
      ? "https://sandbox.cashfree.com/pg/orders/"
      : "https://api.cashfree.com/pg/orders/") + orderId,
    {
      headers: {
        "x-client-id":     CF_APP_ID,
        "x-client-secret": CF_SECRET,
        "x-api-version":   "2023-08-01",
      },
    }
  );
  const data = await res.json();
  return data.order_status === "PAID";
}

async function sendPayout(transferId, upiId, amount, remarks) {
  // Cashfree Payouts API
  const res = await fetch(
    CF_ENV === "TEST"
      ? "https://payout-gamma.cashfree.com/payout/v1/requestTransfer"
      : "https://payout-api.cashfree.com/payout/v1/requestTransfer",
    {
      method: "POST",
      headers: {
        "Content-Type":    "application/json",
        "x-client-id":     CF_APP_ID,
        "x-client-secret": CF_SECRET,
      },
      body: JSON.stringify({
        batchTransferId: transferId,
        transfers: [{
          transferId:   transferId,
          amount:       amount.toString(),
          remarks:      remarks,
          bankAccount:  "",
          ifsc:         "",
          vpa:          upiId,
          name:         "ChessBet Winner",
          phone:        "9999999999",
        }],
      }),
    }
  );
  const data = await res.json();
  return data;
}

// ─── SESSION ──────────────────────────────────────────────
const saveSession  = d  => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(d)); } catch(e){} };
const loadSession  = () => { try { const s=localStorage.getItem(SESSION_KEY); return s?JSON.parse(s):null; } catch(e){return null;} };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch(e){} };

// ─── PIECE IMAGES — lichess cburnett (Chess.com style) ────
const BASE = "https://lichess1.org/assets/piece/cburnett/";
const IMGS  = { wK:`${BASE}wK.svg`,wQ:`${BASE}wQ.svg`,wR:`${BASE}wR.svg`,wB:`${BASE}wB.svg`,wN:`${BASE}wN.svg`,wP:`${BASE}wP.svg`,bK:`${BASE}bK.svg`,bQ:`${BASE}bQ.svg`,bR:`${BASE}bR.svg`,bB:`${BASE}bB.svg`,bN:`${BASE}bN.svg`,bP:`${BASE}bP.svg` };
function Piece({ code, size="100%" }) {
  if (!IMGS[code]) return null;
  return <img src={IMGS[code]} alt={code} draggable={false} style={{width:size,height:size,display:"block",pointerEvents:"none",filter:"drop-shadow(0 1px 3px rgba(0,0,0,.5))"}} />;
}

// ─── CHESS ENGINE ─────────────────────────────────────────
function initBoard(){
  const b=Array(8).fill(null).map(()=>Array(8).fill(null));
  ["R","N","B","Q","K","B","N","R"].forEach((p,c)=>{b[0][c]="b"+p;b[7][c]="w"+p;});
  for(let c=0;c<8;c++){b[1][c]="bP";b[6][c]="wP";}
  return b;
}
const col=p=>p?p[0]:null;
const opp=t=>t==="w"?"b":"w";
const inB=(r,c)=>r>=0&&r<8&&c>=0&&c<8;

function pseudoMoves(board,r,c,lm){
  const p=board[r][c];if(!p)return[];
  const t=col(p),tp=p[1],mv=[];
  const push=(tr,tc)=>{if(inB(tr,tc)&&col(board[tr][tc])!==t)mv.push([tr,tc]);};
  const ray=(dr,dc)=>{let tr=r+dr,tc=c+dc;while(inB(tr,tc)){if(col(board[tr][tc])===t)break;mv.push([tr,tc]);if(board[tr][tc])break;tr+=dr;tc+=dc;}};
  switch(tp){
    case"P":{
      const d=t==="w"?-1:1,sr=t==="w"?6:1;
      if(inB(r+d,c)&&!board[r+d][c]){mv.push([r+d,c]);if(r===sr&&!board[r+2*d][c])mv.push([r+2*d,c]);}
      [-1,1].forEach(dc=>{
        if(!inB(r+d,c+dc))return;
        if(col(board[r+d][c+dc])===opp(t))mv.push([r+d,c+dc]);
        if(lm&&lm.piece===opp(t)+"P"&&lm.to[0]===r&&lm.to[1]===c+dc&&Math.abs(lm.from[0]-lm.to[0])===2)mv.push([r+d,c+dc]);
      });break;
    }
    case"N":[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>push(r+dr,c+dc));break;
    case"B":[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc])=>ray(dr,dc));break;
    case"R":[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>ray(dr,dc));break;
    case"Q":[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>ray(dr,dc));break;
    case"K":{
      [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc])=>push(r+dr,c+dc));
      if(t==="w"&&r===7&&c===4){if(!board[7][5]&&!board[7][6]&&board[7][7]==="wR")mv.push([7,6]);if(!board[7][3]&&!board[7][2]&&!board[7][1]&&board[7][0]==="wR")mv.push([7,2]);}
      if(t==="b"&&r===0&&c===4){if(!board[0][5]&&!board[0][6]&&board[0][7]==="bR")mv.push([0,6]);if(!board[0][3]&&!board[0][2]&&!board[0][1]&&board[0][0]==="bR")mv.push([0,2]);}
      break;
    }
    default:break;
  }
  return mv;
}
function execMove(board,from,to){
  const nb=board.map(r=>[...r]);
  const p=nb[from[0]][from[1]];
  nb[to[0]][to[1]]=p;nb[from[0]][from[1]]=null;
  if(p[1]==="K"){if(from[1]===4&&to[1]===6){nb[from[0]][5]=nb[from[0]][7];nb[from[0]][7]=null;}if(from[1]===4&&to[1]===2){nb[from[0]][3]=nb[from[0]][0];nb[from[0]][0]=null;}}
  if(p[1]==="P"&&from[1]!==to[1]&&!board[to[0]][to[1]])nb[from[0]][to[1]]=null;
  if(p==="wP"&&to[0]===0)nb[0][to[1]]="wQ";
  if(p==="bP"&&to[0]===7)nb[7][to[1]]="bQ";
  return nb;
}
function kingSq(board,t){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===t+"K")return[r,c];return null;}
function isAttacked(board,r,c,by){for(let pr=0;pr<8;pr++)for(let pc=0;pc<8;pc++){if(col(board[pr][pc])!==by)continue;if(pseudoMoves(board,pr,pc,null).some(([tr,tc])=>tr===r&&tc===c))return true;}return false;}
function inCheck(board,t){const k=kingSq(board,t);if(!k)return false;return isAttacked(board,k[0],k[1],opp(t));}
function legalMoves(board,r,c,lm){const t=col(board[r][c]);if(!t)return[];return pseudoMoves(board,r,c,lm).filter(([tr,tc])=>!inCheck(execMove(board,[r,c],[tr,tc]),t));}
function hasLegal(board,t,lm){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(col(board[r][c])===t&&legalMoves(board,r,c,lm).length>0)return true;return false;}
function gameResult(board,next,lm){
  if(!hasLegal(board,next,lm)){
    if(inCheck(board,next))return{over:true,winner:opp(next),reason:"checkmate"};
    return{over:true,winner:"draw",reason:"stalemate"};
  }
  return{over:false};
}
function getCaptured(board){
  const start={wP:8,wN:2,wB:2,wR:2,wQ:1,bP:8,bN:2,bB:2,bR:2,bQ:1};
  const live={};
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c])live[board[r][c]]=(live[board[r][c]]||0)+1;
  const cap={w:[],b:[]};
  Object.entries(start).forEach(([k,v])=>{const m=v-(live[k]||0);for(let i=0;i<m;i++)cap[k[0]].push(k);});
  return cap;
}
const mkCode=()=>Math.floor(1000+Math.random()*9000).toString();
const fmt=s=>`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

// ─── FAST SYNC ────────────────────────────────────────────
function useSync(gameId,cb,enabled=true){
  const snap=useRef(null);
  useEffect(()=>{
    if(!gameId||!enabled)return;
    const ch=supabase.channel("s"+gameId)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"games",filter:`id=eq.${gameId}`},
        p=>{snap.current=p.new;cb(p.new);})
      .subscribe();
    const iv=setInterval(async()=>{
      const{data}=await supabase.from("games").select("*").eq("id",gameId).single();
      if(!data)return;
      const prev=snap.current;
      const changed=!prev||prev.board!==data.board||prev.turn!==data.turn||prev.status!==data.status||prev.p1_paid!==data.p1_paid||prev.p2_paid!==data.p2_paid||prev.draw_offer!==data.draw_offer||prev.chat_log!==data.chat_log||prev.winner!==data.winner;
      if(changed){snap.current=data;cb(data);}
    },500);
    return()=>{supabase.removeChannel(ch);clearInterval(iv);};
  },[gameId,enabled]);
}

// ─── STYLES ───────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#161512;font-family:'Noto Sans',sans-serif;color:#e0d9cc;-webkit-font-smoothing:antialiased;min-height:100vh;}
button,input,select{font-family:inherit;}
:root{
  --bg:#161512;--nav:#21201d;--card:#2c2b27;--card2:#363533;
  --border:#403e3a;--border2:#524f49;
  --sq-l:#f0d9b5;--sq-d:#b58863;
  --sel:rgba(20,85,30,.55);--last:rgba(155,135,0,.41);
  --chk:rgba(220,40,40,.85);
  --green:#81b64c;--gd:#5b8a32;--gl:#a0d060;
  --text:#dbd7cf;--dim:#8a8070;--dim2:#504c45;
  --gold:#e5a020;--danger:#df5353;--blue:#5b9bd5;
  --shadow:0 8px 32px rgba(0,0,0,.8);
}
.app{min-height:100vh;display:flex;flex-direction:column;align-items:center;background:var(--bg);}
/* NAVBAR */
.nav{width:100%;background:var(--nav);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 16px;height:50px;position:sticky;top:0;z-index:200;}
.nav-logo{display:flex;align-items:center;gap:8px;font-size:19px;font-weight:700;color:#fff;}
.nav-logo span{color:var(--green);}
/* PAGE */
.page{width:100%;max-width:420px;padding:12px 12px 28px;display:flex;flex-direction:column;gap:10px;}
.card{background:var(--card);border-radius:10px;padding:18px 20px;}
.card-t{font-size:17px;font-weight:700;color:#fff;margin-bottom:4px;}
.card-s{font-size:13px;color:var(--dim);margin-bottom:16px;line-height:1.6;}
/* INPUTS */
.field{margin-bottom:10px;}
.field label{display:block;font-size:11px;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;}
input,select{width:100%;background:#1a1916;border:1.5px solid var(--border);border-radius:7px;padding:10px 13px;color:var(--text);font-size:14px;outline:none;transition:border-color .15s;}
input:focus,select:focus{border-color:var(--green);}
input::placeholder{color:var(--dim2);}
/* TABS */
.tabs{display:flex;background:#1a1916;border-radius:8px;padding:3px;margin-bottom:14px;}
.tab{flex:1;padding:8px;text-align:center;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;color:var(--dim);transition:all .15s;}
.tab.on{background:var(--green);color:#fff;}
/* BUTTONS */
.btn{width:100%;padding:11px;background:var(--green);border:none;border-radius:7px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s;margin-top:2px;letter-spacing:.2px;}
.btn:hover{background:var(--gl);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--dim);font-weight:500;margin-top:8px;}
.btn-ghost:hover{border-color:var(--green);color:var(--green);background:transparent;}
.btn-blue{background:#1c3a70;}.btn-blue:hover{background:#264fa0;}
.btn-red{background:#701c1c;}.btn-red:hover{background:#a02626;}
.btn-sm{padding:6px 14px;font-size:12px;width:auto;border-radius:6px;margin-top:0;}
/* FEE BAR */
.fee-bar{display:flex;align-items:center;justify-content:space-between;background:#1a1916;border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:14px;}
.fee-item{text-align:center;}
.fee-num{font-size:22px;font-weight:700;color:#fff;}
.fee-sub{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-top:2px;}
.fee-sep{color:var(--dim);font-size:18px;}
/* CODE */
.code-box{background:#1a1916;border:2px solid var(--border2);border-radius:10px;padding:20px;text-align:center;margin-bottom:12px;}
.code-num{font-size:52px;font-weight:700;color:#fff;letter-spacing:14px;font-variant-numeric:tabular-nums;}
.code-hint{font-size:12px;color:var(--dim);margin-top:7px;}
/* MISC */
.dot-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dim);justify-content:center;padding:8px 0;}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:blink 1.2s ease infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.ir{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;}
.ir:last-child{border-bottom:none;}
.ir .l{color:var(--dim);}
.ir .v{color:#fff;font-weight:600;}
.ir.big .l{color:var(--gl);font-weight:700;font-size:14px;}
.ir.big .v{font-size:20px;font-weight:700;}
.err{color:var(--danger);font-size:12px;margin:-6px 0 8px;}
/* PAYMENT LOADING */
.pay-loading{text-align:center;padding:24px 0;}
.pay-loading .spinner{width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--green);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px;}
@keyframes spin{to{transform:rotate(360deg)}}
.pay-loading p{font-size:14px;color:var(--dim);}
/* PAYMENT SUCCESS */
.pay-success{text-align:center;padding:16px 0;}
.pay-success .icon{font-size:48px;margin-bottom:8px;}
.pay-success p{font-size:14px;color:var(--gl);font-weight:600;}
/* GAME */
.game-page{width:100%;max-width:420px;padding:4px 8px 16px;display:flex;flex-direction:column;gap:5px;}
/* PLAYER STRIP */
.pstrip{display:flex;justify-content:space-between;align-items:center;background:var(--card);border-radius:8px;padding:8px 12px;min-height:54px;}
.ps-l{display:flex;align-items:center;gap:9px;min-width:0;}
.ps-icon{width:36px;height:36px;border-radius:50%;background:#1a1916;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
.ps-icon.act{border-color:var(--green);box-shadow:0 0 0 3px rgba(129,182,76,.2);}
.ps-name{font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:175px;}
.ps-role{font-size:10px;color:var(--dim);margin-top:1px;}
.ps-cap{display:flex;flex-wrap:wrap;gap:1px;margin-top:2px;min-height:14px;}
/* CLOCK */
.clock{font-size:19px;font-weight:700;color:var(--text);background:#1a1916;border:1.5px solid var(--border);border-radius:6px;padding:4px 10px;min-width:64px;text-align:center;font-variant-numeric:tabular-nums;flex-shrink:0;}
.clock.tick{background:#1e3a10;border-color:var(--green);color:#c0f060;}
.clock.low{background:#3a1010;border-color:var(--danger);color:#ff9090;animation:blink .6s ease infinite;}
/* BOARD */
.board-shell{width:100%;border:2px solid #555;border-radius:3px;overflow:hidden;box-shadow:var(--shadow);}
.board-inner{display:flex;}
.rank-col{display:flex;flex-direction:column;width:16px;background:#b58863;}
.rank-col span{flex:1;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:rgba(255,255,255,.5);}
.board-grid{display:grid;grid-template-columns:repeat(8,1fr);flex:1;}
.file-row{display:flex;margin-left:16px;background:#f0d9b5;}
.file-row span{flex:1;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:rgba(0,0,0,.35);}
/* SQUARES */
.sq{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;}
.sq.lt{background:var(--sq-l);}
.sq.dk{background:var(--sq-d);}
.sq.sel{background:var(--sel)!important;}
.sq.lf,.sq.lt2{background:var(--last)!important;}
.sq.chk{background:radial-gradient(ellipse at 50% 50%,rgba(255,0,0,.9) 0%,rgba(200,0,0,.5) 55%,transparent 100%)!important;}
.sq.leg::after{content:'';position:absolute;width:32%;height:32%;border-radius:50%;background:rgba(0,0,0,.2);z-index:2;pointer-events:none;}
.sq.legc::after{content:'';position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 5px rgba(0,0,0,.25);z-index:2;pointer-events:none;}
.sq .pi{position:absolute;inset:3%;display:flex;align-items:center;justify-content:center;z-index:1;pointer-events:none;}
/* STATUS */
.sbar{padding:9px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:600;background:var(--card);border:1px solid var(--border);color:var(--text);}
.sbar.mt{background:#1a2e0e;border-color:var(--green);color:#a8e060;}
.sbar.ck{background:#2e0e0e;border-color:var(--danger);color:#ff9090;}
.sbar.end{background:var(--card2);color:var(--dim);}
/* ACTIONS */
.gbtns{display:flex;gap:6px;}
.gbtns .btn{margin-top:0;}
/* DRAW OFFER */
.offer{background:#232210;border:1px solid #5a5810;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px;}
.offer p{font-size:13px;color:#d4d440;}
.offer div{display:flex;gap:6px;}
/* CHAT */
.chatbox{background:var(--card);border-radius:8px;overflow:hidden;}
.chat-hd{padding:8px 13px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:1px;}
.chat-log{height:88px;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:3px;}
.chat-log::-webkit-scrollbar{width:3px;}
.chat-log::-webkit-scrollbar-thumb{background:var(--border);}
.cline{font-size:12px;line-height:1.5;}
.cline .who{font-weight:700;margin-right:3px;}
.cline .who.me{color:var(--blue);}
.cline .who.op{color:var(--gl);}
.csys{font-size:11px;color:var(--dim);font-style:italic;}
.chat-ft{display:flex;gap:6px;padding:7px;border-top:1px solid var(--border);}
.chat-ft input{margin-bottom:0;flex:1;padding:7px 10px;font-size:12px;border-radius:6px;}
.chat-send{padding:7px 12px;background:var(--green);border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;}
/* WINNER */
.wpage{width:100%;max-width:420px;padding:14px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;}
.wicon{font-size:64px;animation:pop .35s ease;}
@keyframes pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
.wtitle{font-size:30px;font-weight:700;color:#fff;}
.wsub{font-size:14px;color:var(--dim);margin-top:3px;}
.plink{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:13px;border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;}
.plink:hover{opacity:.88;}
.plink.g{background:#1a5228;}
.plink.b{background:#1a2f52;}
/* PAYOUT STATUS */
.payout-status{padding:12px 16px;border-radius:8px;font-size:13px;font-weight:600;text-align:center;}
.payout-status.success{background:#0d2e16;border:1px solid var(--green);color:var(--gl);}
.payout-status.pending{background:#2e2a0d;border:1px solid var(--gold);color:var(--gold);}
.payout-status.failed{background:#2e0d0d;border:1px solid var(--danger);color:var(--danger);}
/* RESTORE */
.restore{display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px;}
.restore .icon{font-size:48px;}
.restore p{color:var(--dim);font-size:14px;}
`;

// ══════════════════════════════════════════════════════════
//  LOBBY
// ══════════════════════════════════════════════════════════
function Lobby({onCreated,onJoined}){
  const [tab,setTab]=useState("create");
  const [upi,setUpi]=useState("");
  const [phone,setPhone]=useState("");
  const [code,setCode]=useState("");
  const [mins,setMins]=useState("10");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");

  const create=async()=>{
    if(!upi.trim())return setErr("Enter your UPI ID");
    if(!phone.trim()||phone.replace(/\D/g,"").length<10)return setErr("Enter valid 10-digit phone number");
    setBusy(true);setErr("");
    const id=mkCode(),t=parseInt(mins)||10;
    const{error}=await supabase.from("games").insert({
      id,player1_upi:upi.trim(),player1_phone:phone.trim(),
      board:JSON.stringify(initBoard()),turn:"w",status:"waiting",
      timer_mins:t,p1_time:t*60,p2_time:t*60,
    });
    setBusy(false);
    if(error)return setErr("Could not create. Try again.");
    onCreated({code:id,upi:upi.trim(),phone:phone.trim(),role:"w"});
  };

  const join=async()=>{
    if(!upi.trim())return setErr("Enter your UPI ID");
    if(!phone.trim()||phone.replace(/\D/g,"").length<10)return setErr("Enter valid 10-digit phone number");
    if(!code.trim())return setErr("Enter room code");
    setBusy(true);setErr("");
    const{data,error}=await supabase.from("games").select("*").eq("id",code.trim()).single();
    if(error||!data){setBusy(false);return setErr("Room not found.");}
    if(data.status!=="waiting"){setBusy(false);return setErr("Game already started.");}
    if(data.player1_upi===upi.trim()){setBusy(false);return setErr("You created this room!");}
    await supabase.from("games").update({player2_upi:upi.trim(),player2_phone:phone.trim(),status:"payment"}).eq("id",code.trim());
    setBusy(false);
    onJoined({code:code.trim(),upi:upi.trim(),phone:phone.trim(),role:"b",game:data});
  };

  return(
    <div className="page">
      <div className="card">
        <div className="card-t">♟ Find a Game</div>
        <div className="card-s">Pay ₹{ENTRY_FEE} to play. Winner gets ₹{PRIZE} instantly.</div>
        <div className="fee-bar">
          <div className="fee-item"><div className="fee-num">₹{ENTRY_FEE}</div><div className="fee-sub">Entry</div></div>
          <span className="fee-sep">→</span>
          <div className="fee-item"><div className="fee-num">₹{PRIZE}</div><div className="fee-sub">Winner</div></div>
          <span className="fee-sep">+</span>
          <div className="fee-item"><div className="fee-num">₹{PLATFORM_CUT*2}</div><div className="fee-sub">Platform</div></div>
        </div>
        <div className="tabs">
          <div className={`tab${tab==="create"?" on":""}`} onClick={()=>setTab("create")}>Create Room</div>
          <div className={`tab${tab==="join"?" on":""}`} onClick={()=>setTab("join")}>Join Room</div>
        </div>
        <div className="field">
          <label>Your UPI / GPay ID</label>
          <input placeholder="e.g. 9876543210@ybl" value={upi} onChange={e=>{setUpi(e.target.value);setErr("");}}/>
        </div>
        <div className="field">
          <label>Phone Number</label>
          <input placeholder="10-digit mobile number" value={phone} maxLength={10} onChange={e=>{setPhone(e.target.value.replace(/\D/g,""));setErr("");}}/>
        </div>
        {tab==="create"&&(
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
        {tab==="join"&&(
          <div className="field">
            <label>Room Code</label>
            <input placeholder="4-digit code" value={code} maxLength={4} onChange={e=>{setCode(e.target.value);setErr("");}}/>
          </div>
        )}
        {err&&<p className="err">{err}</p>}
        <button className="btn" disabled={busy} onClick={tab==="create"?create:join}>
          {busy?"Please wait…":tab==="create"?"Create Room — Pay ₹"+ENTRY_FEE:"Join Room — Pay ₹"+ENTRY_FEE}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  WAITING
// ══════════════════════════════════════════════════════════
function Waiting({code,upi,onReady}){
  useSync(code,d=>{if(["payment","playing"].includes(d.status))onReady(d);});
  return(
    <div className="page">
      <div className="card">
        <div className="card-t">Room Created ✓</div>
        <div className="card-s">Share this code with your opponent</div>
        <div className="code-box">
          <div className="code-num">{code}</div>
          <div className="code-hint">Share this 4-digit code</div>
        </div>
        <div style={{background:"#1a1916",borderRadius:7,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:"var(--dim)",marginBottom:3}}>YOUR UPI</div>
          <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{upi}</div>
          <div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>You play as White ♔</div>
        </div>
        <div style={{background:"#1a2910",border:"1px solid var(--green)",borderRadius:7,padding:"10px 14px",marginTop:8,fontSize:13,color:"var(--gl)",textAlign:"center"}}>
          💰 You will be charged ₹{ENTRY_FEE} when opponent joins
        </div>
        <div className="dot-row"><div className="dot"/><span>Waiting for opponent…</span></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  CASHFREE PAYMENT SCREEN
// ══════════════════════════════════════════════════════════
function PaymentScreen({game,myRole,myUpi,myPhone,onPaid}){
  const [step,setStep]=useState("init"); // init | paying | paid | waiting
  const [err,setErr]=useState("");
  const myField=myRole==="w"?"p1_paid":"p2_paid";
  const orderId=`chess_${game.id}_${myRole}_${Date.now()}`;

  useSync(game.id,d=>{if(d.p1_paid&&d.p2_paid)onPaid(d);});

  const pay=async()=>{
    setStep("paying");setErr("");
    try{
      // 1. Create Cashfree order
      const order=await createCashfreeOrder(orderId,ENTRY_FEE,myPhone,myUpi);
      if(!order.payment_session_id){
        setErr("Could not create payment. Try again.");
        setStep("init");return;
      }
      // 2. Open Cashfree checkout modal
      await triggerCashfreeCheckout(order.payment_session_id);
      // 3. Verify payment
      setStep("verifying");
      await new Promise(r=>setTimeout(r,2000)); // wait 2 sec for webhook
      const paid=await verifyPayment(orderId);
      if(!paid){
        setErr("Payment not confirmed. If money was deducted, contact support.");
        setStep("init");return;
      }
      // 4. Mark paid in DB
      await supabase.from("games").update({[myField]:true,[myRole==="w"?"p1_order":"p2_order"]:orderId}).eq("id",game.id);
      setStep("paid");
    }catch(e){
      setErr(e.message||"Payment failed. Try again.");
      setStep("init");
    }
  };

  return(
    <div className="page">
      <div className="card">
        <div className="card-t">Pay Entry Fee</div>
        <div className="card-s">Room {game.id} · Secure payment via Cashfree</div>

        <div style={{background:"#1a1916",borderRadius:8,padding:"14px",marginBottom:14}}>
          <div className="ir"><span className="l">Amount</span><span className="v">₹{ENTRY_FEE}</span></div>
          <div className="ir"><span className="l">Your UPI</span><span className="v">{myUpi}</span></div>
          <div className="ir"><span className="l">If you win</span><span className="v">₹{PRIZE} auto-credited</span></div>
        </div>

        {step==="init"&&(
          <>
            {err&&<p className="err" style={{marginBottom:10}}>{err}</p>}
            <button className="btn" onClick={pay}>
              💳 Pay ₹{ENTRY_FEE} Securely
            </button>
            <p style={{fontSize:11,color:"var(--dim)",textAlign:"center",marginTop:8}}>
              UPI · Cards · Net Banking · Wallets
            </p>
          </>
        )}

        {(step==="paying"||step==="verifying")&&(
          <div className="pay-loading">
            <div className="spinner"/>
            <p>{step==="verifying"?"Verifying payment…":"Opening payment…"}</p>
          </div>
        )}

        {step==="paid"&&(
          <>
            <div className="pay-success">
              <div className="icon">✅</div>
              <p>₹{ENTRY_FEE} paid successfully!</p>
            </div>
            <div className="dot-row"><div className="dot"/><span>Waiting for opponent to pay…</span></div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  GAME BOARD
// ══════════════════════════════════════════════════════════
function Game({game,myRole,onGameOver}){
  const [board,setBoard]=useState(()=>JSON.parse(game.board));
  const [turn,setTurn]=useState(game.turn||"w");
  const [sel,setSel]=useState(null);
  const [legals,setLegals]=useState([]);
  const [lastMv,setLastMv]=useState(null);
  const [checked,setChecked]=useState(false);
  const [ended,setEnded]=useState(game.status==="done");
  const [p1t,setP1t]=useState(game.p1_time||(game.timer_mins||10)*60);
  const [p2t,setP2t]=useState(game.p2_time||(game.timer_mins||10)*60);
  const [drawOff,setDrawOff]=useState(null);
  const [chat,setChat]=useState([{sys:true,text:"Game started! Good luck 🎯"}]);
  const [chatIn,setChatIn]=useState("");
  const [rematch,setRematch]=useState(null);
  const chatRef=useRef(null);
  const endedRef=useRef(game.status==="done");

  const myTurn=turn===myRole&&!ended;
  const oppRole=opp(myRole);
  const p1upi=game.player1_upi,p2upi=game.player2_upi;
  const myUpi=myRole==="w"?p1upi:p2upi,oppUpi=myRole==="w"?p2upi:p1upi;
  const myTime=myRole==="w"?p1t:p2t,oppTime=myRole==="w"?p2t:p1t;

  useSync(game.id,d=>{
    if(!d.board)return;
    const nb=JSON.parse(d.board);
    setBoard(nb);setTurn(d.turn);setChecked(inCheck(nb,d.turn));
    if(d.last_move){try{setLastMv(JSON.parse(d.last_move));}catch(e){}}
    if(d.p1_time!=null)setP1t(d.p1_time);
    if(d.p2_time!=null)setP2t(d.p2_time);
    setDrawOff(d.draw_offer||null);
    if(d.chat_log){try{setChat(JSON.parse(d.chat_log));}catch(e){}}
    if(d.rematch_req)setRematch(d.rematch_req);
    if(d.status==="done"&&!endedRef.current){endedRef.current=true;setEnded(true);onGameOver(d);}
  },!ended);

  // Timer — STOPS when ended
  useEffect(()=>{
    if(ended)return;
    const iv=setInterval(()=>{
      const setter=turn==="w"?setP1t:setP2t;
      setter(t=>{
        if(t<=1){clearInterval(iv);supabase.from("games").update({status:"done",winner:opp(turn),end_reason:"timeout"}).eq("id",game.id);return 0;}
        return t-1;
      });
    },1000);
    return()=>clearInterval(iv);
  },[turn,ended,game.id]);

  useEffect(()=>{chatRef.current?.scrollIntoView({behavior:"smooth"});},[chat]);

  const doMove=async(from,to)=>{
    const nb=execMove(board,from,to);
    const newLm={piece:board[from[0]][from[1]],from,to};
    const nextT=opp(turn);
    const res=gameResult(nb,nextT,newLm);
    setBoard(nb);setTurn(nextT);setChecked(inCheck(nb,nextT));
    setSel(null);setLegals([]);setLastMv(newLm);
    const tf=turn==="w"?"p1_time":"p2_time";
    const tv=turn==="w"?p1t:p2t;
    await supabase.from("games").update({
      board:JSON.stringify(nb),turn:nextT,last_move:JSON.stringify(newLm),
      [tf]:tv,status:res.over?"done":"playing",
      winner:res.over?res.winner:null,end_reason:res.over?res.reason:null,
    }).eq("id",game.id);
    if(res.over){endedRef.current=true;setEnded(true);onGameOver({...game,winner:res.winner,status:"done",end_reason:res.reason,board:JSON.stringify(nb)});}
  };

  const handleSq=useCallback((r,c)=>{
    if(!myTurn)return;
    const piece=board[r][c];
    if(sel){
      if(legals.some(([lr,lc])=>lr===r&&lc===c)){doMove(sel,[r,c]);return;}
      if(col(piece)===turn){setSel([r,c]);setLegals(legalMoves(board,r,c,lastMv));return;}
      setSel(null);setLegals([]);return;
    }
    if(col(piece)===turn){setSel([r,c]);setLegals(legalMoves(board,r,c,lastMv));}
  },[board,turn,myTurn,sel,legals,lastMv]);

  const offerDraw=async()=>{await supabase.from("games").update({draw_offer:myRole}).eq("id",game.id);setDrawOff(myRole);};
  const acceptDraw=async()=>{await supabase.from("games").update({status:"done",winner:"draw",end_reason:"agreement"}).eq("id",game.id);};
  const declineDraw=async()=>{await supabase.from("games").update({draw_offer:null}).eq("id",game.id);setDrawOff(null);};
  const resign=async()=>{if(!window.confirm("Resign?"))return;await supabase.from("games").update({status:"done",winner:oppRole,end_reason:"resign"}).eq("id",game.id);};
  const sendChat=async()=>{
    if(!chatIn.trim())return;
    const nc=[...chat,{sender:myRole,text:chatIn.trim()}];
    setChat(nc);setChatIn("");
    await supabase.from("games").update({chat_log:JSON.stringify(nc)}).eq("id",game.id);
  };

  const cap=getCaptured(board);
  const rows=myRole==="b"?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
  const cols2=myRole==="b"?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
  const kPos=checked?kingSq(board,turn):null;
  const files=myRole==="b"?"hgfedcba":"abcdefgh";

  const sqCls=(r,c,piece)=>{
    const light=(r+c)%2===0;
    const isSel=sel&&sel[0]===r&&sel[1]===c;
    const isFrom=lastMv&&lastMv.from[0]===r&&lastMv.from[1]===c;
    const isTo=lastMv&&lastMv.to[0]===r&&lastMv.to[1]===c;
    const isLeg=legals.some(([lr,lc])=>lr===r&&lc===c);
    const isChk=kPos&&kPos[0]===r&&kPos[1]===c;
    let cls=`sq ${light?"lt":"dk"}`;
    if(isSel)cls+=" sel";
    else if(isFrom)cls+=" lf";
    else if(isTo)cls+=" lt2";
    if(isLeg&&piece)cls+=" legc";
    else if(isLeg)cls+=" leg";
    if(isChk)cls+=" chk";
    return cls;
  };

  const statusText=()=>{
    if(ended)return"Game Over";
    if(myTurn&&checked)return"⚠️ You are in CHECK!";
    if(myTurn)return"Your turn";
    if(checked)return"Opponent is in check";
    return"Opponent's turn…";
  };
  const sCls=ended?"sbar end":myTurn&&checked?"sbar ck":myTurn?"sbar mt":"sbar";

  const PStrip=({role,upiStr,isOpp})=>{
    const active=turn===role&&!ended;
    const time=role==="w"?p1t:p2t;
    const pieces=role==="w"?cap.w:cap.b;
    return(
      <div className="pstrip">
        <div className="ps-l">
          <div className={`ps-icon${active?" act":""}`}>
            <Piece code={role==="w"?"wP":"bP"} size="22px"/>
          </div>
          <div>
            <div className="ps-name">{upiStr}{!isOpp&&<span style={{fontSize:10,color:"var(--dim)",marginLeft:4}}>(You)</span>}</div>
            <div className="ps-role">{role==="w"?"White":"Black"}</div>
            <div className="ps-cap">{pieces.map((p,i)=><span key={i} style={{display:"inline-block",width:13,height:13}}><Piece code={p} size="13px"/></span>)}</div>
          </div>
        </div>
        <div className={`clock${active?" tick":""}${time<30?" low":""}`}>{fmt(time)}</div>
      </div>
    );
  };

  return(
    <div className="game-page">
      <PStrip role={oppRole} upiStr={oppUpi} isOpp={true}/>

      {drawOff&&drawOff!==myRole&&!ended&&(
        <div className="offer"><p>Opponent offers a draw</p><div>
          <button className="btn btn-sm" onClick={acceptDraw}>Accept</button>
          <button className="btn btn-sm btn-red" onClick={declineDraw}>Decline</button>
        </div></div>
      )}
      {drawOff===myRole&&!ended&&<div className="offer"><p>Draw offer sent…</p></div>}

      <div className="board-shell">
        <div className="board-inner">
          <div className="rank-col">{rows.map(r=><span key={r}>{8-r}</span>)}</div>
          <div className="board-grid">
            {rows.map(r=>cols2.map(c=>{
              const piece=board[r][c];
              return(
                <div key={`${r}${c}`} className={sqCls(r,c,piece)} onClick={()=>handleSq(r,c)}>
                  {piece&&<div className="pi"><Piece code={piece}/></div>}
                </div>
              );
            }))}
          </div>
        </div>
        <div className="file-row">{files.split("").map(f=><span key={f}>{f}</span>)}</div>
      </div>

      <div className={sCls}>{statusText()}</div>
      <PStrip role={myRole} upiStr={myUpi} isOpp={false}/>

      {!ended&&(
        <div className="gbtns">
          <button className="btn btn-ghost btn-sm" onClick={offerDraw} disabled={!!drawOff}>Offer Draw</button>
          <button className="btn btn-red btn-sm" onClick={resign}>Resign</button>
        </div>
      )}
      {ended&&!rematch&&<button className="btn" onClick={async()=>await supabase.from("games").update({rematch_req:myRole}).eq("id",game.id)}>Request Rematch</button>}
      {ended&&rematch&&rematch!==myRole&&<p style={{textAlign:"center",fontSize:13,color:"var(--gl)"}}>Opponent wants a rematch!</p>}

      <div className="chatbox">
        <div className="chat-hd">Chat</div>
        <div className="chat-log">
          {chat.map((m,i)=>m.sys
            ?<div key={i} className="csys">{m.text}</div>
            :<div key={i} className="cline">
              <span className={`who ${m.sender===myRole?"me":"op"}`}>{m.sender===myRole?"You":oppUpi.split("@")[0]}:</span>
              {m.text}
            </div>
          )}
          <div ref={chatRef}/>
        </div>
        <div className="chat-ft">
          <input placeholder="Message…" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
          <button className="chat-send" onClick={sendChat}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  WINNER — with auto payout
// ══════════════════════════════════════════════════════════
function Winner({game,myRole,onPlayAgain}){
  const [payoutStatus,setPayoutStatus]=useState("pending"); // pending|success|failed
  const [payoutMsg,setPayoutMsg]=useState("");
  const w=game.winner,reason=game.end_reason;
  const isDraw=w==="draw",iWon=w===myRole;
  const winnerUpi=w==="w"?game.player1_upi:w==="b"?game.player2_upi:null;
  const labels={checkmate:"by Checkmate",stalemate:"Stalemate",timeout:"on Time",resign:"by Resignation",agreement:"Draw agreed"};

  // Auto payout — triggered only by winner's device
  useEffect(()=>{
    if(isDraw||!iWon||!winnerUpi)return;
    const doPayout=async()=>{
      try{
        const transferId=`payout_${game.id}_${Date.now()}`;
        const result=await sendPayout(transferId,winnerUpi,PRIZE,`ChessBet winnings Room ${game.id}`);
        if(result.status==="SUCCESS"||result.subCode==="200"){
          setPayoutStatus("success");
          setPayoutMsg(`₹${PRIZE} sent to ${winnerUpi}`);
          await supabase.from("games").update({payout_status:"sent",payout_transfer_id:transferId}).eq("id",game.id);
        } else {
          setPayoutStatus("failed");
          setPayoutMsg("Auto payout failed. Admin will transfer manually.");
          await supabase.from("games").update({payout_status:"failed"}).eq("id",game.id);
        }
      }catch(e){
        setPayoutStatus("failed");
        setPayoutMsg("Payout error. Admin will transfer manually.");
      }
    };
    // Check if already paid out
    if(game.payout_status==="sent"){setPayoutStatus("success");setPayoutMsg(`₹${PRIZE} already sent to ${winnerUpi}`);return;}
    doPayout();
  },[]);

  return(
    <div className="wpage">
      <div className="wicon">{isDraw?"🤝":iWon?"🏆":"😔"}</div>
      <div className="wtitle">{isDraw?"Draw":iWon?"You Won!":"You Lost"}</div>
      <div className="wsub">{labels[reason]||""}</div>

      {/* Payout status */}
      {iWon&&!isDraw&&(
        <div className={`payout-status ${payoutStatus}`}>
          {payoutStatus==="pending"&&"⏳ Sending ₹"+PRIZE+" to your UPI…"}
          {payoutStatus==="success"&&"✅ "+payoutMsg}
          {payoutStatus==="failed"&&"❌ "+payoutMsg}
        </div>
      )}
      {!iWon&&!isDraw&&(
        <div className="payout-status pending">
          ₹{PRIZE} is being sent to {winnerUpi}
        </div>
      )}

      <div className="card" style={{width:"100%",textAlign:"left"}}>
        <div style={{fontWeight:700,color:"#fff",marginBottom:12,fontSize:14}}>Summary</div>
        <div className="ir"><span className="l">{game.player1_upi} paid</span><span className="v">₹{ENTRY_FEE}</span></div>
        <div className="ir"><span className="l">{game.player2_upi} paid</span><span className="v">₹{ENTRY_FEE}</span></div>
        <div className="ir"><span className="l">Platform fee</span><span className="v">₹{PLATFORM_CUT*2}</span></div>
        {!isDraw&&<div className="ir big"><span className="l">{winnerUpi} receives</span><span className="v">₹{PRIZE}</span></div>}
        {isDraw&&<div className="ir big"><span className="l">Each player refund</span><span className="v">₹{ENTRY_FEE-PLATFORM_CUT}</span></div>}
      </div>

      <button className="btn btn-ghost" onClick={onPlayAgain}>New Game</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ROOT APP — localStorage session persistence
// ══════════════════════════════════════════════════════════
export default function App(){
  const [screen,setScreen]=useState("lobby");
  const [session,setSession]=useState(null);
  const [restoring,setRestoring]=useState(true);

  // Restore session on refresh
  useEffect(()=>{
    const restore=async()=>{
      const saved=loadSession();
      if(!saved){setRestoring(false);return;}
      const{data}=await supabase.from("games").select("*").eq("id",saved.code).single();
      if(!data){clearSession();setRestoring(false);return;}
      const s={...saved,game:data};
      setSession(s);
      if(data.status==="done")setScreen("winner");
      else if(data.status==="playing")setScreen("game");
      else if(data.status==="payment")setScreen("payment");
      else if(data.status==="waiting")setScreen("waiting");
      else{clearSession();}
      setRestoring(false);
    };
    restore();
  },[]);

  const go=(scr,sess)=>{
    if(sess){
      setSession(sess);
      saveSession({code:sess.code,upi:sess.upi,phone:sess.phone,role:sess.role});
    }
    setScreen(scr);
  };

  const newGame=()=>{clearSession();setSession(null);setScreen("lobby");};

  if(restoring)return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="restore">
          <div className="icon">♟</div>
          <p>Restoring your session…</p>
        </div>
      </div>
    </>
  );

  return(
    <>
      <style>{CSS}</style>
      {/* Load Cashfree SDK */}
      <script src="https://sdk.cashfree.com/js/v3/cashfree.js"/>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">♟ Chess<span>Bet</span></div>
          {session&&<button onClick={newGame} style={{background:"none",border:"1px solid var(--border)",borderRadius:6,color:"var(--dim)",fontSize:12,padding:"5px 11px",cursor:"pointer"}}>✕ Exit Game</button>}
        </nav>

        {screen==="lobby"&&(
          <Lobby
            onCreated={({code,upi,phone,role})=>go("waiting",{code,upi,phone,role,game:null})}
            onJoined={({code,upi,phone,role,game})=>go("payment",{code,upi,phone,role,game})}
          />
        )}

        {screen==="waiting"&&session&&(
          <Waiting code={session.code} upi={session.upi}
            onReady={g=>go("payment",{...session,game:g})}
          />
        )}

        {screen==="payment"&&session?.game&&(
          <PaymentScreen
            game={session.game} myRole={session.role}
            myUpi={session.upi} myPhone={session.phone}
            onPaid={async g=>{
              await supabase.from("games").update({status:"playing"}).eq("id",g.id);
              go("game",{...session,game:{...g,status:"playing"}});
            }}
          />
        )}

        {screen==="game"&&session?.game&&(
          <Game game={session.game} myRole={session.role}
            onGameOver={g=>{go("winner",{...session,game:g});}}
          />
        )}

        {screen==="winner"&&session?.game&&(
          <Winner game={session.game} myRole={session.role} onPlayAgain={newGame}/>
        )}
      </div>
    </>
  );
}
