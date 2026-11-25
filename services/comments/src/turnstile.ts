import type {CommentsEnv} from "./types.ts";

export async function verifyTurnstile(
  input:{token:string;requestId:string;slug:string;ip:string},env:CommentsEnv,fetcher:typeof fetch,
):Promise<"valid"|"invalid"|"unavailable"> {
  const controller=new globalThis.AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    const result=await Promise.race([
      (async()=>{
        const response=await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
          method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,
          body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:input.token,remoteip:input.ip,idempotency_key:input.requestId}),
        });
        if(!response.ok)return "unavailable" as const;
        const data:unknown=await response.json();
        if(!data||typeof data!=="object"||Array.isArray(data))return "unavailable" as const;
        const value=data as Record<string,unknown>;
        if(value.success!==true){
          const codes=Array.isArray(value["error-codes"])?value["error-codes"]:[];
          return codes.some(code=>["internal-error","invalid-input-secret","missing-input-secret"].includes(String(code)))
            ?"unavailable" as const:"invalid" as const;
        }
        const hosts=env.ALLOWED_HOSTNAMES.split(",").map(host=>host.trim());
        return value.action==="project_comment"&&value.cdata===input.slug&&hosts.includes(String(value.hostname))
          ?"valid" as const:"invalid" as const;
      })(),
      new Promise<"unavailable">(resolve=>{timer=setTimeout(()=>{controller.abort();resolve("unavailable");},8000);}),
    ]);
    return result;
  }catch{return "unavailable";}
  finally{clearTimeout(timer);}
}
