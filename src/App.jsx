import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://dmcjbzyyfgmezqmrvmco.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ofp9kSxXEco5WzyI4XVN8Q_gO9mk-jz";
const OWNER_UPI    = "8754992499@upi"; // 👈 REPLACE WITH YOUR UPI ID

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CHESS LOGIC ──────────────────────────────────────────────────────────────
const PIECES = {
  wK:"♔",wQ:"♕",wR:"♖",wB:"♗",wN:"♘",wP:"♙",
  bK:"♚",bQ:"♛",bR:"♜",bB:"♝",bN:"♞",bP:"♟",
};

function initBoard() {
  const b = Array(8).fill(null).map(()=>Array(8).fill(null));
  const back = ["R","N","B","Q","K","B","N","R"];
  for(let c=0;c<8;c++){
    b[0][c]="b"+back[c]; b[1][c]="bP";
    b[7][c]="w"+back[c]; b[6][c]="wP";
  }
  return b;
}

const col  = p => p?p[0]:null;
const enemy= (p,t)=> p&&col(p)!==t;
const friend=(p,t)=> p&&col(p)===t;
function inB(r,c){return r>=0&&r<8&&c>=0&&c<8;}

function getRaw(board,r,c,turn,lastMove){
  const p=board[r][c]; if(!p||col(p)!==turn) return [];
  const t=p[1], mv=[];
  const add=(tr,tc)=>{if(inB(tr,tc)&&!friend(board[tr][tc],turn))mv.push([tr,tc]);};
  const slide=(dr,dc)=>{let tr=r+dr,tc=c+dc;while(inB(tr,tc)){if(friend(board[tr][tc],turn))break;mv.push([tr,tc]);if(enemy(board[tr][tc],turn))break;tr+=dr;tc+=dc;}};
  if(t==="P"){
    const d=turn==="w"?-1:1,s=turn==="w"?6:1;
    if(inB(r+d,c)&&!board[r+d][c]){mv.push([r+d,c]);if(r===s&&!board[r+2*d][c])mv.push([r+2*d,c]);}
    for(const dc of[-1,1]){
      if(inB(r+d,c+dc)&&enemy(board[r+d][c+dc],turn))mv.push([r+d,c+dc]);
      if(lastMove&&lastMove.piece===(turn==="w"?"bP":"wP")&&lastMove.to[0]===r&&lastMove.to[1]===c+dc&&Math.abs(lastMove.from[0]-lastMove.to[0])===2)mv.push([r+d,c+dc]);
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

function findKing(board,turn){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===turn+"K")return[r,c];
  return null;
}

function applyMove(board,from,to){
  const nb=board.map(r=>[...r]);
  const p=nb[from[0]][from[1]];
  nb[to[0]][to[1]]=p; nb[from[0]][from[1]]=null;
  if(p[1]==="K"){
    if(from[1]===4&&to[1]===6){nb[from[0]][5]=nb[from[0]][7];nb[from[0]][7]=null;}
    if(from[1]===4&&to[1]===2){nb[from[0]][3]=nb[from[0]][0];nb[from[0]][0]=null;}
  }
  if(p==="wP"&&to[0]===0)nb[to[0]][to[1]]="wQ";
  if(p==="bP"&&to[0]===7)nb[to[0]][to[1]]="bQ";
  return nb;
}

function isInCheck(board,turn){
  const king=findKing(board,turn); if(!king)return false;
  const opp=turn==="w"?"b":"w";
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(col(board[r][c])===opp&&getRaw(board,r,c,opp,null).some(([tr,tc])=>tr===king[0]&&tc===king[1]))return true;
  return false;
}

function getLegal(board,r,c,turn,lastMove){
  return getRaw(board,r,c,turn,lastMove).filter(([tr,tc])=>!isInCheck(applyMove(board,[r,c],[tr,tc]),turn));
}

function hasAny(board,turn,lastMove){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    if(col(board[r][c])===turn&&getLegal(board,r,c,turn,lastMove).length>0)return true;
  return false;
}

function boardToStr(b){return JSON.stringify(b);}
function strToBoard(s){return JSON.parse(s);}
function makeRoomCode(){return Math.floor(1000+Math.random()*9000).toString();}
function upiLink(pa,pn,am,tn){return `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;}

// ── STYLES ───────────────────────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0a0a0f;font-family:'Crimson Pro',serif;min-height:100vh;color:#e8dcc8;}
:root{
  --gold:#c9a84c;--gold-light:#f0d080;--dark:#0a0a0f;
  --surface:#12121a;--surface2:#1a1a26;--border:#2a2a3a;
  --text:#e8dcc8;--dim:#8a8070;
  --ws:#f0d9b5;--bs:#b58863;
  --hi:rgba(201,168,76,0.45);--danger:#c0392b;
}
.app{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:16px;background:radial-gradient(ellipse at top,#1a1428 0%,#0a0a0f 60%);}
.logo{font-family:'Playfair Display',serif;font-size:clamp(26px,6vw,44px);font-weight:900;color:var(--gold);letter-spacing:3px;text-align:center;padding:16px 0 2px;text-shadow:0 0 40px rgba(201,168,76,0.3);}
.tagline{font-size:13px;color:var(--dim);letter-spacing:4px;text-transform:uppercase;margin-bottom:20px;text-align:center;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;width:100%;max-width:420px;box-shadow:0 8px 40px rgba(0,0,0,0.6);}
.card-title{font-family:'Playfair Display',serif;font-size:20px;color:var(--gold);margin-bottom:4px;}
.card-sub{font-size:14px;color:var(--dim);margin-bottom:20px;line-height:1.6;}
input{width:100%;background:#0d0d15;border:1px solid var(--border);border-radius:6px;padding:11px 14px;color:var(--text);font-family:'Crimson Pro',serif;font-size:16px;margin-bottom:10px;outline:none;transition:border-color .2s;}
input:focus{border-color:var(--gold);}
input::placeholder{color:var(--dim);}
.btn{width:100%;padding:13px;background:linear-gradient(135deg,#b8922a,#c9a84c,#b8922a);border:none;border-radius:8px;color:#0a0a0f;font-family:'Playfair Display',serif;font-size:15px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;text-transform:uppercase;box-shadow:0 4px 20px rgba(201,168,76,0.25);margin-top:4px;}
.btn:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(201,168,76,0.4);}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--dim);font-size:13px;letter-spacing:1px;box-shadow:none;padding:10px;margin-top:8px;}
.btn-ghost:hover{border-color:var(--gold);color:var(--gold);box-shadow:none;}
.btn-blue{background:linear-gradient(135deg,#1557b0,#1a73e8);color:#fff;box-shadow:0 4px 20px rgba(26,115,232,0.3);}
.btn-green{background:linear-gradient(135deg,#1a6b3a,#27ae60);color:#fff;box-shadow:0 4px 20px rgba(39,174,96,0.3);}
.fee-box{background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(201,168,76,.03));border:1px solid rgba(201,168,76,.2);border-radius:8px;padding:12px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;}
.fee-item{text-align:center;}
.fee-num{font-family:'Playfair Display',serif;font-size:20px;color:var(--gold-light);display:block;}
.fee-label{font-size:11px;color:var(--dim);letter-spacing:1px;}
.fee-arrow{color:var(--dim);font-size:18px;}
.section{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:14px;}
.section-label{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:10px;}
.room-code{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;color:var(--gold);letter-spacing:10px;text-align:center;padding:12px 0;text-shadow:0 0 20px rgba(201,168,76,.4);}
.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold);animation:pulse 1.2s ease-in-out infinite;margin-right:8px;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.info-row{display:flex;justify-content:space-between;font-size:14px;padding:6px 0;border-bottom:1px solid var(--border);}
.info-row:last-child{border-bottom:none;}
.info-row .lbl{color:var(--dim);}
.info-row .val{color:var(--text);font-weight:600;}
.info-row.hi .lbl{color:var(--gold);font-family:'Playfair Display',serif;}
.info-row.hi .val{color:var(--gold-light);font-size:18px;font-family:'Playfair Display',serif;}
.game-wrap{width:100%;max-width:500px;display:flex;flex-direction:column;align-items:center;gap:10px;}
.player-bar{width:100%;display:flex;justify-content:space-between;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;}
.p-info{display:flex;align-items:center;gap:8px;}
.p-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;background:var(--surface2);border:2px solid var(--border);}
.p-upi{font-size:13px;color:var(--text);}
.p-role{font-size:11px;color:var(--dim);}
.active-dot{width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold);animation:pulse 1.2s ease-in-out infinite;}
.turn-bar{font-family:'Playfair Display',serif;font-size:14px;color:var(--gold);letter-spacing:2px;text-align:center;padding:7px 16px;background:rgba(201,168,76,.07);border:1px solid rgba(201,168,76,.15);border-radius:8px;width:100%;}
.board-wrap{position:relative;width:100%;aspect-ratio:1;max-width:460px;}
.board{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);width:100%;height:100%;border:3px solid var(--gold);border-radius:4px;overflow:hidden;box-shadow:0 0 40px rgba(201,168,76,.15),0 8px 32px rgba(0,0,0,.6);}
.sq{display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:background .1s;user-select:none;-webkit-tap-highlight-color:transparent;}
.sq.light{background:var(--ws);}
.sq.dark{background:var(--bs);}
.sq.selected{background:var(--hi)!important;}
.sq.legal{background:rgba(201,168,76,.22)!important;}
.sq.legal::after{content:'';position:absolute;width:30%;height:30%;border-radius:50%;background:rgba(201,168,76,.6);}
.sq.legal.hp::after{display:none;}
.sq.legal.hp{box-shadow:inset 0 0 0 3px rgba(201,168,76,.7);}
.sq.check{background:rgba(192,57,43,.55)!important;}
.piece{font-size:clamp(20px,5.2vw,38px);line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));z-index:1;}
.coord-f{position:absolute;bottom:1px;right:2px;font-size:9px;font-weight:700;opacity:.5;}
.coord-r{position:absolute;top:1px;left:2px;font-size:9px;font-weight:700;opacity:.5;}
.winner-wrap{width:100%;max-width:420px;text-align:center;display:flex;flex-direction:column;gap:14px;}
.crown{font-size:60px;animation:float 2s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.win-title{font-family:'Playfair Display',serif;font-size:clamp(26px,7vw,44px);font-weight:900;color:var(--gold);text-shadow:0 0 30px rgba(201,168,76,.5);}
.pay-card{background:var(--surface);border:1px solid rgba(201,168,76,.3);border-radius:12px;padding:18px;}
.gpay-a{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:13px;border:none;border-radius:8px;color:#fff;font-family:'Playfair Display',serif;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;transition:all .2s;}
.waiting-wrap{width:100%;max-width:420px;display:flex;flex-direction:column;gap:14px;text-align:center;}
.pay-step{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:left;}
.pay-step-num{font-family:'Playfair Display',serif;font-size:28px;color:var(--gold);float:left;margin-right:12px;line-height:1;}
.pay-step-text{font-size:14px;line-height:1.6;color:var(--text);}
.pay-step-text strong{color:var(--gold-light);}
.badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;}
.badge-wait{background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.3);color:var(--gold);}
.badge-ready{background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);color:#27ae60;}
.tabs{display:flex;gap:8px;margin-bottom:18px;}
.tab{flex:1;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--dim);font-family:'Playfair Display',serif;font-size:14px;cursor:pointer;transition:all .2s;text-align:center;}
.tab.active{background:rgba(201,168,76,.1);border-color:var(--gold);color:var(--gold);}
@media(max-width:380px){.card{padding:16px 12px;}.room-code{font-size:38px;letter-spacing:6px;}}
`;

// ── SCREENS ───────────────────────────────────────────────────────────────────

// 1. LOBBY — enter UPI, create or join room
function LobbyScreen({ onCreated, onJoined }) {
  const [tab, setTab] = useState("create");
  const [upi, setUpi] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleCreate = async () => {
    if (!upi.trim()) return setErr("Enter your UPI ID");
    setLoading(true); setErr("");
    const code = makeRoomCode();
    const { error } = await supabase.from("games").insert({
      id: code,
      player1_upi: upi.trim(),
      board: boardToStr(initBoard()),
      turn: "w",
      status: "waiting",
    });
    setLoading(false);
    if (error) return setErr("Error creating room. Try again.");
    onCreated({ code, upi: upi.trim(), role: "w" });
  };

  const handleJoin = async () => {
    if (!upi.trim()) return setErr("Enter your UPI ID");
    if (!joinCode.trim()) return setErr("Enter room code");
    setLoading(true); setErr("");
    const { data, error } = await supabase.from("games").select("*").eq("id", joinCode.trim()).single();
    if (error || !data) { setLoading(false); return setErr("Room not found. Check the code."); }
    if (data.status !== "waiting") { setLoading(false); return setErr("This game already started."); }
    if (data.player1_upi === upi.trim()) { setLoading(false); return setErr("You created this room. Share the code!"); }
    const { error: e2 } = await supabase.from("games").update({ player2_upi: upi.trim(), status: "payment" }).eq("id", joinCode.trim());
    setLoading(false);
    if (e2) return setErr("Error joining. Try again.");
    onJoined({ code: joinCode.trim(), upi: upi.trim(), role: "b", p1upi: data.player1_upi });
  };

  return (
    <div className="card">
      <div className="card-title">♟ New Game</div>
      <div className="card-sub">Enter your UPI ID to play. ₹10 entry per player.</div>
      <div className="fee-box">
        <div className="fee-item"><span className="fee-num">₹10</span><span className="fee-label">Each Player</span></div>
        <div className="fee-arrow">→</div>
        <div className="fee-item"><span className="fee-num">₹16</span><span className="fee-label">Winner Gets</span></div>
        <div className="fee-arrow">+</div>
        <div className="fee-item"><span className="fee-num">₹4</span><span className="fee-label">Platform</span></div>
      </div>
      <div className="tabs">
        <div className={`tab${tab==="create"?" active":""}`} onClick={()=>setTab("create")}>Create Room</div>
        <div className={`tab${tab==="join"?" active":""}`} onClick={()=>setTab("join")}>Join Room</div>
      </div>
      <input placeholder="Your UPI ID (e.g. 9876543210@upi)" value={upi} onChange={e=>{setUpi(e.target.value);setErr("");}} />
      {tab==="join" && <input placeholder="4-digit Room Code" value={joinCode} maxLength={4} onChange={e=>{setJoinCode(e.target.value);setErr("");}} />}
      {err && <div style={{color:"#e74c3c",fontSize:13,marginBottom:8}}>{err}</div>}
      <button className="btn" disabled={loading} onClick={tab==="create"?handleCreate:handleJoin}>
        {loading ? "Please wait..." : tab==="create" ? "Create Room" : "Join Room"}
      </button>
    </div>
  );
}

// 2. WAITING — player1 waits for player2 to join
function WaitingScreen({ code, upi, onReady }) {
  useEffect(() => {
    const ch = supabase.channel("wait_" + code)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${code}` },
        payload => { if (payload.new.status === "payment") onReady(payload.new); })
      .subscribe();
    // also poll in case realtime is slow
    const interval = setInterval(async () => {
      const { data } = await supabase.from("games").select("*").eq("id", code).single();
      if (data && data.status === "payment") { clearInterval(interval); onReady(data); }
    }, 3000);
    return () => { supabase.removeChannel(ch); clearInterval(interval); };
  }, [code, onReady]);

  return (
    <div className="waiting-wrap">
      <div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"var(--gold)",marginBottom:6}}>Room Created!</div>
        <div style={{fontSize:14,color:"var(--dim)"}}>Share this code with your opponent</div>
      </div>
      <div className="room-code">{code}</div>
      <div style={{fontSize:13,color:"var(--dim)"}}>
        <span className="status-dot"/>Waiting for opponent to join...
      </div>
      <div className="section" style={{textAlign:"left"}}>
        <div className="section-label">Your UPI</div>
        <div style={{fontSize:15,color:"var(--text)"}}>{upi}</div>
        <div style={{fontSize:12,color:"var(--dim)",marginTop:4}}>You play as White ♔</div>
      </div>
    </div>
  );
}

// 3. PAYMENT — both players pay before game starts
function PaymentScreen({ game, myUpi, myRole, onPaid }) {
  const [paid, setPaid] = useState(false);
  const [waitingOther, setWaitingOther] = useState(false);
  const p1paid = game.p1_paid;
  const p2paid = game.p2_paid;

  const myPayField  = myRole === "w" ? "p1_paid" : "p2_paid";
  const oppPayField = myRole === "w" ? "p2_paid" : "p1_paid";
  const oppUpi      = myRole === "w" ? game.player2_upi : game.player1_upi;

  const upiAmt = upiLink(OWNER_UPI, "ChessApp", 10, `Chess entry fee - Room ${game.id}`);

  const handleConfirm = async () => {
    setPaid(true);
    await supabase.from("games").update({ [myPayField]: true }).eq("id", game.id);
    setWaitingOther(true);
  };

  useEffect(() => {
    const ch = supabase.channel("pay_" + game.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${game.id}` },
        payload => {
          const d = payload.new;
          if (d.p1_paid && d.p2_paid) onPaid(d);
        })
      .subscribe();
    const interval = setInterval(async () => {
      const { data } = await supabase.from("games").select("*").eq("id", game.id).single();
      if (data && data.p1_paid && data.p2_paid) { clearInterval(interval); onPaid(data); }
    }, 3000);
    return () => { supabase.removeChannel(ch); clearInterval(interval); };
  }, [game.id, onPaid]);

  return (
    <div className="waiting-wrap">
      <div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"var(--gold)"}}>Pay to Play</div>
        <div style={{fontSize:13,color:"var(--dim)",marginTop:4}}>Room {game.id} · Both players must pay ₹10</div>
      </div>

      <div className="section" style={{textAlign:"left"}}>
        <div className="section-label">Your UPI: {myUpi}</div>
        <div className="info-row"><span className="lbl">Entry Fee</span><span className="val">₹10</span></div>
        <div className="info-row"><span className="lbl">Pay To</span><span className="val">{OWNER_UPI}</span></div>
        <div className="info-row"><span className="lbl">Opponent</span><span className="val">{oppUpi}</span></div>
      </div>

      {!paid ? (
        <>
          <a className="gpay-a btn" style={{background:"linear-gradient(135deg,#1557b0,#1a73e8)",boxShadow:"0 4px 20px rgba(26,115,232,0.35)"}} href={upiAmt}>
            <span style={{fontSize:20}}>📱</span> Pay ₹10 Entry Fee via GPay
          </a>
          <div style={{fontSize:12,color:"var(--dim)",textAlign:"center"}}>
            After paying, tap the button below
          </div>
          <button className="btn btn-green" onClick={handleConfirm}>
            ✅ I Have Paid — Ready to Play
          </button>
        </>
      ) : (
        <div style={{textAlign:"center"}}>
          <span className="badge badge-ready">✅ You Paid</span>
          <div style={{fontSize:13,color:"var(--dim)",marginTop:12}}>
            <span className="status-dot"/>Waiting for opponent to pay...
          </div>
        </div>
      )}
    </div>
  );
}

// 4. GAME BOARD
function GameScreen({ game, myRole, onGameOver }) {
  const [board, setBoard] = useState(() => strToBoard(game.board));
  const [turn, setTurn]   = useState(game.turn || "w");
  const [selected, setSel] = useState(null);
  const [legalMvs, setLegal] = useState([]);
  const [lastMove, setLast]  = useState(null);
  const [inCheck, setCheck]  = useState(false);
  const [ended, setEnded]    = useState(false);
  const myTurn = turn === myRole;

  // Subscribe to remote moves
  useEffect(() => {
    const ch = supabase.channel("game_" + game.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${game.id}` },
        payload => {
          const d = payload.new;
          if (d.board) setBoard(strToBoard(d.board));
          if (d.turn)  setTurn(d.turn);
          if (d.last_move) setLast(JSON.parse(d.last_move));
          if (d.status === "done") { setEnded(true); onGameOver(d); }
          const nb = strToBoard(d.board);
          setCheck(isInCheck(nb, d.turn));
        })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [game.id, onGameOver]);

  const handleSquare = useCallback(async (r, c) => {
    if (!myTurn || ended) return;
    const piece = board[r][c];
    if (selected) {
      const isLegal = legalMvs.some(([lr,lc])=>lr===r&&lc===c);
      if (isLegal) {
        const nb = applyMove(board, selected, [r,c]);
        const lm = { piece: board[selected[0]][selected[1]], from: selected, to: [r,c] };
        const nextTurn = turn === "w" ? "b" : "w";
        const check = isInCheck(nb, nextTurn);
        let newStatus = "playing";
        let winner = null;
        if (!hasAny(nb, nextTurn, lm)) {
          newStatus = "done";
          winner = check ? turn : "draw";
        }
        setSel(null); setLegal([]); setBoard(nb); setTurn(nextTurn); setCheck(check);
        await supabase.from("games").update({
          board: boardToStr(nb),
          turn: nextTurn,
          last_move: JSON.stringify(lm),
          status: newStatus,
          winner: winner,
        }).eq("id", game.id);
        if (newStatus === "done") { setEnded(true); onGameOver({ ...game, winner, status: "done", board: boardToStr(nb) }); }
        return;
      }
      if (col(piece) === turn && col(piece) === myRole) {
        setSel([r,c]); setLegal(getLegal(board,r,c,turn,lastMove)); return;
      }
      setSel(null); setLegal([]); return;
    }
    if (col(piece) === turn && col(piece) === myRole) {
      setSel([r,c]); setLegal(getLegal(board,r,c,turn,lastMove));
    }
  }, [board, turn, myRole, myTurn, selected, legalMvs, lastMove, ended, game, onGameOver]);

  const kingPos = inCheck ? findKing(board, turn) : null;
  const p1upi = game.player1_upi;
  const p2upi = game.player2_upi;
  const myUpi = myRole === "w" ? p1upi : p2upi;
  const oppUpi = myRole === "w" ? p2upi : p1upi;

  return (
    <div className="game-wrap">
      {/* Opponent bar */}
      <div className="player-bar">
        <div className="p-info">
          <div className="p-avatar">{myRole==="w"?"♚":"♔"}</div>
          <div><div className="p-upi">{oppUpi}</div><div className="p-role">{myRole==="w"?"Black — Opponent":"White — Opponent"}</div></div>
        </div>
        {turn !== myRole && !ended && <div className="active-dot"/>}
      </div>

      {/* Turn banner */}
      <div className="turn-bar">
        {ended ? "Game Over" : myTurn ? `Your turn ${inCheck?"— CHECK ⚠":""}` : `Opponent's turn${inCheck?" — CHECK ⚠":""}`}
      </div>

      {/* Board */}
      <div className="board-wrap">
        <div className="board">
          {(myRole==="b" ? [...board].reverse() : board).map((row, rIdx) => {
            const actualR = myRole==="b" ? 7-rIdx : rIdx;
            return (myRole==="b" ? [...row].reverse() : row).map((piece, cIdx) => {
              const actualC = myRole==="b" ? 7-cIdx : cIdx;
              const isLight = (actualR+actualC)%2===0;
              const isSel   = selected&&selected[0]===actualR&&selected[1]===actualC;
              const isLegal = legalMvs.some(([lr,lc])=>lr===actualR&&lc===actualC);
              const isCheck = kingPos&&kingPos[0]===actualR&&kingPos[1]===actualC;
              let cls=`sq ${isLight?"light":"dark"}`;
              if(isSel) cls+=" selected";
              else if(isLegal) cls+=" legal";
              if(isCheck) cls+=" check";
              if(isLegal&&piece) cls+=" hp";
              return (
                <div key={`${actualR}${actualC}`} className={cls} onClick={()=>handleSquare(actualR,actualC)}>
                  {piece&&<span className="piece">{PIECES[piece]}</span>}
                  {actualC===0&&<span className="coord-r" style={{color:isLight?"#b58863":"#f0d9b5"}}>{8-actualR}</span>}
                  {actualR===7&&<span className="coord-f" style={{color:isLight?"#b58863":"#f0d9b5"}}>{"abcdefgh"[actualC]}</span>}
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* My bar */}
      <div className="player-bar">
        <div className="p-info">
          <div className="p-avatar">{myRole==="w"?"♔":"♚"}</div>
          <div><div className="p-upi">{myUpi}</div><div className="p-role">{myRole==="w"?"White — You":"Black — You"}</div></div>
        </div>
        {myTurn && !ended && <div className="active-dot"/>}
      </div>
    </div>
  );
}

// 5. WINNER SCREEN
function WinnerScreen({ game, myRole, myUpi, onPlayAgain }) {
  const winner = game.winner;
  const isDraw = winner === "draw";
  const iWon   = winner === myRole;
  const p1upi  = game.player1_upi;
  const p2upi  = game.player2_upi;
  const winnerUpi = winner === "w" ? p1upi : winner === "b" ? p2upi : null;

  const winLink = winnerUpi
    ? upiLink(winnerUpi, "Chess Winner", 16, `Chess winnings Room ${game.id}`)
    : null;
  const feeLink = upiLink(OWNER_UPI, "ChessApp Fee", 4, `Platform fee Room ${game.id}`);

  return (
    <div className="winner-wrap">
      <div>
        <div className="crown">{isDraw?"🤝":iWon?"👑":"😔"}</div>
        <div className="win-title">{isDraw?"Draw!":iWon?"You Won!":"You Lost!"}</div>
        {!isDraw&&<div style={{fontSize:15,color:"var(--dim)",marginTop:4}}>{winnerUpi} wins ₹16</div>}
      </div>

      <div className="pay-card">
        <div style={{fontFamily:"'Playfair Display',serif",color:"var(--gold)",marginBottom:12,fontSize:15}}>Payment Summary</div>
        <div className="info-row"><span className="lbl">{p1upi} paid</span><span className="val">₹10</span></div>
        <div className="info-row"><span className="lbl">{p2upi} paid</span><span className="val">₹10</span></div>
        <div className="info-row"><span className="lbl">Platform fee (₹2×2)</span><span className="val">₹4</span></div>
        {!isDraw&&<div className="info-row hi"><span className="lbl">{winnerUpi} receives</span><span className="val">₹16</span></div>}
        {isDraw&&<div className="info-row hi"><span className="lbl">Each player refund</span><span className="val">₹9</span></div>}
      </div>

      {/* Only show pay buttons if you are the admin/owner — in real use, owner pays winner */}
      {winLink && (
        <a className="gpay-a" style={{background:"linear-gradient(135deg,#1557b0,#1a73e8)",boxShadow:"0 4px 20px rgba(26,115,232,.35)"}} href={winLink}>
          <span style={{fontSize:20}}>📱</span> Pay ₹16 to {winnerUpi}
        </a>
      )}
      <a className="gpay-a" style={{background:"linear-gradient(135deg,#1a6b3a,#27ae60)",boxShadow:"0 4px 20px rgba(39,174,96,.35)"}} href={feeLink}>
        <span style={{fontSize:20}}>💼</span> Pay ₹4 Platform Fee
      </a>

      <div style={{fontSize:12,color:"var(--dim)",textAlign:"center",lineHeight:1.7}}>
        Show winner this screen to confirm payment.<br/>
        Platform fee goes to: <strong style={{color:"var(--text)"}}>{OWNER_UPI}</strong>
      </div>

      <button className="btn btn-ghost" onClick={onPlayAgain}>Play Again</button>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("lobby");
  const [session, setSession] = useState(null); // { code, upi, role, game }

  const handleCreated = ({ code, upi, role }) => {
    setSession({ code, upi, role, game: null });
    setScreen("waiting");
  };

  const handleJoined = ({ code, upi, role, p1upi }) => {
    setSession({ code, upi, role, game: null, p1upi });
    setScreen("payment");
    // fetch full game
    supabase.from("games").select("*").eq("id", code).single().then(({ data }) => {
      if (data) setSession(s => ({ ...s, game: data }));
    });
  };

  const handleReady = (gameData) => {
    setSession(s => ({ ...s, game: gameData }));
    setScreen("payment");
  };

  const handlePaid = (gameData) => {
    // update status to playing
    supabase.from("games").update({ status: "playing" }).eq("id", gameData.id).then(() => {
      setSession(s => ({ ...s, game: { ...gameData, status: "playing" } }));
      setScreen("game");
    });
  };

  const handleGameOver = (gameData) => {
    setSession(s => ({ ...s, game: gameData }));
    setScreen("winner");
  };

  const handlePlayAgain = () => {
    setSession(null);
    setScreen("lobby");
  };

  // For waiting screen: also listen for payment screen trigger
  useEffect(() => {
    if (screen === "waiting" && session?.code) {
      supabase.from("games").select("*").eq("id", session.code).single().then(({ data }) => {
        if (data && (data.status === "payment" || data.status === "playing")) {
          setSession(s => ({ ...s, game: data }));
          setScreen("payment");
        }
      });
    }
  }, [screen, session?.code]);

  return (
    <>
      <style>{S}</style>
      <div className="app">
        <div className="logo">♟ CHECKMATE</div>
        <div className="tagline">Real Stakes · Real Chess</div>

        {screen === "lobby"   && <LobbyScreen onCreated={handleCreated} onJoined={handleJoined} />}
        {screen === "waiting" && session && <WaitingScreen code={session.code} upi={session.upi} onReady={handleReady} />}
        {screen === "payment" && session?.game && (
          <PaymentScreen game={session.game} myUpi={session.upi} myRole={session.role} onPaid={handlePaid} />
        )}
        {screen === "game" && session?.game && (
          <GameScreen game={session.game} myRole={session.role} onGameOver={handleGameOver} />
        )}
        {screen === "winner" && session?.game && (
          <WinnerScreen game={session.game} myRole={session.role} myUpi={session.upi} onPlayAgain={handlePlayAgain} />
        )}
      </div>
    </>
  );
}
