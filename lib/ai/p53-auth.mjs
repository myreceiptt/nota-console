// P5.3: Preview-only Google PKCE and server-managed sessions.
import { randomBytes, createHash } from "node:crypto";
import { configured,isOwner,sameOrigin } from "./pilot-auth.mjs";
const BRANCH="feature/impromptu-p51r-deny-first-scaffold-20261122";
export const ORIGIN="https://prompt-endhonesa-com-git-feature-impromptu-p51-8a1c22-prof-nota.vercel.app";
const A="__Host-nota_p53_access", R="__Host-nota_p53_refresh", V="__Host-nota_p53_pkce";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JWT=/^[A-Za-z0-9_.-]{20,3800}$/;
const REFRESH=/^[A-Za-z0-9_-]{10,512}$/;
const CODE=/^[A-Za-z0-9_-]{16,512}$/;
export function p53Enabled(){return process.env.VERCEL_ENV==="preview"&&process.env.VERCEL_GIT_COMMIT_REF===BRANCH&&process.env.P53_AUTH_ENABLED==="true";}
function ready(){return p53Enabled()&&configured()&&!!process.env.SUPABASE_SERVICE_ROLE_KEY;}
function cookie(req,name,pattern){const raw=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="))?.slice(name.length+1);return raw&&pattern.test(raw)?raw:null;}
function makeCookie(name,value,age,same="Strict"){return name+"="+value+"; Path=/; Max-Age="+age+"; HttpOnly; Secure; SameSite="+same;}
function clearCookies(res){res.setHeader("Set-Cookie",[makeCookie(A,"",0),makeCookie(R,"",0),makeCookie(V,"",0,"Lax"),makeCookie("__Host-nota_p51r","",0)]);}
function claims(token){try{if(!JWT.test(token))return null;const parts=token.split(".");if(parts.length!==3)return null;const c=JSON.parse(Buffer.from(parts[1],"base64url").toString("utf8"));return UUID.test(c.sub)&&UUID.test(c.session_id)?{uid:c.sub,sid:c.session_id}:null;}catch{return null;}}
async function auth(path,body,token){
 const response=await fetch(new URL("/auth/v1/"+path,process.env.SUPABASE_URL),{method:body!==undefined?"POST":"GET",redirect:"error",signal:AbortSignal.timeout(5000),headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 if([400,401,403,404].includes(response.status))return null;
 if(!response.ok)throw new Error("auth_unavailable");
 if(response.status===204)return true;
 return response.json();
}
export async function p53Rpc(name,data={}){
 if(!ready()||!/^p53_[a-z_]+$/.test(name))throw new Error("auth_unavailable");
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const res=await fetch(new URL("/rest/v1/rpc/"+name,process.env.SUPABASE_URL),{method:"POST",redirect:"error",signal:AbortSignal.timeout(5000),headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(data)});
 if(!res.ok)throw new Error("auth_unavailable");
 return res.json();
}
async function verified(token){
 if(!token||!ready())return null;
 const c=claims(token);if(!c)return null;
 const user=await auth("user",undefined,token);
 if(!user||user.id!==c.uid||!user.email_confirmed_at||user.is_anonymous||typeof user.email!=="string"||user.email.length>254)return null;
 const google=Array.isArray(user.identities)&&user.identities.some(i=>i.provider==="google");
 if(!google)return null;
 return {...c,email:user.email,role:isOwner(user)?"owner":"member"};
}
async function registered(v){
 if(!v)return null;
 const p=await p53Rpc("p53_session",{p_uid:v.uid,p_sid:v.sid});
 return p&&p.user_id===v.uid&&p.role===v.role&&Date.parse(p.expires_at)>Date.now()?{...v,expires:p.expires_at}:null;
}
export async function p53Principal(req){return registered(await verified(cookie(req,A,JWT)));}
function setCookies(res,data,p){
 if(!JWT.test(data.access_token)||!REFRESH.test(data.refresh_token))throw new Error("auth_unavailable");
 const age=Math.min(2592000,Math.floor((Date.parse(p.expires)-Date.now())/1000));
 if(age<=0)throw new Error("session_expired");
 res.setHeader("Set-Cookie",[makeCookie(A,data.access_token,age),makeCookie(R,data.refresh_token,age),makeCookie(V,"",0,"Lax"),makeCookie("__Host-nota_p51r","",0)]);
}
function sessionResult(p){return {authenticated:!!p,google:true,...(p?{role:p.role}:{})};}
function json(res,status,payload){
 res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store, private");res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("X-Robots-Tag","noindex");res.setHeader("Referrer-Policy","no-referrer");res.end(JSON.stringify(payload));
}
function redirect(res,success){res.statusCode=303;res.setHeader("Location",ORIGIN+"/?notagent=1"+(success?"":"&auth=failed"));res.setHeader("Cache-Control","no-store, private");res.setHeader("Referrer-Policy","no-referrer");res.end();}
async function refresh(req){
 const old=claims(cookie(req,A,JWT)||"");const rt=cookie(req,R,REFRESH);
 if(!old||!rt)return null;
 const prior=await p53Rpc("p53_session",{p_uid:old.uid,p_sid:old.sid});
 if(!prior)return null;
 const data=await auth("token?grant_type=refresh_token",{refresh_token:rt});
 if(!data?.access_token||!REFRESH.test(data.refresh_token))return null;
 const v=await verified(data.access_token);
 if(!v||v.uid!==old.uid||v.sid!==old.sid)return null;
 const p=await registered(v);return p?{p,data}:null;
}
export async function handleP53(req,res,readBody){
 if(!ready())return json(res,503,{error:"auth_unavailable"});
 if(String(req.headers.host||"").toLowerCase()!==new URL(ORIGIN).host)return json(res,403,{error:"preview_origin_required"});
 let url;try{url=new URL(req.url||"/api/ai/pilot-session",ORIGIN);}catch{return json(res,400,{error:"invalid_url"});}
 try{
  if(req.method==="GET"&&url.searchParams.get("oauth")==="1"){
   const code=url.searchParams.get("code"),verifier=cookie(req,V,CODE);
   res.setHeader("Set-Cookie",makeCookie(V,"",0,"Lax"));
   if(!code||!CODE.test(code)||!verifier)return redirect(res,false);
   const data=await auth("token?grant_type=pkce",{auth_code:code,code_verifier:verifier});
   if(!data?.access_token||!REFRESH.test(data.refresh_token))return redirect(res,false);
   const v=await verified(data.access_token);if(!v)return redirect(res,false);
   const p=await p53Rpc("p53_register",{p_uid:v.uid,p_sid:v.sid,p_email:v.email,p_role:v.role});
   if(!p||p.role!==v.role||p.user_id!==v.uid)return redirect(res,false);
   setCookies(res,data,{...v,expires:p.expires_at});return redirect(res,true);
  }
  if(req.method==="GET")return json(res,200,sessionResult(await p53Principal(req)));
  if(req.method!=="POST")return json(res,405,{error:"method_not_allowed"});
  if(!sameOrigin(req))return json(res,403,{error:"same_origin_required"});
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers["content-type"]||""))return json(res,415,{error:"json_required"});
  const body=await readBody(req);if(!body||Object.keys(body).length!==1)return json(res,400,{error:"invalid_action"});
  if(body.action==="google_start"){
   const verifier=randomBytes(48).toString("base64url");
   const challenge=createHash("sha256").update(verifier).digest("base64url");
   const target=new URL("/auth/v1/authorize",process.env.SUPABASE_URL);
   target.search=new URLSearchParams({provider:"google",redirect_to:ORIGIN+"/api/ai/pilot-session?oauth=1",code_challenge:challenge,code_challenge_method:"s256"}).toString();
   res.setHeader("Set-Cookie",makeCookie(V,verifier,600,"Lax"));return json(res,200,{url:target.href});
  }
  if(body.action==="refresh"){
   const existing=await p53Principal(req);if(existing)return json(res,200,sessionResult(existing));
   const result=await refresh(req);if(!result){clearCookies(res);return json(res,200,sessionResult(null));}
   setCookies(res,result.data,result.p);return json(res,200,sessionResult(result.p));
  }
  if(body.action==="logout"){
   let p=await p53Principal(req);let token=cookie(req,A,JWT);
   if(!p){const result=await refresh(req);if(result){p=result.p;token=result.data.access_token;}}
   if(p){
    if(!await p53Rpc("p53_revoke",{p_uid:p.uid,p_sid:p.sid}))throw new Error("auth_unavailable");
    // App session is already revoked. Supabase logout is best effort; no transcript is stored.
    try{await auth("logout?scope=local",{},token);}catch{}
   }
   clearCookies(res);return json(res,200,sessionResult(null));
  }
  return json(res,400,{error:"invalid_action"});
 }catch{if(req.method==="GET"&&url.searchParams.get("oauth")==="1")return redirect(res,false);return json(res,503,{error:"auth_unavailable"});}
}
