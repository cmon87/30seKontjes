import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendEmailVerification
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc,
  deleteDoc, onSnapshot, serverTimestamp, deleteField
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDV9gq68j8WDvXSycZ0dAPRm023gjG8MII",
  authDomain: "sekontjes.firebaseapp.com",
  databaseURL: "https://sekontjes-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sekontjes",
  storageBucket: "sekontjes.firebasestorage.app",
  messagingSenderId: "963419535029",
  appId: "1:963419535029:web:70d6d1e59b99f6dca8f0fc",
  measurementId: "G-8FRGCMTP0V"
};
const ADMIN_EMAIL = "simon.reede@gmail.com";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const TEAMNAMEN = ["Team Blauw", "Team Geel", "Team Turkoois", "Team Paars"];
const CODE_TEKENS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
let selectedCode = null;
let selectedRoom = null;
let stopRoom = null;

const $ = id => document.getElementById(id);
function report(text, error=false){ $("status").textContent=text; $("status").className="status "+(error?"error":"ok"); }
function adminUser(user){ return user && user.email === ADMIN_EMAIL && user.emailVerified; }
function code(){ let c=""; for(let i=0;i<4;i++) c+=CODE_TEKENS[Math.floor(Math.random()*CODE_TEKENS.length)]; return c; }
function shuffle(ids){ for(let i=ids.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [ids[i],ids[j]]=[ids[j],ids[i]]; } return ids; }
function verseBeurt(beurtNummer, teams, dobbelsteen=true){
  const n=Object.keys(teams).length, teamIndex=beurtNummer%n;
  const omschrijverId=teams[teamIndex].spelerIds[Math.floor(beurtNummer/n)%2];
  return {fase:dobbelsteen?"BEURT_WORP":"BEURT_KLAAR",beurtNummer,teamIndex,omschrijverId,worp:0,kaartId:null,kaartKleur:"blauw",startTijd:null,vinkjes:[false,false,false,false,false],afgekeurd:[false,false,false,false,false]};
}
async function register(){
  try{
    if($("email").value.trim().toLowerCase()!==ADMIN_EMAIL) throw new Error("Gebruik het ingestelde admin-e-mailadres.");
    const cred=await createUserWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);
    await sendEmailVerification(cred.user);
    report("Account gemaakt. Open de verificatiemail en log daarna opnieuw in.");
  }catch(e){ report(e.message,true); }
}
async function login(){ try{ await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value); }catch(e){ report(e.message,true); } }
async function loadRooms(){
  try{
    const snap=await getDocs(collection(db,"rooms"));
    const select=$("rooms"); select.innerHTML='<option value="">Selecteer een spel</option>';
    snap.forEach(d=>{ const o=document.createElement("option"); o.value=d.id; o.textContent=`${d.id} · ${d.data().meta?.status||"?"}`; select.appendChild(o); });
    report(`${snap.size} spel(len) gevonden.`);
  }catch(e){ report(e.message,true); }
}
async function createRoom(){
  try{
    let c;
    for(let i=0;i<10;i++){ c=code(); if(!(await getDoc(doc(db,"rooms",c))).exists()) break; }
    await setDoc(doc(db,"rooms",c),{meta:{aangemaakt:serverTimestamp(),status:"LOBBY",hostId:auth.currentUser.uid,adminEmail:ADMIN_EMAIL,instellingen:{dobbelsteen:true,tegenstanderBevestigt:true,finishVakje:35}},spelers:{}});
    $("createdCode").textContent=c; await loadRooms(); $("rooms").value=c; selectRoom(c); report(`Spel ${c} is aangemaakt.`);
  }catch(e){ report(e.message,true); }
}
function selectRoom(c){
  selectedCode=c; if(stopRoom){stopRoom();stopRoom=null;} if(!c){$("roomPanel").classList.add("hidden");return;}
  stopRoom=onSnapshot(doc(db,"rooms",c),snap=>{ if(!snap.exists()){report("Spel bestaat niet meer.",true);loadRooms();return;} selectedRoom=snap.data(); renderRoom(); },e=>report(e.message,true));
}
function renderRoom(){
  $("roomPanel").classList.remove("hidden"); $("roomCode").textContent=selectedCode;
  $("roomMeta").textContent=`Status: ${selectedRoom.meta.status} · ${Object.keys(selectedRoom.spelers||{}).length} speler(s)`;
  const wrap=$("players"); wrap.innerHTML="";
  Object.entries(selectedRoom.spelers||{}).forEach(([uid,p])=>{
    const row=document.createElement("div"); row.className="player";
    const name=document.createElement("div"); name.innerHTML=`<strong>${p.naam||"Speler"}</strong><div class="small">${p.online===false?"offline":"online"}</div>`;
    const select=document.createElement("select"); select.innerHTML='<option value="">Geen team</option>'+TEAMNAMEN.map((n,i)=>`<option value="${i}" ${p.team===i?"selected":""}>${n}</option>`).join("");
    select.onchange=()=>updateDoc(doc(db,"rooms",selectedCode),{[`spelers.${uid}.team`]:select.value===""?null:Number(select.value)});
    const remove=document.createElement("button"); remove.textContent="×"; remove.className="red"; remove.onclick=()=>updateDoc(doc(db,"rooms",selectedCode),{[`spelers.${uid}`]:deleteField()});
    row.append(name,select,remove); wrap.appendChild(row);
  });
}
async function startGame(){
  try{
    const spelers=selectedRoom.spelers||{}, teams={}; let idx=0;
    for(let t=0;t<4;t++){
      const ids=Object.entries(spelers).filter(([,p])=>p.team===t).map(([id])=>id);
      if(ids.length===2) teams[idx++]={naam:TEAMNAMEN[t],kleurIndex:t,positie:0,spelerIds:ids};
      else if(ids.length>0) throw new Error(`${TEAMNAMEN[t]} moet precies 2 spelers hebben.`);
    }
    if(idx<2) throw new Error("Er zijn minimaal twee volledige teams nodig.");
    const cards=(await (await fetch("../kaarten.json")).json()).kaarten;
    await updateDoc(doc(db,"rooms",selectedCode),{"meta.status":"SPEL","meta.winnaar":null,teams,stapel:{volgorde:shuffle(cards.map(k=>k.id)),pointer:0},beurt:verseBeurt(0,teams,selectedRoom.meta.instellingen.dobbelsteen)});
    report("Spel gestart.");
  }catch(e){ report(e.message,true); }
}
async function toLobby(){ try{await updateDoc(doc(db,"rooms",selectedCode),{"meta.status":"LOBBY","meta.winnaar":null});report("Lobby geopend.");}catch(e){report(e.message,true);} }
async function reset(){
  try{ await updateDoc(doc(db,"rooms",selectedCode),{"meta.status":"LOBBY","meta.winnaar":null,beurt:deleteField(),stapel:deleteField(),teams:deleteField()}); report("Spel teruggezet en scores gewist."); }
  catch(e){report(e.message,true);}
}
async function removeRoom(){ if(!confirm(`Spel ${selectedCode} definitief verwijderen?`))return; try{await deleteDoc(doc(db,"rooms",selectedCode));selectedCode=null;$("roomPanel").classList.add("hidden");await loadRooms();report("Spel verwijderd.");}catch(e){report(e.message,true);} }

$("login").onclick=login; $("register").onclick=register; $("logout").onclick=()=>signOut(auth); $("create").onclick=createRoom; $("refresh").onclick=loadRooms; $("rooms").onchange=e=>selectRoom(e.target.value); $("start").onclick=startGame; $("lobby").onclick=toLobby; $("reset").onclick=reset; $("delete").onclick=removeRoom;
onAuthStateChanged(auth,user=>{
  if(!user){$("loginCard").classList.remove("hidden");$("adminPanel").classList.add("hidden");return;}
  if(!adminUser(user)){ $("loginCard").classList.remove("hidden");$("adminPanel").classList.add("hidden"); report(user.email===ADMIN_EMAIL?"Verifieer eerst je e-mailadres en log opnieuw in.":"Dit account heeft geen beheerrechten.",true);return; }
  $("loginCard").classList.add("hidden");$("adminPanel").classList.remove("hidden");$("account").textContent=`Ingelogd als ${user.email}`;loadRooms();
});
