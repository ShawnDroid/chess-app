import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dmcjbzyyfgmezqmrvmco.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ofp9kSxXEco5WzyI4XVN8Q_gO9mk-jz";
const ADMIN_PIN    = "1234"; // 👈 Change this to your secret admin PIN
const OWNER_UPI    = "8754992499@upi"; // 👈 Replace with your UPI (also set in Admin panel)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CHESS LOGIC ─────────────────────────────────────────────────────────────
const PIECES = {
  wK:"♔",wQ:"♕",wR:"♖",wB:"♗",wN:"♘",wP:"♙",
  bK:"♚",bQ:"♛",bR:"♜",bB:"♝",bN:"♞",bP:"♟",
};
function initBoard(){
  const b=Array(8).fill(null).map(()=>Array(8).fill(null));
  const back=["R","N","B","Q","K","B","N","R"];
  for(let c=0;c<8;c++){b[0][c]="b"+back[c];b[1][c]="bP";b[7][c]="w"+back[c];b[6][c]="wP";}
  return b;
}
const pc=p=>p?p[0]:null;
const isEnemy=(p,t)=>p&&pc(p)!==t;
const isFriend=(p,t)=>p&&pc(p)===t;
function inB(r,c){return r>=0&&r<8&&c>=0&&c<8;}
function getRaw(board,r,c,turn,lm){
  const p=board[r][c];if(!p||pc(p)!==turn)return[];
  const t=p[1],mv=[];
  const add=(tr,tc)=>{if(inB(tr,tc)&&!isFriend(board[tr][tc],turn))mv.push([tr,tc]);};
  const slide=(dr,dc)=>{let tr=r+dr,tc=c+dc;while(inB(tr,tc)){if(isFriend(board[tr][tc],turn))break;mv.push([tr,tc]);if(isEnemy(board[tr][tc],turn))break;tr+=dr;tc+=dc;}};
  if(t==="P"){
    const d=turn==="w"?-1:1,s=turn==="w"?6:1;
    if(inB(r+d,c)&&!board[r+d][c]){mv.push([r+d,c]);if(r===s&&!board[r+2*d][c])mv.push([r+2*d,c]);}
    for(const dc of[-1,1]){
      if(inB(r+d,c+dc)&&isEnemy(board[r+d][c+dc],turn))mv.push([r+d,c+dc]);
      if(lm&&lm.piece===(turn==="w"?"bP":"wP")&&lm.to[0]===r&&lm.to[1]===c+dc&&Math.abs(lm.from[0]-lm.to[0])===2)mv.push([r+d,c+dc]);
    }
  }else if(t==="N"){for(const[dr,dc]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])add(r+dr,c+dc);}
  else if(t==="B"){for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]])slide(dr,dc);}
  else if(t==="R"){for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]])slide(dr,dc);}
  else if(t==="Q"){for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]])slide(dr,dc);}
  else if(t==="K"){
    for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])add(r+dr,c+dc);
    if(turn==="w"&&r===7){if(!board[7][5]&&!board[7][6]&&board[7][7]==="wR")mv.push([7,6]);if(!board[7][3]&&!board[7][2]&&!board[7][1]&&board[7][0]==="wR")mv.push([7,2]);}
    if(turn==="b"&&r===0){if(!board[0][5]&&!board[0][6]&&board[0][7]==="bR")mv.push([0,6]);if(!board[0][3]&&!board[0][2]&&!board[0][1]&&board[0][0]==="bR")mv.push([0,2]);}
  }
  return mv;
}
function findKing(board,turn){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===turn+"K")return[r,c];return null;}
function applyMove(board,from,to){
  const nb=board.map(r=>[...r]);
  const p=nb[from[0]][from[1]];
  nb[to[0]][to[1]]=p;nb[from[0]][from[1]]=null;
  if(p[1]==="K"){if(from[1]===4&&to[1]===6){nb[from[0]][5]=nb[from[0]][7];nb[from[0]][7]=null;}if(from[1]===4&&to[1]===2){nb[from[0]][3]=nb[from[0]][0];nb[from[0]][0]=null;}}
  if(p==="wP"&&to[0]===0)nb[to[0]][to[1]]="wQ";
  if(p==="bP"&&to[0]===7)nb[to[0]][to[1]]="bQ";
  return nb;
}
function isInCheck(board,turn){
  const king=findKing(board,turn);if(!king)return false;
  const opp=turn==="w"?"b":"w";
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(pc(board[r][c])===opp&&getRaw(board,r,c,opp,null).some(([tr,tc])=>tr===king[0]&&tc===king[1]))return true;
  return false;
}
function getLegal(board,r,c,turn,lm){
  return getRaw(board,r,c,turn,lm).filter(([tr,tc])=>!isInCheck(applyMove(board,[r,c],[tr,tc]),turn));
}
function hasAny(board,turn,lm){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(pc(board[r][c])===turn&&getLegal(board,r,c,turn,lm).length>0)return true;
  return false;
}
function getCaptured(board){
  const all={wP:8,wN:2,wB:2,wR:2,wQ:1,bP:8,bN:2,bB:2,bR:2,bQ:1};
  const on={};
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c])on[board[r][c]]=(on[board[r][c]]||0)+1;
  const cap={w:[],b:[]};
  for(const[k,v]of Object.entries(all)){const miss=v-(on[k]||0);for(let i=0;i<miss;i++)cap[k[0]].push(k);}
  return cap;
}
function makeCode(){return Math.floor(1000+Math.random()*9000).toString();}
function upiLink(pa,pn,am,tn){return`upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;}
function fmtTime(s){const m=Math.floor(s/60);return`${m}:${(s%60).toString().padStart(2,"0")}`;}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#1a1a1a;font-family:'Inter',sans-serif;min-height:100vh;color:#e0e0e0;-webkit-font-smoothing:antialiased;}
:root{
  --bg:#1a1a1a;--surface:#262626;--s2:#2d2d2d;--s3:#333;
  --border:#3a3a3a;--b2:#444;
  --green:#4d8f4d;--gd:#3a6b3a;--gl:#5ea55e;
  --cream:#f0d9b5;--brown:#b58863;
  --text:#e0e0e0;--dim:#888;--dim2:#555;
  --gold:#f0a500;--danger:#e05252;--blue:#4a9eff;
}
.app{min-height:100vh;display:flex;flex-direction:column;align-items:center;background:var(--bg);}
.header{width:100%;background:#212121;border-bottom:1px solid var(--border);padding:0 16px;display:flex;align-items:center;justify-content:space-between;height:50px;position:sticky;top:0;z-index:100;}
.logo{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#fff;}
.logo span{font-size:22px;}
.admin-btn{background:none;border:1px solid var(--border);border-radius:6px;color:var(--dim);font-size:12px;padding:5px 10px;cursor:pointer;}
.admin-btn:hover{border-color:var(--gold);color:var(--gold);}
.main{width:100%;max-width:460px;padding:14px;display:flex;flex-direction:column;gap:12px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px;}
.ct{font-size:17px;font-weight:700;color:#fff;margin-bottom:3px;}
.cs{font-size:13px;color:var(--dim);margin-bottom:14px;line-height:1.5;}
.tabs{display:flex;background:var(--s2);border-radius:8px;padding:3px;margin-bottom:14px;}
.tab{flex:1;padding:8px;text-align:center;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;color:var(--dim);transition:all .2s;}
.tab.on{background:var(--green);color:#fff;}
input,select{width:100%;background:var(--s2);border:1px solid var(--border);border-radius:7px;padding:10px 13px;color:var(--text);font-family:'Inter',sans-serif;font-size:14px;margin-bottom:10px;outline:none;transition:border-color .2s;}
input:focus,select:focus{border-color:var(--green);}
input::placeholder{color:var(--dim2);}
.btn{width:100%;padding:11px;background:var(--green);border:none;border-radius:7px;color:#fff;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:2px;}
.btn:hover{background:var(--gl);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bg{background:transparent;border:1px solid var(--border);color:var(--dim);margin-top:8px;}
.bg:hover{border-color:var(--green);color:var(--green);background:transparent;}
.bb{background:#1e3a6e;}.bb:hover{background:#264d96;}
.br{background:#6e1e1e;}.br:hover{background:#962626;}
.bsm{padding:7px 14px;font-size:12px;width:auto;border-radius:6px;margin-top:0;}
.fee-row{display:flex;align-items:center;justify-content:space-between;background:var(--s2);border-radius:8px;padding:11px 14px;margin-bottom:14px;}
.fi{text-align:center;}
.fa{font-size:20px;font-weight:700;color:#fff;display:block;}
.fl{font-size:11px;color:var(--dim);text-transform:uppercase;}
.rc-box{background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:18px;text-align:center;margin-bottom:12px;}
.rc{font-size:50px;font-weight:700;color:#fff;letter-spacing:12px;}
.rh{font-size:12px;color:var(--dim);margin-top:5px;}
.sr{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dim);justify-content:center;padding:8px 0;}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 1.2s ease-in-out infinite;flex-shrink:0;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.ir{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;}
.ir:last-child{border-bottom:none;}
.il{color:var(--dim);}
.iv{color:#fff;font-weight:500;}
.ir.tot .il{color:var(--gl);font-weight:600;font-size:14px;}
.ir.tot .iv{font-size:18px;font-weight:700;}
.err{color:var(--danger);font-size:12px;margin-bottom:8px;margin-top:-6px;}

/* GAME */
.gp{width:100%;max-width:460px;padding:8px;display:flex;flex-direction:column;gap:6px;}
.pp{display:flex;justify-content:space-between;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px;}
.ppl{display:flex;align-items:center;gap:8px;}
.av{width:30px;height:30px;border-radius:50%;background:var(--s2);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:15px;}
.av.act{border-color:var(--green);}
.pn{font-size:13px;font-weight:600;color:#fff;}
.pr{font-size:11px;color:var(--dim);}
.cap{font-size:11px;color:var(--dim);min-height:14px;}
.tmr{font-size:17px;font-weight:700;color:#fff;background:var(--s2);border:1px solid var(--border);border-radius:6px;padding:4px 10px;min-width:60px;text-align:center;font-variant-numeric:tabular-nums;}
.tmr.at{background:var(--gd);border-color:var(--green);}
.tmr.low{color:var(--danger);border-color:var(--danger);animation:pulse .7s ease-in-out infinite;}
.board-wrap{position:relative;width:100%;}
.board{display:grid;grid-template-columns:18px repeat(8,1fr);width:100%;aspect-ratio:9/9.5;}
.rl{display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--dim);font-weight:500;}
.fl2{display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--dim);font-weight:500;}
.sq{display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;}
.sq.lt{background:var(--cream);}
.sq.dk{background:var(--brown);}
.sq.sel{background:#f6f669!important;}
.sq.lm::after{content:'';position:absolute;width:33%;height:33%;border-radius:50%;background:rgba(0,0,0,0.17);}
.sq.lc{box-shadow:inset 0 0 0 4px rgba(0,0,0,0.18);}
.sq.lf{background:#cdd16f!important;}
.sq.lt2{background:#aaa23a!important;}
.sq.ck{background:radial-gradient(ellipse at center,#e05252 0%,rgba(192,57,43,0.6) 60%,transparent 100%)!important;}
.piece{font-size:clamp(18px,4.8vw,34px);line-height:1;z-index:1;}
.sq:active .piece{transform:scale(.9);}
.sb{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 14px;text-align:center;font-size:13px;font-weight:500;}
.sb.mt{background:var(--gd);border-color:var(--green);color:#fff;}
.sb.ck2{background:#3d1a1a;border-color:var(--danger);color:var(--danger);}
.ga{display:flex;gap:6px;}
.ga .btn{margin-top:0;}
.ob{background:#2a2a0a;border:1px solid #6a6a00;border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;}
.ot{font-size:13px;color:#d4d400;}
.oa{display:flex;gap:6px;}
.chat{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;}
.ch{padding:7px 12px;border-bottom:1px solid var(--border);font-size:11px;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;}
.cm{height:90px;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:3px;}
.cm::-webkit-scrollbar{width:3px;}
.cm::-webkit-scrollbar-thumb{background:var(--border);}
.msg{font-size:12px;line-height:1.4;}
.snd{font-weight:600;color:var(--gl);margin-right:3px;}
.snd.me{color:var(--blue);}
.sys{color:var(--dim);font-style:italic;}
.ci{display:flex;gap:6px;padding:7px;border-top:1px solid var(--border);}
.ci input{margin-bottom:0;flex:1;}
.cs2{padding:8px 12px;background:var(--green);border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;}

/* WINNER */
.wp{width:100%;max-width:460px;padding:14px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;}
.ri{font-size:60px;}
.rt{font-size:30px;font-weight:700;color:#fff;}
.rs{font-size:13px;color:var(--dim);}
.pb{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px;border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;transition:all .2s;}
.pb.pg{background:#1e5c2e;}
.pb.pbl{background:#1e3d6e;}
.pb:hover{opacity:.85;transform:translateY(-1px);}

/* ADMIN */
.ap{width:100%;max-width:460px;padding:14px;display:flex;flex-direction:column;gap:12px;}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px;}
.sb2{background:var(--s2);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center;}
.sn{font-size:24px;font-weight:700;color:#fff;}
.sl{font-size:11px;color:var(--dim);text-transform:uppercase;margin-top:2px;}
.gr{background:var(--s2);border-radius:6px;padding:9px 11px;margin-bottom:6px;font-size:12px;}
.gt{display:flex;justify-content:space-between;margin-bottom:3px;}
.gu{color:var(--dim);}
.badge{display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600;text-transform:uppercase;}
.bd{background:#1e3d1e;color:var(--gl);}
.bp{background:#1e2d3d;color:var(--blue);}
.bw{background:#2d2d1e;color:#d4c050;}

/* PAY STEP */
.ps{background:var(--s2);border-radius:8px;padding:13px;margin-bottom:10px;}
.pst{font-size:13px;font-weight:600;color:#fff;margin-bottom:8px;display:flex;align-items:center;gap:8px;}
.snum{background:var(--green);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
`;

// ─── LOBBY ────────────────────────────────────────────────────────────────────
function LobbyScreen({onCreated,onJoined,settings}){
  const [tab,setTab]=useState("create");
  const [upi,setUpi]=useState("");
  const [code,setCode]=useState("");
  const [time,setTime]=useState("10");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const fee=settings?.entry_fee||10;
  const cut=settings?.platform_cut||2;
  const prize=fee*2-cut*2;

  const create=async()=>{
    if(!upi.trim())return setErr("Enter your UPI ID");
    setLoading(true);setErr("");
    const id=makeCode();
    const mins=parseInt(time)||10;
    const{error}=await supabase.from("games").insert({
      id,player1_upi:upi.trim(),board:JSON.stringify(initBoard()),
      turn:"w",status:"waiting",timer_mins:mins,
      p1_time:mins*60,p2_time:mins*60,
    });
    setLoading(false);
    if(error)return setErr("Could not create. Try again.");
    onCreated({code:id,upi:upi.trim(),role:"w"});
  };

  const join=async()=>{
    if(!upi.trim())return setErr("Enter your UPI ID");
    if(!code.trim())return setErr("Enter room code");
    setLoading(true);setErr("");
    const{data,error}=await supabase.from("games").select("*").eq("id",code.trim()).single();
    if(error||!data){setLoading(false);return setErr("Room not found.");}
    if(data.status!=="waiting"){setLoading(false);return setErr("Game already started.");}
    if(data.player1_upi===upi.trim()){setLoading(false);return setErr("You created this room!");}
    await supabase.from("games").update({player2_upi:upi.trim(),status:"payment"}).eq("id",code.trim());
    setLoading(false);
    onJoined({code:code.trim(),upi:upi.trim(),role:"b",game:data});
  };

  return(
    <div className="main">
      <div className="card">
        <div className="ct">Find a Game</div>
        <div className="cs">Enter your UPI ID to play for real money</div>
        <div className="fee-row">
          <div className="fi"><span className="fa">₹{fee}</span><span className="fl">Entry</span></div>
          <span style={{color:"var(--dim)"}}>→</span>
          <div className="fi"><span className="fa">₹{prize}</span><span className="fl">Winner</span></div>
          <span style={{color:"var(--dim)"}}>+</span>
          <div className="fi"><span className="fa">₹{cut*2}</span><span className="fl">Platform</span></div>
        </div>
        <div className="tabs">
          <div className={`tab${tab==="create"?" on":""}`} onClick={()=>setTab("create")}>Create Room</div>
          <div className={`tab${tab==="join"?" on":""}`} onClick={()=>setTab("join")}>Join Room</div>
        </div>
        <input placeholder="Your UPI ID (e.g. 9876543210@ybl)" value={upi} onChange={e=>{setUpi(e.target.value);setErr("");}}/>
        {tab==="create"&&(
          <select value={time} onChange={e=>setTime(e.target.value)}>
            <option value="3">3 min per player</option>
            <option value="5">5 min per player</option>
            <option value="10">10 min per player</option>
            <option value="15">15 min per player</option>
          </select>
        )}
        {tab==="join"&&<input placeholder="4-digit Room Code" value={code} maxLength={4} onChange={e=>{setCode(e.target.value);setErr("");}}/>}
        {err&&<div className="err">{err}</div>}
        <button className="btn" disabled={loading} onClick={tab==="create"?create:join}>
          {loading?"Please wait...":tab==="create"?"Create Room":"Join Room"}
        </button>
      </div>
    </div>
  );
}

// ─── WAITING ─────────────────────────────────────────────────────────────────
function WaitingScreen({code,upi,onReady}){
  useEffect(()=>{
    const ch=supabase.channel("w"+code)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"games",filter:`id=eq.${code}`},
        p=>{if(["payment","playing"].includes(p.new.status))onReady(p.new);})
      .subscribe();
    const iv=setInterval(async()=>{
      const{data}=await supabase.from("games").select("*").eq("id",code).single();
      if(data&&["payment","playing"].includes(data.status)){clearInterval(iv);onReady(data);}
    },3000);
    return()=>{supabase.removeChannel(ch);clearInterval(iv);};
  },[code,onReady]);
  return(
    <div className="main">
      <div className="card">
        <div className="ct">Room Created ✓</div>
        <div className="cs">Share this code with your opponent</div>
        <div className="rc-box"><div className="rc">{code}</div><div className="rh">Share this 4-digit code</div></div>
        <div style={{background:"var(--s2)",borderRadius:8,padding:"11px 13px",fontSize:13}}>
          <div style={{color:"var(--dim)",marginBottom:3}}>Your UPI</div>
          <div style={{color:"#fff",fontWeight:500}}>{upi}</div>
          <div style={{color:"var(--dim)",fontSize:11,marginTop:3}}>You play as White ♔</div>
        </div>
        <div className="sr"><div className="dot"/><span>Waiting for opponent...</span></div>
      </div>
    </div>
  );
}

// ─── PAYMENT ─────────────────────────────────────────────────────────────────
function PaymentScreen({game,myRole,myUpi,onPaid,settings}){
  const [paid,setPaid]=useState(false);
  const fee=settings?.entry_fee||10;
  const ownerUpi=settings?.owner_upi||OWNER_UPI;
  const myField=myRole==="w"?"p1_paid":"p2_paid";
  const href=upiLink(ownerUpi,"ChessApp",fee,`Chess entry Room ${game.id}`);

  const confirm=async()=>{
    setPaid(true);
    await supabase.from("games").update({[myField]:true}).eq("id",game.id);
  };

  useEffect(()=>{
    const ch=supabase.channel("pay"+game.id)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"games",filter:`id=eq.${game.id}`},
        p=>{if(p.new.p1_paid&&p.new.p2_paid)onPaid(p.new);})
      .subscribe();
    const iv=setInterval(async()=>{
      const{data}=await supabase.from("games").select("*").eq("id",game.id).single();
      if(data?.p1_paid&&data?.p2_paid){clearInterval(iv);onPaid(data);}
    },3000);
    return()=>{supabase.removeChannel(ch);clearInterval(iv);};
  },[game.id,onPaid]);

  return(
    <div className="main">
      <div className="card">
        <div className="ct">Pay to Play</div>
        <div className="cs">Room {game.id} · Pay ₹{fee} entry fee</div>
        <div className="ps">
          <div className="pst"><div className="snum">1</div>Pay ₹{fee} via GPay</div>
          <div className="ir"><span className="il">Pay To</span><span className="iv">{ownerUpi}</span></div>
          <div className="ir"><span className="il">Amount</span><span className="iv">₹{fee}</span></div>
          <div className="ir"><span className="il">Your UPI</span><span className="iv">{myUpi}</span></div>
        </div>
        {!paid?(
          <>
            <a className="pb pbl" href={href} style={{marginBottom:10,borderRadius:7}}>
              <span>📱</span> Open GPay — Pay ₹{fee}
            </a>
            <div style={{textAlign:"center",fontSize:12,color:"var(--dim)",marginBottom:10}}>After paying, confirm below ↓</div>
            <button className="btn" onClick={confirm}>✅ I Have Paid</button>
          </>
        ):(
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontSize:32,marginBottom:6}}>✅</div>
            <div style={{fontWeight:600,color:"#fff",marginBottom:4}}>Payment confirmed!</div>
            <div className="sr"><div className="dot"/><span>Waiting for opponent to pay...</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GAME ─────────────────────────────────────────────────────────────────────
function GameScreen({game,myRole,onGameOver,settings}){
  const [board,setBoard]=useState(()=>JSON.parse(game.board));
  const [turn,setTurn]=useState(game.turn||"w");
  const [sel,setSel]=useState(null);
  const [legal,setLegal]=useState([]);
  const [lm,setLm]=useState(null);
  const [inCheck,setCheck]=useState(false);
  const [ended,setEnded]=useState(false);
  const [p1Time,setP1Time]=useState(game.p1_time||(game.timer_mins||10)*60);
  const [p2Time,setP2Time]=useState(game.p2_time||(game.timer_mins||10)*60);
  const [drawOffer,setDrawOffer]=useState(null);
  const [chat,setChat]=useState([{sys:true,text:"Game started! Good luck 🎯"}]);
  const [chatInput,setChatInput]=useState("");
  const [rematchReq,setRematchReq]=useState(null);
  const chatRef=useRef(null);
  const myTurn=turn===myRole;
  const oppRole=myRole==="w"?"b":"w";
  const p1upi=game.player1_upi;
  const p2upi=game.player2_upi;
  const myUpi=myRole==="w"?p1upi:p2upi;
  const oppUpi=myRole==="w"?p2upi:p1upi;
  const myTime=myRole==="w"?p1Time:p2Time;
  const oppTime=myRole==="w"?p2Time:p1Time;

  useEffect(()=>{
    if(ended)return;
    const iv=setInterval(()=>{
      if(turn==="w")setP1Time(t=>{if(t<=1){supabase.from("games").update({status:"done",winner:"b",end_reason:"timeout"}).eq("id",game.id);return 0;}return t-1;});
      else setP2Time(t=>{if(t<=1){supabase.from("games").update({status:"done",winner:"w",end_reason:"timeout"}).eq("id",game.id);return 0;}return t-1;});
    },1000);
    return()=>clearInterval(iv);
  },[turn,ended,game.id]);

  useEffect(()=>{
    const ch=supabase.channel("g"+game.id)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"games",filter:`id=eq.${game.id}`},p=>{
        const d=p.new;
        if(d.board){const nb=JSON.parse(d.board);setBoard(nb);if(d.turn)setCheck(isInCheck(nb,d.turn));}
        if(d.turn)setTurn(d.turn);
        if(d.last_move)setLm(JSON.parse(d.last_move));
        if(d.p1_time!==undefined)setP1Time(d.p1_time);
        if(d.p2_time!==undefined)setP2Time(d.p2_time);
        if(d.draw_offer!==undefined)setDrawOffer(d.draw_offer||null);
        if(d.chat_log)setChat(JSON.parse(d.chat_log));
        if(d.rematch_req)setRematchReq(d.rematch_req);
        if(d.status==="done"){setEnded(true);onGameOver(d);}
      }).subscribe();
    return()=>supabase.removeChannel(ch);
  },[game.id,onGameOver]);

  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[chat]);

  const doMove=async(from,to)=>{
    const nb=applyMove(board,from,to);
    const newLm={piece:board[from[0]][from[1]],from,to};
    const nextTurn=turn==="w"?"b":"w";
    const check=isInCheck(nb,nextTurn);
    let status="playing",winner=null,reason=null;
    if(!hasAny(nb,nextTurn,newLm)){status="done";winner=check?turn:"draw";reason=check?"checkmate":"stalemate";}
    setBoard(nb);setTurn(nextTurn);setCheck(check);setSel(null);setLegal([]);setLm(newLm);
    const tf=turn==="w"?"p1_time":"p2_time";
    const tv=turn==="w"?p1Time:p2Time;
    await supabase.from("games").update({board:JSON.stringify(nb),turn:nextTurn,last_move:JSON.stringify(newLm),[tf]:tv,status,winner,end_reason:reason}).eq("id",game.id);
    if(status==="done"){setEnded(true);onGameOver({...game,winner,status:"done",end_reason:reason,board:JSON.stringify(nb)});}
  };

  const handleSq=useCallback((r,c)=>{
    if(!myTurn||ended)return;
    const piece=board[r][c];
    if(sel){
      const isL=legal.some(([lr,lc])=>lr===r&&lc===c);
      if(isL){doMove(sel,[r,c]);return;}
      if(pc(piece)===turn){setSel([r,c]);setLegal(getLegal(board,r,c,turn,lm));return;}
      setSel(null);setLegal([]);return;
    }
    if(pc(piece)===turn){setSel([r,c]);setLegal(getLegal(board,r,c,turn,lm));}
  },[board,turn,myTurn,sel,legal,lm,ended]);

  const offerDraw=async()=>await supabase.from("games").update({draw_offer:myRole}).eq("id",game.id);
  const acceptDraw=async()=>await supabase.from("games").update({status:"done",winner:"draw",end_reason:"agreement"}).eq("id",game.id);
  const declineDraw=async()=>await supabase.from("games").update({draw_offer:null}).eq("id",game.id);
  const resign=async()=>{
    if(!window.confirm("Resign this game?"))return;
    await supabase.from("games").update({status:"done",winner:oppRole,end_reason:"resign"}).eq("id",game.id);
  };
  const sendChat=async()=>{
    if(!chatInput.trim())return;
    const nm={sender:myRole,text:chatInput.trim()};
    const nc=[...chat,nm];setChat(nc);setChatInput("");
    await supabase.from("games").update({chat_log:JSON.stringify(nc)}).eq("id",game.id);
  };
  const requestRematch=async()=>await supabase.from("games").update({rematch_req:myRole}).eq("id",game.id);

  const kingPos=inCheck?findKing(board,turn):null;
  const captured=getCaptured(board);
  const rows=myRole==="b"?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
  const cols=myRole==="b"?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
  const files="abcdefgh";

  return(
    <div className="gp">
      {/* Opponent */}
      <div className="pp">
        <div className="ppl">
          <div className={`av${turn===oppRole&&!ended?" act":""}`}>{oppRole==="w"?"♔":"♚"}</div>
          <div>
            <div className="pn">{oppUpi}</div>
            <div className="cap">{(oppRole==="w"?captured.w:captured.b).map(p=>PIECES[p]).join("")}</div>
          </div>
        </div>
        <div className={`tmr${turn===oppRole&&!ended?" at":""}${oppTime<30?" low":""}`}>{fmtTime(oppTime)}</div>
      </div>

      {drawOffer&&drawOffer!==myRole&&!ended&&(
        <div className="ob">
          <span className="ot">Opponent offers a draw</span>
          <div className="oa">
            <button className="btn bsm" onClick={acceptDraw}>Accept</button>
            <button className="btn br bsm" onClick={declineDraw}>Decline</button>
          </div>
        </div>
      )}
      {drawOffer===myRole&&!ended&&<div className="ob"><span className="ot">Draw offer sent...</span></div>}

      {/* Board */}
      <div className="board-wrap">
        <div className="board" style={{gridTemplateRows:"repeat(8,1fr) 18px"}}>
          {rows.map((r,ri)=>[
            <div key={`r${r}`} className="rl">{8-r}</div>,
            ...cols.map(c=>{
              const piece=board[r][c];
              const isLight=(r+c)%2===0;
              const isSel=sel&&sel[0]===r&&sel[1]===c;
              const isL=legal.some(([lr,lc])=>lr===r&&lc===c);
              const isLF=lm&&lm.from[0]===r&&lm.from[1]===c;
              const isLT=lm&&lm.to[0]===r&&lm.to[1]===c;
              const isCk=kingPos&&kingPos[0]===r&&kingPos[1]===c;
              let cls=`sq ${isLight?"lt":"dk"}`;
              if(isSel)cls+=" sel";
              else if(isLF)cls+=" lf";
              else if(isLT)cls+=" lt2";
              if(isL&&piece)cls+=" lc";else if(isL)cls+=" lm";
              if(isCk)cls+=" ck";
              return(
                <div key={`${r}${c}`} className={cls} onClick={()=>handleSq(r,c)}>
                  {piece&&<span className="piece">{PIECES[piece]}</span>}
                </div>
              );
            }),
            ...(ri===7?[<div key="corner" style={{background:"transparent"}}/>,
              ...cols.map(c=><div key={`f${c}`} className="fl2">{files[c]}</div>)]:[])
          ])}
        </div>
      </div>

      {/* Status */}
      <div className={`sb${ended?"":myTurn&&!inCheck?" mt":inCheck?" ck2":""}`}>
        {ended?"Game Over":myTurn?`Your turn${inCheck?" — CHECK ⚠️":""}`:inCheck?"Opponent in Check ⚠️":"Opponent's turn..."}
      </div>

      {/* My panel */}
      <div className="pp">
        <div className="ppl">
          <div className={`av${myTurn&&!ended?" act":""}`}>{myRole==="w"?"♔":"♚"}</div>
          <div>
            <div className="pn">{myUpi} <span style={{fontSize:11,color:"var(--dim)"}}>(You)</span></div>
            <div className="cap">{(myRole==="w"?captured.w:captured.b).map(p=>PIECES[p]).join("")}</div>
          </div>
        </div>
        <div className={`tmr${myTurn&&!ended?" at":""}${myTime<30?" low":""}`}>{fmtTime(myTime)}</div>
      </div>

      {!ended&&(
        <div className="ga">
          <button className="btn bg bsm" onClick={offerDraw} disabled={drawOffer===myRole}>Draw</button>
          <button className="btn br bsm" onClick={resign}>Resign</button>
        </div>
      )}
      {ended&&!rematchReq&&<button className="btn" onClick={requestRematch}>Request Rematch</button>}
      {ended&&rematchReq&&rematchReq!==myRole&&(
        <div style={{textAlign:"center",fontSize:13,color:"var(--gl)",padding:"4px"}}>Opponent wants a rematch!</div>
      )}

      {/* Chat */}
      <div className="chat">
        <div className="ch">Chat</div>
        <div className="cm" ref={chatRef}>
          {chat.map((m,i)=>m.sys
            ?<div key={i} className="msg sys">{m.text}</div>
            :<div key={i} className="msg">
              <span className={`snd${m.sender===myRole?" me":""}`}>{m.sender===myRole?"You":oppUpi.split("@")[0]}:</span>
              {m.text}
            </div>
          )}
        </div>
        <div className="ci">
          <input placeholder="Message..." value={chatInput} onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
          <button className="cs2" onClick={sendChat}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── WINNER ───────────────────────────────────────────────────────────────────
function WinnerScreen({game,myRole,onPlayAgain,settings}){
  const winner=game.winner;
  const reason=game.end_reason;
  const isDraw=winner==="draw";
  const iWon=winner===myRole;
  const fee=settings?.entry_fee||10;
  const cut=settings?.platform_cut||2;
  const prize=fee*2-cut*2;
  const ownerUpi=settings?.owner_upi||OWNER_UPI;
  const winnerUpi=winner==="w"?game.player1_upi:winner==="b"?game.player2_upi:null;
  const winLink=winnerUpi?upiLink(winnerUpi,"Chess Winner",prize,`Chess winnings Room ${game.id}`):null;
  const feeLink=upiLink(ownerUpi,"ChessApp Fee",cut*2,`Platform fee Room ${game.id}`);
  const rmap={checkmate:"by Checkmate",stalemate:"Stalemate",timeout:"on Time",resign:"by Resignation",agreement:"Draw agreed"};

  return(
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
      {winLink&&<a className="pb pg" href={winLink}><span>📱</span>Pay ₹{prize} to Winner</a>}
      <a className="pb pbl" href={feeLink}><span>💼</span>Pay ₹{cut*2} Platform Fee</a>
      <div style={{fontSize:11,color:"var(--dim)",textAlign:"center",lineHeight:1.8}}>
        Show winner this screen · Platform fee → {ownerUpi}
      </div>
      <button className="btn bg" onClick={onPlayAgain}>New Game</button>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({onBack}){
  const [pin,setPin]=useState("");
  const [auth,setAuth]=useState(false);
  const [settings,setSettings]=useState({entry_fee:10,platform_cut:2,owner_upi:""});
  const [games,setGames]=useState([]);
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState(false);
  const [err,setErr]=useState("");

  const login=()=>{
    if(pin===ADMIN_PIN){setAuth(true);load();}
    else setErr("Wrong PIN");
  };
  const load=async()=>{
    setLoading(true);
    const{data:s}=await supabase.from("settings").select("*").eq("id","main").single();
    if(s)setSettings(s);
    const{data:g}=await supabase.from("games").select("*").order("created_at",{ascending:false}).limit(20);
    if(g)setGames(g);
    setLoading(false);
  };
  const save=async()=>{
    await supabase.from("settings").upsert({id:"main",...settings});
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  const done=games.filter(g=>g.status==="done").length;
  const totalFees=done*(settings.platform_cut||2)*2;

  if(!auth)return(
    <div className="main">
      <div className="card">
        <div className="ct">Admin Panel</div>
        <div className="cs">Enter your PIN to continue</div>
        <input type="password" placeholder="Admin PIN" value={pin}
          onChange={e=>{setPin(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&login()}/>
        {err&&<div className="err">{err}</div>}
        <button className="btn" onClick={login}>Login</button>
        <button className="btn bg" onClick={onBack}>Back</button>
      </div>
    </div>
  );

  return(
    <div className="ap">
      <div className="card">
        <div className="ct" style={{marginBottom:12}}>Dashboard</div>
        <div className="sg">
          <div className="sb2"><div className="sn">{games.length}</div><div className="sl">Total Games</div></div>
          <div className="sb2"><div className="sn">{done}</div><div className="sl">Completed</div></div>
          <div className="sb2"><div className="sn">₹{totalFees}</div><div className="sl">Fees Earned</div></div>
          <div className="sb2"><div className="sn">₹{settings.entry_fee||10}</div><div className="sl">Entry Fee</div></div>
        </div>
      </div>
      <div className="card">
        <div className="ct" style={{marginBottom:12}}>Settings</div>
        <div style={{fontSize:12,color:"var(--dim)",marginBottom:4}}>Your UPI ID (fees go here)</div>
        <input placeholder="yourname@upi" value={settings.owner_upi||""} onChange={e=>setSettings({...settings,owner_upi:e.target.value})}/>
        <div style={{fontSize:12,color:"var(--dim)",marginBottom:4}}>Entry Fee per Player (₹)</div>
        <input type="number" value={settings.entry_fee||10} onChange={e=>setSettings({...settings,entry_fee:parseInt(e.target.value)||10})}/>
        <div style={{fontSize:12,color:"var(--dim)",marginBottom:4}}>Your Cut per Player (₹)</div>
        <input type="number" value={settings.platform_cut||2} onChange={e=>setSettings({...settings,platform_cut:parseInt(e.target.value)||2})}/>
        <div style={{fontSize:12,color:"var(--gl)",marginBottom:10}}>
          Prize: ₹{((settings.entry_fee||10)*2)-((settings.platform_cut||2)*2)} · Your earnings/game: ₹{(settings.platform_cut||2)*2}
        </div>
        <button className="btn" onClick={save}>{saved?"✅ Saved!":"Save Settings"}</button>
      </div>
      <div className="card">
        <div className="ct" style={{marginBottom:10}}>Recent Games</div>
        {loading&&<div style={{color:"var(--dim)",fontSize:13}}>Loading...</div>}
        {games.map(g=>(
          <div className="gr" key={g.id}>
            <div className="gt">
              <span style={{fontWeight:600,color:"#fff"}}>Room #{g.id}</span>
              <span className={`badge ${g.status==="done"?"bd":g.status==="playing"?"bp":"bw"}`}>{g.status}</span>
            </div>
            <div className="gu">{g.player1_upi} vs {g.player2_upi||"waiting..."}</div>
            {g.winner&&<div style={{fontSize:11,color:"var(--gl)",marginTop:2}}>
              Winner: {g.winner==="draw"?"Draw":g.winner==="w"?g.player1_upi:g.player2_upi}
            </div>}
          </div>
        ))}
        {!loading&&games.length===0&&<div style={{color:"var(--dim)",fontSize:13}}>No games yet</div>}
      </div>
      <button className="btn bg" onClick={onBack}>← Back</button>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("lobby");
  const [session,setSession]=useState(null);
  const [settings,setSettings]=useState({entry_fee:10,platform_cut:2,owner_upi:OWNER_UPI});

  useEffect(()=>{
    supabase.from("settings").select("*").eq("id","main").single().then(({data})=>{if(data)setSettings(data);});
  },[]);

  return(
    <>
      <style>{S}</style>
      <div className="app">
        <div className="header">
          <div className="logo"><span>♟</span>ChessBet</div>
          <button className="admin-btn" onClick={()=>setScreen(s=>s==="admin"?"lobby":"admin")}>
            {screen==="admin"?"✕ Close":"⚙ Admin"}
          </button>
        </div>

        {screen==="admin"&&<AdminScreen onBack={()=>setScreen("lobby")}/>}

        {screen==="lobby"&&
          <LobbyScreen settings={settings}
            onCreated={({code,upi,role})=>{setSession({code,upi,role,game:null});setScreen("waiting");}}
            onJoined={({code,upi,role,game})=>{setSession({code,upi,role,game});setScreen("payment");}}
          />}

        {screen==="waiting"&&session&&
          <WaitingScreen code={session.code} upi={session.upi}
            onReady={g=>{setSession(s=>({...s,game:g}));setScreen("payment");}}
          />}

        {screen==="payment"&&session?.game&&
          <PaymentScreen game={session.game} myRole={session.role} myUpi={session.upi} settings={settings}
            onPaid={async g=>{
              await supabase.from("games").update({status:"playing"}).eq("id",g.id);
              setSession(s=>({...s,game:{...g,status:"playing"}}));
              setScreen("game");
            }}
          />}

        {screen==="game"&&session?.game&&
          <GameScreen game={session.game} myRole={session.role} settings={settings}
            onGameOver={g=>{setSession(s=>({...s,game:g}));setScreen("winner");}}
          />}

        {screen==="winner"&&session?.game&&
          <WinnerScreen game={session.game} myRole={session.role} settings={settings}
            onPlayAgain={()=>{setSession(null);setScreen("lobby");}}
          />}
      </div>
    </>
  );
}
