import {projects} from "../../../src/data/projects.ts";
import {COMMENT_LIMITS,validateCommentInput} from "../../../src/lib/project-comments.ts";
import {listComments,lookupSubmission,storeSubmission,type StoreResult} from "./store.ts";
import {verifyTurnstile} from "./turnstile.ts";
import type {CommentsEnv} from "./types.ts";

const slugs=new Set(projects.map(project=>project.slug));
const encoder=new globalThis.TextEncoder();
const hex=(value:ArrayBuffer)=>Array.from(new Uint8Array(value),byte=>byte.toString(16).padStart(2,"0")).join("");
async function digest(value:string){return hex(await globalThis.crypto.subtle.digest("SHA-256",encoder.encode(value)));}
async function abuseHash(ip:string,salt:string){
  const key=await globalThis.crypto.subtle.importKey("raw",encoder.encode(salt),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await globalThis.crypto.subtle.sign("HMAC",key,encoder.encode(ip)));
}
class InputError extends Error {
  readonly status:number;readonly code:string;
  constructor(status:number,code:string){super(code);this.status=status;this.code=code;}
}
async function readInput(request:Request):Promise<unknown>{
  if(!request.body)throw new InputError(400,"invalid_input");
  if(Number(request.headers.get("Content-Length"))>COMMENT_LIMITS.requestBytes)throw new InputError(413,"body_too_large");
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let length=0;
  try{
    while(true){
      const {value,done}=await reader.read();if(done)break;
      length+=value.length;
      if(length>COMMENT_LIMITS.requestBytes){void reader.cancel();throw new InputError(413,"body_too_large");}
      chunks.push(value);
    }
    const buffer=new Uint8Array(length);let offset=0;
    for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
    return JSON.parse(new globalThis.TextDecoder("utf-8",{fatal:true}).decode(buffer));
  }catch(error){if(error instanceof InputError)throw error;throw new InputError(400,"invalid_input");}
  finally{reader.releaseLock();}
}

export async function handleRequest(
  request:Request,env:CommentsEnv,deps:{fetch?:typeof fetch;now?:()=>number}={},
):Promise<Response>{
  const origin=request.headers.get("Origin"),origins=env.ALLOWED_ORIGINS?.split(",").map(item=>item.trim()).filter(Boolean)??[];
  const headers:Record<string,string>={
    "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff","Vary":"Origin",
  };
  if(origin&&origins.includes(origin)){
    headers["Access-Control-Allow-Origin"]=origin;
    headers["Access-Control-Allow-Methods"]="GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"]="Content-Type";
    headers["Access-Control-Expose-Headers"]="Retry-After";
  }
  const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
  const fail=(status:number,code:string)=>json({ok:false,error:{code}},status);
  const stored=(result:StoreResult)=>{
    if(result.comment)return json({ok:true,comment:result.comment},result.kind==="created"?201:200);
    if(result.kind==="conflict")return fail(409,"request_conflict");
    if(result.kind==="deleted")return fail(410,"submission_deleted");
    if(result.kind==="limited"){headers["Retry-After"]="600";return fail(429,"rate_limited");}
    return fail(400,"challenge_failed");
  };
  let persistenceAttempted=false;
  try{
    const url=new URL(request.url),match=/^\/v1\/projects\/([a-z0-9-]{1,80})\/comments$/.exec(url.pathname);
    if(!match||!slugs.has(match[1]))return fail(404,"unknown_project");
    const slug=match[1];
    if(!["GET","POST","OPTIONS"].includes(request.method)){headers.Allow="GET, POST, OPTIONS";return fail(405,"method_not_allowed");}
    if(!origins.length)return fail(503,"unavailable");
    if(origin&&!origins.includes(origin))return fail(403,"forbidden_origin");
    if(request.method==="OPTIONS"){
      if(!origin)return fail(403,"forbidden_origin");
      return new Response(null,{status:204,headers});
    }
    if(request.method==="GET"){
      const cursor=url.searchParams.get("cursor");
      const order=url.searchParams.get("order")??"desc";
      if(order!=="asc"&&order!=="desc")return fail(400,"invalid_order");
      try{return json({ok:true,...(order==="asc"?{order}:{}),...await listComments(env.DB,slug,cursor,order)});}
      catch(error){if(error instanceof TypeError&&error.message==="Invalid comment cursor")return fail(400,"invalid_cursor");throw error;}
    }
    if(!env.TURNSTILE_SECRET||!env.ABUSE_HASH_SALT||!env.ALLOWED_HOSTNAMES)return fail(503,"unavailable");
    if(!origin)return fail(403,"forbidden_origin");
    const cf=(request as Request&{cf?:unknown}).cf,ip=request.headers.get("CF-Connecting-IP");
    if(!cf||!ip||ip.length>45||!/^[a-fA-F0-9:.]+$/.test(ip))return fail(503,"unavailable");
    if(request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase()!=="application/json")return fail(415,"unsupported_media_type");
    const validated=validateCommentInput(await readInput(request));
    if(!validated.ok)return fail(400,validated.code);
    const input=validated.value,now=(deps.now??Date.now)();
    const payloadHash=await digest(JSON.stringify([slug,input.displayName,input.body]));
    const lookup=await lookupSubmission(env.DB,{slug,input,payloadHash,now});
    if(lookup)return stored(lookup);
    const validation=await verifyTurnstile({token:input.token,requestId:input.requestId,slug,ip},env,deps.fetch??fetch);
    if(validation==="unavailable")return fail(503,"unavailable");
    if(validation!=="valid")return fail(400,"challenge_failed");
    persistenceAttempted=true;
    return stored(await storeSubmission(env.DB,{
      slug,input,payloadHash,now,id:globalThis.crypto.randomUUID(),
      tokenDigest:await digest(input.token),abuseKey:await abuseHash(ip,env.ABUSE_HASH_SALT),
    }));
  }catch(error){
    if(error instanceof InputError)return fail(error.status,error.code);
    return fail(503,persistenceAttempted?"submission_unconfirmed":"unavailable");
  }
}
