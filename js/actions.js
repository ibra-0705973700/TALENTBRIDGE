// Actions that change data on the server, then reload state and redraw.
async function run(fn,ok){try{await fn();await refresh();if(ok)toast(ok);route()}catch(e){toast(e.message,1)}}
async function doAuth(mode){
  const n=v('an').trim(),e=v('ae').trim(),p=v('ap');
  if(mode==='register'&&n.length<2)return toast('Enter your full name.',1);
  if(!/^\S+@\S+\.\S+$/.test(e))return toast('Enter a valid email address.',1);
  if(mode==='register'&&p.length<8)return toast('Use a password with at least 8 characters.',1);
  if(!p)return toast('Enter your password.',1);
  try{
    const r=await api(mode==='register'?'/api/register':'/api/login',{method:'POST',body:mode==='register'?{name:n,email:e,password:p,role:v('ar')}:{email:e,password:p}});
    setToken(r.token);await refresh();toast(mode==='register'?'Account created.':'Signed in.');location.hash='dashboard';route();
  }catch(err){toast(err.message,1)}
}
async function saveProf(){
  const f=document.getElementById('p_cv').files[0];
  if(f&&(f.size>2e6||!/\.(pdf|jpe?g|png)$/i.test(f.name)))return toast('Use a PDF, JPG or PNG under 2 MB.',1);
  if(!v('p_name').trim())return toast('Enter your name.',1);
  run(async()=>{
    await api('/api/profile',{method:'PUT',body:{name:v('p_name').trim(),headline:v('p_headline').trim(),country:v('p_country').trim(),skills:v('p_skills').trim(),bio:v('p_bio').trim()}});
    if(f){const fd=new FormData();fd.append('file',f);await api('/api/profile/cv',{method:'POST',body:fd})}
  },'Profile saved.');
}
function apply(id){if(!S.user){toast('Sign in to apply.',1);return void(location.hash='auth')}run(()=>api('/api/apply',{method:'POST',body:{jid:id}}),'Application submitted.')}
function wd(id){run(()=>api('/api/apps/'+id+'/withdraw',{method:'POST'}),'Application withdrawn.')}
function book(id){
  if(!S.user){toast('Sign in to request a mentor.',1);return void(location.hash='auth')}
  const m=prompt('Tell the mentor what you want help with:');if(m===null)return;
  if(m.trim().length<10)return toast('Write at least 10 characters.',1);
  run(()=>api('/api/mentor-requests',{method:'POST',body:{mentor:MENT.find(x=>x.id===id).n,msg:m.trim()}}),'Request sent.');
}
function send(){const b=v('mb').trim();if(!b)return toast('Write a message first.',1);run(()=>api('/api/messages',{method:'POST',body:{mid:v('mt'),body:b}}),'Message sent.')}
function post(){
  const t=v('lt').trim(),s=v('ls').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  if(!t||!s.length)return toast('Enter a title and at least one skill.',1);
  run(()=>api('/api/listings',{method:'POST',body:{t,type:v('lk'),sk:s}}),'Listing published.');
}
function rm(id){run(()=>api('/api/listings/'+id,{method:'DELETE'}),'Listing removed.')}
function contact(){if(!/^\S+@\S+\.\S+$/.test(v('ce')))return toast('Enter a valid email address.',1);if(v('cm').trim().length<5)return toast('Write a message.',1);toast('Thanks. In production this is emailed to the team.')}
// Start: load the signed-in user's data, then show the page
document.getElementById('app').innerHTML='<p>Loading…</p>';
(async()=>{if(token())await refresh();route()})();
