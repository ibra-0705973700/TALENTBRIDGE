// Talks to the FastAPI backend.
// Local (localhost): uses the backend at http://127.0.0.1:8000.
// Hosted with PROD_API set (for example https://talentbridge-api.example.com): uses that backend.
// Hosted with PROD_API empty (for example on Netlify): DEMO MODE, data is saved in this browser only.
const PROD_API = '';
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const API = window.TB_API || (IS_LOCAL ? 'http://127.0.0.1:8000' : PROD_API);
const DEMO_MODE = !API;
function token(){try{return localStorage.getItem('tbtoken')||''}catch(e){return ''}}
function setToken(t){try{t?localStorage.setItem('tbtoken',t):localStorage.removeItem('tbtoken')}catch(e){}}
async function api(path,o={}){
  if(DEMO_MODE)return demoApi(path,o);
  const h={};const t=token();if(t)h.Authorization='Bearer '+t;
  let body=o.body;
  if(body&&!(body instanceof FormData)){h['Content-Type']='application/json';body=JSON.stringify(body)}
  let r;
  try{r=await fetch(API+path,{method:o.method||'GET',headers:h,body})}
  catch(e){throw new Error('Cannot reach the server. If it is asleep, wait a minute and try again.')}
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const m=Array.isArray(d.detail)?d.detail.map(x=>x.msg).join('. '):d.detail;throw new Error(m||'Something went wrong. Try again.')}
  return d;
}

// ---------- Demo mode: the same API, kept in this browser (localStorage) ----------
const DEMO_PW='TalentBridge-Demo-2026';
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('')}
function dbLoad(){try{const d=JSON.parse(localStorage.getItem('tbdemo'));if(d&&d.users)return d}catch(e){}return null}
function dbSave(d){try{localStorage.setItem('tbdemo',JSON.stringify(d))}catch(e){}}
async function dbInit(){
  let d=dbLoad();if(d)return d;
  d={seq:1000,users:[],profiles:{},apps:[],reqs:[],msgs:[],notes:[],listings:[]};
  const h=await sha('demo'+DEMO_PW);
  [['Demo Job Seeker','demo.seeker@talentbridge.demo','Job seeker'],['Demo Employer','demo.employer@talentbridge.demo','Employer'],['Demo Admin','demo.admin@talentbridge.demo','Admin']].forEach((a,i)=>{
    d.users.push({id:i+1,name:a[0],email:a[1],role:a[2],pw:h});
    d.notes.push({uid:i+1,body:'Welcome to the TalentBridge demo account.'});
  });
  d.profiles[1]={name:'Demo Job Seeker',headline:'Demo profile: data analyst',country:'',skills:'excel, sql, communication, english',bio:'Sample profile used to demonstrate skills matching.',cv:''};
  dbSave(d);return d;
}
const DEMO_JOB_IDS=[1,2,3,4,5,6,7];
const emailOk=e=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
async function demoApi(path,o){
  const d=await dbInit();const m=(o.method||'GET').toUpperCase();const b=o.body||{};
  const today=()=>new Date().toLocaleDateString();
  const note=(uid,t)=>d.notes.push({uid,body:t});
  const fail=s=>{throw new Error(s)};
  if(path==='/api/register'&&m==='POST'){
    const name=(b.name||'').trim(),email=(b.email||'').trim().toLowerCase();
    if(name.length<2)fail('Enter your full name.');if(!emailOk(email))fail('Enter a valid email address.');if((b.password||'').length<8)fail('Use a password with at least 8 characters.');
    if(!['Job seeker','Employer','Mentor'].includes(b.role))fail('Choose an account type.');
    if(d.users.some(u=>u.email===email))fail('An account with this email already exists. Sign in instead.');
    const u={id:++d.seq,name,email,role:b.role,pw:await sha(email+b.password)};d.users.push(u);note(u.id,'Welcome to TalentBridge. Complete your profile to see matches.');dbSave(d);
    return{token:'demo:'+u.id};
  }
  if(path==='/api/login'&&m==='POST'){
    const email=(b.email||'').trim().toLowerCase();const u=d.users.find(x=>x.email===email);
    const ok=u&&(u.pw===await sha(email+(b.password||''))||(u.id<=3&&u.pw===await sha('demo'+(b.password||''))));
    if(!ok)fail('Email or password is incorrect.');
    return{token:'demo:'+u.id};
  }
  const uid=parseInt((token().split(':')[1])||'0');const u=d.users.find(x=>x.id===uid);
  if(!u)fail('Sign in to continue.');
  const admin=u.role==='Admin';
  if(path==='/api/state'){
    const msgs={};d.msgs.filter(x=>x.uid===uid).forEach(x=>(msgs[x.mid]=msgs[x.mid]||[]).push(x.body));
    return{user:{name:u.name,email:u.email,role:u.role},prof:d.profiles[uid]||{},
      apps:d.apps.filter(a=>a.uid===uid).map(a=>({id:a.id,jid:a.jid,st:a.st,d:a.d})),
      reqs:d.reqs.filter(r=>admin||r.uid===uid).map(r=>({m:r.mentor,msg:r.msg,d:r.d})),
      msgs,notes:d.notes.filter(n=>n.uid===uid).map(n=>n.body),
      extra:d.listings.map(l=>({id:l.id,t:l.t,org:l.org,type:l.type,loc:l.loc,sk:l.sk}))};
  }
  if(path==='/api/profile'&&m==='PUT'){
    if((b.name||'').trim().length<2)fail('Enter your name.');
    d.profiles[uid]=Object.assign(d.profiles[uid]||{},{name:b.name,headline:b.headline||'',country:b.country||'',skills:b.skills||'',bio:b.bio||''});
    note(uid,'Profile saved. Matches updated.');dbSave(d);return{ok:true};
  }
  if(path==='/api/profile/cv'&&m==='POST'){
    const f=o.body.get('file');if(!f||!/\.(pdf|jpe?g|png)$/i.test(f.name))fail('Use a PDF, JPG or PNG file.');if(f.size>2e6)fail('File is larger than 2 MB.');
    d.profiles[uid]=Object.assign(d.profiles[uid]||{},{cv:f.name.slice(0,100)});dbSave(d);return{ok:true};
  }
  if(path==='/api/apply'&&m==='POST'){
    if(!DEMO_JOB_IDS.includes(b.jid)&&!d.listings.some(l=>l.id===b.jid))fail('This listing no longer exists.');
    if(d.apps.some(a=>a.uid===uid&&a.jid===b.jid&&a.st!=='Withdrawn'))fail('You already applied to this listing.');
    d.apps.push({id:++d.seq,uid,jid:b.jid,st:'Submitted',d:today()});note(uid,'Application submitted (demo listing).');dbSave(d);return{ok:true};
  }
  let x;
  if((x=path.match(/^\/api\/apps\/(\d+)\/withdraw$/))&&m==='POST'){
    const a=d.apps.find(a=>a.id==x[1]&&a.uid===uid);if(!a)fail('Application not found.');a.st='Withdrawn';dbSave(d);return{ok:true};
  }
  if(path==='/api/mentor-requests'&&m==='POST'){
    if((b.msg||'').trim().length<10)fail('Write at least 10 characters.');
    d.reqs.push({uid,mentor:b.mentor,msg:b.msg.trim(),d:today()});note(uid,'Mentorship request sent (demo mentor).');dbSave(d);return{ok:true};
  }
  if(path==='/api/messages'&&m==='POST'){
    if(!/^m[1-4]$/.test(b.mid||'')||!(b.body||'').trim())fail('Write a message first.');
    d.msgs.push({uid,mid:b.mid,body:b.body.trim()});dbSave(d);return{ok:true};
  }
  if(path==='/api/listings'&&m==='POST'){
    if(!['Employer','Admin'].includes(u.role))fail('Only employer accounts can post listings.');
    if((b.t||'').trim().length<2||!(b.sk||[]).length)fail('Enter a title and at least one skill.');
    d.listings.push({id:Math.max(1000,...d.listings.map(l=>l.id))+1,uid,t:b.t.trim(),org:u.name+' (demo)',type:b.type,loc:'Demo',sk:b.sk.map(s=>String(s).trim().toLowerCase()).filter(Boolean)});dbSave(d);return{ok:true};
  }
  if((x=path.match(/^\/api\/listings\/(\d+)$/))&&m==='DELETE'){
    const l=d.listings.find(l=>l.id==x[1]);if(!l)fail('Listing not found.');if(l.uid!==uid&&!admin)fail('You can only remove your own listings.');
    d.listings=d.listings.filter(l=>l.id!=x[1]);dbSave(d);return{ok:true};
  }
  fail('Not available in demo mode.');
}
