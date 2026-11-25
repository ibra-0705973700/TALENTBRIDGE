// Talks to the FastAPI backend. Change API when you deploy the backend.
const API = window.TB_API || 'http://127.0.0.1:8000';
function token(){try{return localStorage.getItem('tbtoken')||''}catch(e){return ''}}
function setToken(t){try{t?localStorage.setItem('tbtoken',t):localStorage.removeItem('tbtoken')}catch(e){}}
async function api(path,o={}){
  const h={};const t=token();if(t)h.Authorization='Bearer '+t;
  let body=o.body;
  if(body&&!(body instanceof FormData)){h['Content-Type']='application/json';body=JSON.stringify(body)}
  let r;
  try{r=await fetch(API+path,{method:o.method||'GET',headers:h,body})}
  catch(e){throw new Error('Cannot reach the server. Start the backend and try again.')}
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const m=Array.isArray(d.detail)?d.detail.map(x=>x.msg).join('. '):d.detail;throw new Error(m||'Something went wrong. Try again.')}
  return d;
}
