// Explicit one-shot operator smoke, not an HTTP route and not an Owner auth bypass.
// Requires an exact reviewed Preview commit and owner-attested free-only mode.
// CI and ordinary builds never call the model. A fixed ledger ID prevents repeats.
import { arkConfigured, runArk } from "../lib/ai/modelark.mjs";
const target=process.env.P51R_ARK_SMOKE_COMMIT;
if(target && process.env.VERCEL_ENV==="preview" && process.env.VERCEL_GIT_COMMIT_SHA===target){
 if(!arkConfigured())throw new Error("P51R smoke configuration unavailable");
 let output="";
 try {
  const r=await runArk({id:"e7e2fc40-7fd2-4f36-9a8e-112820260001",message:"Reply with exactly IMPROMPTU_OK.",onDelta:x=>output+=x});
  const marker=output.includes("IMPROMPTU_OK");
  console.log("P51R_MODELARK_SMOKE "+JSON.stringify({model:r.model,usage:r.usage,finish:r.finish,marker,requestId:r.requestId}));
  if(!marker)throw new Error("smoke_marker_missing");
 }catch(e){
  console.error("P51R_MODELARK_SMOKE_FAILED "+(typeof e.code==="string"?e.code:"smoke_unverified"));
  process.exitCode=1;
 }
}

// P5.2 operator-only, explicitly armed for one exact reviewed commit.
// Fixed IDs prevent reruns from consuming credits. Never invoked by ordinary builds.
const p52=process.env.P52_ARK_SMOKE_COMMIT;
if(p52&&process.env.VERCEL_ENV==="preview"&&process.env.VERCEL_GIT_COMMIT_SHA===p52){
 if(!arkConfigured())throw new Error("P52 smoke configuration unavailable");
 const marker="NOTA47-LIME-6283";
 const first="Remember this harmless test code for my next question: "+marker+". Reply only ACK.";
 let a="",b="";
 try{
  const r1=await runArk({id:"e7e2fc40-7fd2-4f36-9a8e-112820260052",message:first,onDelta:x=>a+=x});
  if(!a.trim())throw Error("empty_first_response");
  const r2=await runArk({id:"e7e2fc40-7fd2-4f36-9a8e-112820260053",message:"What is the test code I gave you? Reply with only the code.",history:[{role:"user",content:first},{role:"assistant",content:a}],onDelta:x=>b+=x});
  const recalled=b.includes(marker);
  console.log("P52_MODELARK_SMOKE "+JSON.stringify({model:r2.model,first:r1.usage,second:r2.usage,context:r2.context,recalled}));
  if(!recalled)throw Error("marker_not_recalled");
 }catch(e){console.error("P52_MODELARK_SMOKE_FAILED "+(typeof e.code==="string"?e.code:"smoke_unverified"));process.exitCode=1;}
}
