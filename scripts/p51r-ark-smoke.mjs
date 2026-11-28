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
