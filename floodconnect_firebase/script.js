import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIJZ2rTPoTBFvUfo7lvGoPXIHclhbd4f0",
  authDomain: "floodconnect-23586.firebaseapp.com",
  projectId: "floodconnect-23586",
  storageBucket: "floodconnect-23586.firebasestorage.app",
  messagingSenderId: "502184222194",
  appId: "1:502184222194:web:a7c521e0f4df5f72785f6b"
};

const firebaseApp = initializeApp(firebaseConfig);
const cloudDb = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const cloudDoc = doc(cloudDb, "appData", "main");

const STORAGE_KEY = "floodconnect_demo_v1";
const $ = (id) => document.getElementById(id);
const today = new Date();
$("today-date").textContent = today.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});

function seedData(){
  return {
    families:[
      {id:"FC-2026-001",contact:"Asha Verma",phone:"9876543210",area:"Green Park",members:["Asha Verma","Rohan Verma","Meera Verma"],created:new Date().toISOString()},
      {id:"FC-2026-002",contact:"Imran Khan",phone:"9876501234",area:"River Road",members:["Imran Khan","Sara Khan"],created:new Date(Date.now()-3600000).toISOString()}
    ],
    missing:[
      {id:"MR-001",familyId:"FC-2026-001",name:"Rohan Verma",age:19,location:"River Road",details:"Blue jacket",status:"Missing"},
      {id:"MR-002",familyId:"FC-2026-002",name:"Sara Khan",age:16,location:"Old Bus Stand",details:"",status:"Missing"}
    ],
    rescued:[
      {id:"RR-001",name:"Rohan Verma",age:19,location:"North Relief Point",camp:"Central Relief Camp",team:"Team Alpha",status:"Awaiting verification"},
      {id:"RR-002",name:"Anil Kumar",age:42,location:"School Shelter",camp:"School Relief Camp",team:"Team Bravo",status:"Safe"}
    ],
    camps:[
      {id:"CP-001",name:"Central Relief Camp",location:"Ambala City",capacity:250,occupied:138},
      {id:"CP-002",name:"School Relief Camp",location:"Rajpura Road",capacity:150,occupied:92},
      {id:"CP-003",name:"Community Relief Camp",location:"Green Park",capacity:100,occupied:46}
    ],
    matches:{}
  };
}
function loadData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||seedData()}catch(e){return seedData()}}
let db=loadData();
let cloudReady=false;
let applyingRemote=false;
function setConnectionStatus(message, state=""){
  const el=$("connection-status");
  if(el){el.innerHTML=`<i></i> ${esc(message)}`;el.dataset.state=state;}
}
function save(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
  renderAll();
  if(cloudReady && !applyingRemote){
    setDoc(cloudDoc,db).catch(err=>{
      console.error("Firebase save failed:",err);
      setConnectionStatus("Firebase save failed · check rules", "error");
    });
  }
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function pill(status){let cls=status.toLowerCase().includes("missing")?"missing":status.toLowerCase().includes("reunit")?"reunited":status.toLowerCase().includes("rescue")||status.toLowerCase().includes("await")?"rescued":status.toLowerCase().includes("review")?"review":"safe";return `<span class="status-pill ${cls}">${esc(status)}</span>`}
function showRole(role){
  document.querySelectorAll(".role-view").forEach(v=>v.classList.add("hidden"));
  document.querySelectorAll(".role-button").forEach(b=>b.classList.toggle("active",b.dataset.role===role));
  const view=$(role+"-view");if(view)view.classList.remove("hidden");
  $("matches-view").classList.add("hidden");$("camps-view").classList.add("hidden");
  const titles={admin:"Operations overview",family:"Family services",rescue:"Rescue team workspace"};
  $("page-title").textContent=titles[role]||"Operations overview";
  $("top-eyebrow").textContent=role==="admin"?"DISASTER RESPONSE NETWORK":role==="family"?"FAMILY SERVICES":"FIELD OPERATIONS";
  if(role==="admin")renderAdmin();if(role==="family")renderFamilyLookup();if(role==="rescue")renderRescue();
}
function showSpecial(which){
  document.querySelectorAll(".role-view").forEach(v=>v.classList.add("hidden"));
  $(which+"-view").classList.remove("hidden");
  document.querySelectorAll(".role-button").forEach(b=>b.classList.toggle("active",b.dataset.role==="admin"));
  $("page-title").textContent=which==="matches"?"Smart match review":"Rescue camp directory";
  $("top-eyebrow").textContent="DISASTER RESPONSE NETWORK";
  if(which==="matches")renderMatches();else renderCamps();
}
document.querySelectorAll(".role-button").forEach(b=>b.addEventListener("click",()=>showRole(b.dataset.role)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showRole(b.dataset.goto)));
$("go-matches").addEventListener("click",()=>showSpecial("matches"));
$("reset-demo").addEventListener("click",()=>{if(confirm("Reset all FloodConnect demo records to the original sample data?")){db=seedData();save();showRole("admin")}});
function renderAdmin(){
  const people=db.families.reduce((n,f)=>n+f.members.length,0);
  $("stat-people").textContent=people;
  $("stat-missing").textContent=db.missing.filter(m=>m.status==="Missing").length;
  $("stat-rescued").textContent=db.rescued.length;
  $("stat-camps").textContent=db.camps.length;
  const statuses=[["Registered",people,"#4384e8"],["Missing",db.missing.filter(x=>x.status==="Missing").length,"#d96a68"],["Rescued",db.rescued.length,"#28a36a"],["Reunited",db.missing.filter(x=>x.status==="Reunited").length,"#8c6cc8"]];
  const max=Math.max(1,...statuses.map(s=>s[1]));
  $("status-bars").innerHTML=statuses.map(s=>`<div class="bar-row"><span>${s[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(s[1]?5:0,s[1]/max*100)}%;background:${s[2]}"></div></div><b class="bar-count">${s[1]}</b></div>`).join("");
  $("family-table").innerHTML=db.families.slice().reverse().slice(0,5).map(f=>`<tr><td class="id-text">${esc(f.id)}</td><td>${esc(f.contact)}</td><td>${f.members.length}</td><td>${new Date(f.created).toLocaleDateString()}</td><td>${pill(db.missing.some(m=>m.familyId===f.id&&m.status==="Missing")?"Needs attention":"Registered")}</td></tr>`).join("")||emptyRow(5,"No families registered yet");
  const matches=getMatches().slice(0,2);
  $("match-preview").innerHTML=matches.length?matches.map(m=>`<div class="mini-match"><div><b>${esc(m.missing.name)} ↔ ${esc(m.rescued.name)}</b><small>${esc(m.missing.familyId)} · ${esc(m.rescued.location)}</small></div><span class="match-score">${m.score}%</span></div>`).join(""):`<div class="empty-state">No possible matches found yet.</div>`;
  $("camp-preview").innerHTML=db.camps.slice(0,3).map(c=>`<div class="camp-row"><div><b>${esc(c.name)}</b><small>${esc(c.location)}</small></div><span class="match-score">${c.occupied}/${c.capacity}</span></div>`).join("")||`<div class="empty-state">No camps added.</div>`;
}
function emptyRow(n,msg){return `<tr><td colspan="${n}" style="text-align:center;color:#9aa5b3;padding:20px">${msg}</td></tr>`}
function renderFamilyLookup(){ $("lookup-result").className="lookup-result empty-state";$("lookup-result").textContent="Your family information will appear here after you search."; }
function renderRescue(){
  $("rescued-camp").innerHTML=db.camps.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("")||`<option value="">Add a camp first</option>`;
  $("rescued-table").innerHTML=db.rescued.slice().reverse().map(r=>`<tr><td class="id-text">${esc(r.id)}</td><td>${esc(r.name)}</td><td>${r.age}</td><td>${esc(r.location)}</td><td>${esc(r.camp)}</td><td>${pill(r.status)}</td></tr>`).join("")||emptyRow(6,"No rescued records yet");
}
function getMatches(){
  const out=[];
  db.missing.filter(m=>m.status==="Missing").forEach(m=>{
    db.rescued.filter(r=>r.status!=="Reunited").forEach(r=>{
      const same=m.name.trim().toLowerCase()===r.name.trim().toLowerCase();
      const ageDiff=Math.abs(Number(m.age)-Number(r.age));
      if(same||ageDiff<=2&&m.name.trim().toLowerCase().split(" ")[0]===r.name.trim().toLowerCase().split(" ")[0]){
        out.push({missing:m,rescued:r,score:same?98:78});
      }
    });
  });return out;
}
function renderMatches(){
  const matches=getMatches();
  $("all-matches").innerHTML=matches.length?matches.map((m,i)=>`<div class="review-card"><div class="review-top"><b>Possible match ${i+1}</b><span class="soft-badge purple-badge">${m.score}% DEMO SIMILARITY</span></div><div class="match-pair"><div class="match-person"><small>MISSING PERSON · ${esc(m.missing.id)}</small><b>${esc(m.missing.name)}</b><small>Age ${m.missing.age} · ${esc(m.missing.location)}</small><small>Family ID: ${esc(m.missing.familyId)}</small></div><div class="match-arrow">↔</div><div class="match-person"><small>RESCUED PERSON · ${esc(m.rescued.id)}</small><b>${esc(m.rescued.name)}</b><small>Age ${m.rescued.age} · ${esc(m.rescued.location)}</small><small>Camp: ${esc(m.rescued.camp)}</small></div></div><div class="review-actions"><button class="dismiss-btn" data-dismiss="${esc(m.missing.id)}|${esc(m.rescued.id)}">Dismiss suggestion</button><button class="verify-btn" data-verify="${esc(m.missing.id)}|${esc(m.rescued.id)}">Confirm verified identity</button></div></div>`).join(""):`<div class="empty-state">No possible matches right now. Add a missing report and rescued-person record with similar details to demonstrate matching.</div>`;
  $("all-matches").querySelectorAll("[data-verify]").forEach(b=>b.addEventListener("click",()=>verifyMatch(b.dataset.verify)));
  $("all-matches").querySelectorAll("[data-dismiss]").forEach(b=>b.addEventListener("click",()=>{const [mid,rid]=b.dataset.dismiss;db.matches[mid+"_"+rid]="dismissed";renderMatches()}));
}
function verifyMatch(key){
  const [mid,rid]=key.split("|");
  if(!confirm("Confirm that an authorised person has independently verified this identity? This demo will mark the family record as reunited."))return;
  const m=db.missing.find(x=>x.id===mid),r=db.rescued.find(x=>x.id===rid);
  if(m&&r){m.status="Reunited";r.status="Reunited";save();renderMatches();alert("Demo record updated to Reunited.");}
}
function renderCamps(){
  $("all-camps").innerHTML=db.camps.map(c=>{const pct=Math.min(100,Math.round(c.occupied/c.capacity*100));return `<article class="camp-card"><h3>${esc(c.name)}</h3><p>⌖ ${esc(c.location)}</p><div class="capacity-line"><span>Occupancy</span><b>${c.occupied} / ${c.capacity}</b></div><div class="capacity-track"><div class="capacity-fill" style="width:${pct}%"></div></div><p style="margin-top:9px">${pct}% reported capacity used</p></article>`}).join("")||`<div class="empty-state">No camps added yet.</div>`;
}
$("family-form").addEventListener("submit",e=>{
  e.preventDefault();const f=new FormData(e.target),members=String(f.get("members")).split(",").map(x=>x.trim()).filter(Boolean);
  if(!members.length){alert("Please enter at least one family member.");return}
  const id="FC-2026-"+String(Date.now()).slice(-5);
  db.families.push({id,contact:f.get("contact").trim(),phone:f.get("phone").trim(),area:f.get("area").trim(),members,created:new Date().toISOString()});
  save();$("family-success").classList.remove("hidden");$("family-success").innerHTML=`<b>Family registered successfully</b><br>Your demo Family ID is <b>${id}</b>. Save this ID to submit a missing-person report or check family status.`;
  e.target.reset();
});
$("missing-form").addEventListener("submit",e=>{
  e.preventDefault();const f=new FormData(e.target),family=db.families.find(x=>x.id.toLowerCase()===String(f.get("familyId")).trim().toLowerCase());
  if(!family){alert("Family ID not found. Register the family first or check the ID.");return}
  const name=String(f.get("name")).trim();
  if(!family.members.some(x=>x.toLowerCase()===name.toLowerCase())){if(!confirm("This name is not in the registered member list. Submit the report anyway?"))return}
  const id="MR-"+String(Date.now()).slice(-6);
  db.missing.push({id,familyId:family.id,name,age:Number(f.get("age")),location:f.get("location").trim(),details:f.get("details").trim(),status:"Missing"});
  save();$("missing-success").classList.remove("hidden");$("missing-success").textContent=`Missing report ${id} has been saved in this demo. Family ID: ${family.id}.`;
  e.target.reset();
});
$("lookup-form").addEventListener("submit",e=>{
  e.preventDefault();const id=String(new FormData(e.target).get("familyId")).trim().toLowerCase(),f=db.families.find(x=>x.id.toLowerCase()===id);
  const out=$("lookup-result");out.className="lookup-result";
  if(!f){out.innerHTML=`<div class="empty-state">No family found with that ID. Please check and try again.</div>`;return}
  const reports=db.missing.filter(m=>m.familyId===f.id);
  out.innerHTML=`<div class="lookup-card"><h4>${esc(f.contact)} · ${esc(f.id)}</h4><div style="font-size:10px;color:#7b899a">${esc(f.area)} · Registered ${new Date(f.created).toLocaleDateString()}</div><div class="member-chips">${f.members.map(n=>`<span class="member-chip">${esc(n)}</span>`).join("")}</div><hr style="border:0;border-top:1px solid #e5ebf3;margin:13px 0"><b style="font-size:10px">Family updates</b>${reports.length?reports.map(m=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #edf1f5;font-size:10px"><span>${esc(m.name)} · ${esc(m.location)}</span>${pill(m.status)}</div>`).join(""):`<p style="font-size:10px;color:#8b98a8;margin:8px 0 0">No missing-person reports for this family.</p>`}</div>`;
});
$("rescued-form").addEventListener("submit",e=>{
  e.preventDefault();const f=new FormData(e.target);
  const id="RR-"+String(Date.now()).slice(-6);
  db.rescued.push({id,name:f.get("name").trim(),age:Number(f.get("age")),location:f.get("location").trim(),camp:f.get("camp"),team:f.get("team").trim(),status:"Awaiting verification"});
  save();$("rescued-success").classList.remove("hidden");$("rescued-success").textContent=`Rescued-person record ${id} saved. Possible matches can now be reviewed by an authorised administrator.`;
  e.target.reset();renderRescue();
});
$("camp-form").addEventListener("submit",e=>{
  e.preventDefault();const f=new FormData(e.target),capacity=Number(f.get("capacity")),occupied=Number(f.get("occupied"));
  if(occupied>capacity){alert("Occupancy cannot be greater than total capacity.");return}
  db.camps.push({id:"CP-"+String(Date.now()).slice(-5),name:f.get("name").trim(),location:f.get("location").trim(),capacity,occupied});
  save();$("camp-success").classList.remove("hidden");$("camp-success").textContent="Rescue camp added to the demo directory.";e.target.reset();renderRescue();
});
$("refresh-matches").addEventListener("click",renderMatches);
$("export-data").addEventListener("click",()=>{
  const rows=[["Family ID","Contact","Phone","Area","Members"],...db.families.map(f=>[f.id,f.contact,f.phone,f.area,f.members.join("; ")])];
  const csv=rows.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="floodconnect-families.csv";a.click();URL.revokeObjectURL(url);
});
function renderAll(){renderAdmin();renderRescue();renderCamps();if(!$("matches-view").classList.contains("hidden"))renderMatches()}
renderAll();showRole("admin");

async function connectFirebase(){
  try{
    setConnectionStatus("Connecting to Firebase…");
    await signInAnonymously(auth);
    const firstRead = await getDoc(cloudDoc);
    if(firstRead.exists()){
      db = firstRead.data();
    }else{
      await setDoc(cloudDoc, db);
    }
    cloudReady = true;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
    renderAll();
    showRole("admin");
    setConnectionStatus("Firebase connected · Demo data sync on", "online");
    onSnapshot(cloudDoc, snapshot=>{
      if(snapshot.exists()){
        applyingRemote = true;
        db = snapshot.data();
        localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
        renderAll();
        applyingRemote = false;
      }
    }, error=>{
      applyingRemote = false;
      console.error("Firebase live update failed:",error);
      setConnectionStatus("Live sync error · check Firestore rules", "error");
    });
  }catch(error){
    console.error("Firebase connection failed:",error);
    setConnectionStatus("Offline fallback · Firebase setup needed", "error");
    alert("FloodConnect could not connect to Firebase. The dashboard will still run with browser demo data. Check that Anonymous sign-in is enabled and Firestore rules are published. See README.txt for steps.");
  }
}
connectFirebase();
