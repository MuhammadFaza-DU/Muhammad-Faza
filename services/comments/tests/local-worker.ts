// Local-only entrypoint; the production config must continue to use src/index.ts.
import {handleRequest} from "../src/api.ts";
import {storeSubmission} from "../src/store.ts";
import type {CommentsEnv} from "../src/types.ts";

export default {
  async fetch(request:Request,env:CommentsEnv){
    const url=new URL(request.url);
    if(url.pathname==="/__fixture/rollback"){
      const id=globalThis.crypto.randomUUID();
      try{
        await storeSubmission(env.DB,{
          slug:"gamein",input:{displayName:"",body:"LOCAL",requestId:id,token:"local-rollback"},
          payloadHash:"a".repeat(64),tokenDigest:"b".repeat(64),abuseKey:"c".repeat(64),
          now:Date.now(),id,
        });
      }catch{
        return Response.json({
          receipt:await env.DB.prepare("SELECT count(*) AS n FROM submission_receipts WHERE request_id=?").bind(id).first(),
          rate:await env.DB.prepare("SELECT count(*) AS n FROM rate_limit_buckets WHERE bucket_key=?").bind("c".repeat(64)).first(),
        });
      }
      return new Response("unexpected acceptance",{status:500});
    }
    if(url.pathname==="/__fixture/delete"){
      const result=await env.DB.prepare("DELETE FROM comments WHERE request_id=?").bind(url.searchParams.get("requestId")).run();
      return Response.json({changes:result.meta.changes});
    }
    if(url.pathname==="/__fixture/expire-receipt"){
      const result=await env.DB.prepare("DELETE FROM submission_receipts WHERE request_id=?").bind(url.searchParams.get("requestId")).run();
      return Response.json({changes:result.meta.changes});
    }
    let committed=false;
    const database=request.headers.get("X-Local-Postcommit-Fault")==="yes"?{
      prepare:(sql:string)=>{
        if(committed)throw new Error("Local postcommit acknowledgement fault");
        return env.DB.prepare(sql);
      },
      batch:async(statements:Parameters<CommentsEnv["DB"]["batch"]>[0])=>{
        const result=await env.DB.batch(statements);committed=true;return result;
      },
    }:env.DB;
    return handleRequest(request,{...env,DB:database},{fetch:async(_url,init)=>{
      const data=JSON.parse(String(init?.body));
      return Response.json({
        success:!data.response.startsWith("deny-"),hostname:"127.0.0.1",
        action:"project_comment",cdata:data.response.split(":")[0],
      });
    }});
  },
};
