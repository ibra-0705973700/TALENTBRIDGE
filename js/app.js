// TalentBridge - Complete Fixed app.js
let S = { user: null, prof: {}, apps: [], reqs: [], msgs: {}, extra: [], notes: [] };
const DEMO_MODE = true;
const LOGO = "🌉 ";
const JOBS = [
  { id: 1, t: "Junior Web Developer", org: "Demo Tech", loc: "Remote", type: "Job", sk: ["html", "css", "javascript"] },
  { id: 2, t: "Graphic Designer", org: "Demo Studio", loc: "Dadaab", type: "Job", sk: ["design", "canva"] },
  { id: 3, t: "Nursing Intern", org: "Demo Health", loc: "Nairobi", type: "Internship", sk: ["nursing", "care"] },
  { id: 4, t: "Business Assistant", org: "Demo NGO", loc: "Remote", type: "Internship", sk: ["business", "communication"] },
];
const MENT = [
  { id: "m1", n: "Amina Hassan", f: "Tech Mentor", b: "Helps with web development and CVs.", sk: ["html", "javascript"] },
  { id: "m2", n: "John Ochieng", f: "Business Mentor", b: "Helps with business and interviews.", sk: ["business"] },
];
const CANDS = [
  { n: "Fatuma Ali", sk: ["design", "canva"] },
  { n: "Mohamed Yusuf", sk: ["html", "javascript"] },
];
const FAQ = [
  ["Is this a real job site?", "No. This is a demo prototype for the hackathon. All jobs and mentors are sample data."],
  ["Who is it for?", "Skilled refugees, mentors, and employers."],
  ["Is it free?", "Yes, creating a profile is free."],
];

function init(){ return { user:null, prof:{}, apps:[], reqs:[], msgs:{}, extra:[], notes:[] }; }
function save(){ localStorage.setItem("tb_state", JSON.stringify(S)); }
function load(){ try{ const d = JSON.parse(localStorage.getItem("tb_state")||"null"); if(d) S = Object.assign(init(), d); }catch(e){} }
async function api(){ return S; }
function setToken(){}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const all = () => JOBS.concat(S.extra);
const skills = () => (S.prof.skills||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
const score = j => { const m = skills(); return j.sk.length ? Math.round(100*j.sk.filter(x=>m.includes(x)).length/j.sk.length) : 0; };
const v = id => (document.getElementById(id)||{}).value || '';
function toast(m,e){ const t=document.getElementById('toast'); if(!t) return; t.textContent=m; t.className=e?'err':''; t.style.display='block'; clearTimeout(toast.h); toast.h=setTimeout(()=>t.style.display='none',3000); }
function togglePw(){ const p=document.getElementById('ap'); const b=document.getElementById('pwb'); if(p.type==='password'){p.type='text';b.textContent='Hide';} else {p.type='password';b.textContent='Show';} }

const PAGES={home:'Home',jobs:'Jobs',internships:'Internships',mentors:'Mentors',matching:'Matches',applications:'Applications',messages:'Messages',dashboard:'Dashboard',profile:'Profile',employer:'Employer',admin:'Admin',about:'About',auth:'Sign in'};
function navHtml(p){ const u=S.user; let ks=['jobs','internships','mentors','about']; if(u) ks=['dashboard','profile','jobs','internships','mentors','matching','applications','messages'].concat(u.role==='Employer'?['employer']:[],u.role==='Admin'?['admin']:[],['about']); return `<a class="logo" href="#home">${LOGO}TalentBridge</a>`+ks.map(k=>`<a class="l ${p===k?'on':''}" href="#${k}">${PAGES[k]}</a>`).join('')+(u?`<a class="l" href="#auth" onclick="out()">Log out</a>`:`<a class="l" href="#auth">Sign in</a>`); }
function out(){ S=init(); save(); location.hash='#home'; route(); }

const R={
home(){ return `<section class="hero"><div><h1>Your talent already crosses borders. Let’s connect it to work.</h1><p>TalentBridge links skilled refugees with employers, mentors, internships and professional networks.</p><a class="btn" href="#auth">Create your profile</a> <a class="btn o" href="#jobs">Browse opportunities</a></div></section><div class="note">Demonstration prototype: all jobs, employers and mentors are sample data.</div><div class="grid">${[['Profile and portfolio','Describe your skills once, in one place.'],['Skills matching','See which opportunities fit your skills best.'],['Mentorship','Send a request to a mentor in your field.'],['Application tracking','Follow every application from sent to decision.']].map(c=>`<div class="card"><h3>${c[0]}</h3><p>${c[1]}</p></div>`).join('')}</div><h2 style="margin:2rem 0 .5rem">How it works</h2><div class="grid"><div class="card"><h3>1. Create your profile</h3><p>Add your skills and experience.</p></div><div class="card"><h3>2. Find your match</h3><p>Browse opportunities and see your match %.</p></div><div class="card"><h3>3. Connect and apply</h3><p>Apply, request a mentor, and track every step.</p></div></div>`; },
auth(){ return `<div class="card" style="max-width:440px;margin:auto"><h2>Sign in or register</h2><p>Create a free account to build your profile and apply.</p><p><small>Demo mode: your account is saved in this browser only.</small></p><label>Full name</label><input id="an"><label>Email</label><input id="ae" type="email"><label>Password (8+ characters)</label><div style="display:flex;gap:.5rem"><input id="ap" type="password"><button type="button" class="btn o" id="pwb" onclick="togglePw()">Show</button></div><label>Account type</label><select id="ar"><option>Job seeker</option><option>Employer</option><option>Mentor</option></select><br><br><button class="btn" onclick="doAuth('login')">Sign in</button> <button class="btn o" onclick="doAuth('register')">Create account</button></div>`; },
dashboard(){ const m=all().map(j=>score(j)).filter(x=>x>0).length; const pc=Math.min(100,['name','headline','country','skills','bio'].filter(k=>S.prof[k]).length*20); return `<h2>Welcome, ${esc(S.user.name)}</h2>${pc<100?'<div class="note">Start with: 1) complete your <a href="#profile">profile</a>, 2) browse <a href="#jobs">jobs</a>, 3) request a <a href="#mentors">mentor</a>.</div>':''}<div class="grid"><div class="card"><h3>Profile ${pc}%</h3><div class="bar"><i style="width:${pc}%"></i></div><p><a href="#profile">Edit profile</a></p></div><div class="card"><h3>${S.apps.length} applications</h3><a href="#applications">Track them</a></div><div class="card"><h3>${m} matches</h3><a href="#matching">See matches</a></div><div class="card"><h3>${S.reqs.length} mentor requests</h3><a href="#mentors">Find a mentor</a></div></div><h3 style="margin-top:1.5rem">Notifications</h3>${S.notes.slice().reverse().map(n=>`<div class="card" style="margin-bottom:.5rem">${esc(n)}</div>`).join('')||'<p>No notifications yet.</p>'}`; },
profile(){ const p=S.prof; return `<div class="card" style="max-width:640px"><h2>Professional profile</h2><label>Full name</label><input id="p_name" value="${esc(p.name||S.user.name||'')}"><label>Headline</label><input id="p_headline" value="${esc(p.headline||'')}"><label>Country of origin</label><input id="p_country" value="${esc(p.country||'')}"><label>Skills, separated by commas</label><input id="p_skills" value="${esc(p.skills||'')}"><label>Experience summary</label><textarea id="p_bio" rows="4">${esc(p.bio||'')}</textarea><br><button class="btn" onclick="saveProf()">Save profile</button></div>`; },
jobs(){ return list('Job'); }, internships(){ return list('Internship'); },
mentors(){ const q=(v('mq')||'').toLowerCase(); return `<h2>Mentor directory</h2><div class="note">Demo mentors only. Sample profiles, not real people.</div><input id="mq" placeholder="Search by field or skill" value="${esc(q)}" oninput="go()"><div class="grid">${MENT.filter(m=>(m.f+m.sk.join()).toLowerCase().includes(q)).map(m=>`<div class="card"><span class="demo">Demo profile</span><h3>${m.n}</h3><p>${m.f}</p><p>${m.b}</p>${m.sk.map(s=>`<span class="tag">${s}</span>`).join('')}<br><button class="btn" onclick="book('${m.id}')">Request mentorship</button></div>`).join('')||'<p>No mentors match.</p>'}</div>`; },
matching(){ const m=all().map(j=>({j,s:score(j)})).sort((a,b)=>b.s-a.s); return `<h2>Skills-based matches</h2>${skills().length?'':'<div class="note">Add skills to your <a href="#profile">profile</a> to see scores.</div>'}<div class="grid">${m.map(x=>card(x.j,x.s)).join('')}</div>`; },
applications(){ return `<h2>Application tracking</h2>${S.apps.length?`<div class="card scroll"><table><tr><th>Role</th><th>Applied</th><th>Status</th><th></th></tr>${S.apps.map(a=>{const j=all().find(x=>x.id===a.jid)||{t:'Removed listing'}; return `<tr><td>${esc(j.t)}</td><td>${a.d}</td><td><span class="st">${a.st}</span></td><td>${a.st!=='Withdrawn'?`<button class="btn o" onclick="wd(${a.id})">Withdraw</button>`:''}</td></tr>`}).join('')}</table></div>`:'<div class="card">No applications yet. <a href="#jobs">Browse jobs</a> to apply.</div>'}`; },
messages(){ const t=S.msgs; return `<h2>Messages</h2><div class="note">Demo: messages are saved locally and nobody replies.</div><div class="card"><label>To</label><select id="mt">${MENT.map(m=>`<option value="${m.id}">${m.n}</option>`).join('')}</select><label>Message</label><textarea id="mb" rows="3"></textarea><br><button class="btn" onclick="send()">Send message</button></div>${Object.keys(t).map(k=>`<div class="card" style="margin-top:1rem"><h3>${esc((MENT.find(m=>m.id===k)||{}).n)}</h3>${t[k].map(x=>`<div class="msg me">${esc(x)}</div>`).join('')}</div>`).join('')}`; },
employer(){ const q=(v('cq')||'').toLowerCase(); const c=CANDS.concat(S.prof.skills?[{n:S.user.name+' (you)',sk:skills()}]:[]); return `<h2>Employer dashboard</h2><div class="card" style="margin-bottom:1rem"><h3>Post a demo listing</h3><label>Title</label><input id="lt"><label>Required skills, separated by commas</label><input id="ls"><label>Type</label><select id="lk"><option>Job</option><option>Internship</option><option>Fellowship</option></select><br><br><button class="btn" onclick="post()">Publish listing</button></div><h3>Talent search</h3><input id="cq" placeholder="Search by skill" value="${esc(q)}" oninput="go()"><div class="grid">${c.filter(x=>x.sk.join().toLowerCase().includes(q)).map(x=>`<div class="card"><span class="demo">Demo candidate</span><h3>${esc(x.n)}</h3>${x.sk.map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div>`).join('')||'<p>No candidates match.</p>'}</div>`; },
admin(){ return `<h2>Admin dashboard</h2><div class="grid"><div class="card"><h3>${all().length}</h3>listings</div><div class="card"><h3>${S.apps.length}</h3>applications</div><div class="card"><h3>${S.reqs.length}</h3>mentor requests</div></div><h3 style="margin-top:1.5rem">Listings you posted</h3>${S.extra.length?S.extra.map(j=>`<div class="card">${esc(j.t)} <button class="btn o" onclick="rm(${j.id})">Remove</button></div>`).join(''):'<div class="card">None yet.</div>'}`; },
about(){ return `<h2>About TalentBridge</h2><p>Built for the Power Learn Project Mini Hackathon, theme “Unlocking Displaced Talent”. Supports SDG 8, SDG 10 and SDG 17.</p><h3>FAQ</h3>${FAQ.map(f=>`<details class="card" style="margin-bottom:.5rem"><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join('')}<h3>Contact</h3><div class="card" style="max-width:480px"><label>Your email</label><input id="ce" type="email"><label>Message</label><textarea id="cm" rows="3"></textarea><br><button class="btn" onclick="contact()">Send message</button></div>`; }
};

function card(j,s){ const a=S.apps.some(x=>x.jid===j.id&&x.st!=='Withdrawn'); return `<div class="card"><span class="demo">Demo listing</span> <span class="tag">${j.type}</span><h3>${esc(j.t)}</h3><p>${esc(j.org)} · ${esc(j.loc)}</p>${j.sk.map(k=>`<span class="tag">${esc(k)}</span>`).join('')}${s!=null?`<p><strong>${s}% skills match</strong></p><div class="bar"><i style="width:${s}%"></i></div>`:''}<p>${a?'<span class="st">Applied</span>':`<button class="btn" onclick="apply(${j.id})">Apply</button>`}</p></div>`; }
function list(t){ const q=(v('jq')||'').toLowerCase(); const items=all().filter(j=>(t==='Job'?j.type!=='Internship':j.type!=='Job')&&(j.t+j.sk.join()+j.loc).toLowerCase().includes(q)); return `<h2>${t==='Job'?'Job opportunities':'Internships and fellowships'}</h2><div class="note">Demo listings only. Not real vacancies.</div><input id="jq" placeholder="Search by title, skill or place" value="${esc(q)}" oninput="go()"><div class="grid">${items.map(j=>card(j)).join('')||'<p>No opportunities match.</p>'}</div>`; }

function doAuth(mode){
  const name=v('an'), email=v('ae'), pw=v('ap'), role=v('ar')||'Job seeker';
  if(!name || !email || pw.length<8){ toast('Please fill name, email and password 8+ characters', true); return; }
  S.user={ name, email, role: role==='Employer'?'Employer': role==='Mentor'?'Mentor':'Job seeker' };
  if(!S.prof.name) S.prof.name=name;
  S.notes.push('Welcome to TalentBridge, '+name+'!');
  save(); location.hash='#dashboard'; route(); toast('Welcome, '+name);
}
function saveProf(){
  S.prof={ name:v('p_name'), headline:v('p_headline'), country:v('p_country'), skills:v('p_skills'), bio:v('p_bio') };
  save(); toast('Profile saved'); route();
}
function apply(id){ if(!S.user){ location.hash='#auth'; return; } if(S.apps.some(a=>a.jid===id&&a.st!=='Withdrawn')) return; S.apps.push({id:Date.now(), jid:id, d:new Date().toLocaleDateString(), st:'Submitted'}); S.notes.push('Application submitted'); save(); route(); toast('Application submitted'); }
function wd(id){ const a=S.apps.find(x=>x.id===id); if(a) a.st='Withdrawn'; save(); route(); }
function book(mid){ const m=MENT.find(x=>x.id===mid); S.reqs.push({m:m?m.n:mid, msg:'Mentorship request', d:new Date().toLocaleDateString()}); S.notes.push('Mentor request sent to '+(m?m.n:'')); save(); toast('Mentor request sent'); route(); }
function send(){ const to=v('mt'), msg=v('mb'); if(!msg.trim()) return; if(!S.msgs[to]) S.msgs[to]=[]; S.msgs[to].push(msg); save(); route(); toast('Message sent (demo)'); }
function post(){ const t=v('lt'), sk=v('ls').split(',').map(s=>s.trim()).filter(Boolean); if(!t) return toast('Add a title', true); S.extra.push({id:Date.now(), t, org:'You', loc:'Remote', type:v('lk'), sk}); save(); route(); toast('Listing published'); }
function rm(id){ S.extra=S.extra.filter(j=>j.id!==id); save(); route(); }
function contact(){ toast('Message sent. Thank you!'); }

const NEED=['dashboard','profile','applications','messages','matching','employer','admin'];
function go(){ const el=document.activeElement, id=el&&el.id, pos=el&&el.selectionStart; route(); const n=document.getElementById(id); if(n&&n.focus){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(e){} } }
function route(){
  let p=(location.hash||'#home').slice(1); if(!R[p]) p='home';
  if(NEED.includes(p)&&!S.user) p='auth';
  if(p==='employer'&&S.user&&S.user.role!=='Employer'&&S.user.role!=='Admin') p='dashboard';
  if(p==='admin'&&S.user&&S.user.role!=='Admin') p='dashboard';
  const nav=document.getElementById('nav'), app=document.getElementById('app');
  if(nav) nav.innerHTML=navHtml(p);
  if(app) app.innerHTML=R[p]();
  document.title=(PAGES[p]||'Sign in')+' – TalentBridge';
}
addEventListener('hashchange',()=>{ route(); scrollTo(0,0); });
load(); route();
