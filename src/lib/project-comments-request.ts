import {parseCommentPage,parsePublicComment,type CommentInput,type CommentPage,type PublicComment,type CommentOrder} from "./project-comments.ts";

interface RequestOptions {fetch?:typeof fetch;signal?:AbortSignal;timeoutMs?:number;order?:CommentOrder}
export type CommentSendResult={kind:"success";comment:PublicComment}|{kind:"error";code:string}|{kind:"unconfirmed"};
async function bounded<T>(operation:(signal:AbortSignal)=>Promise<T>,options:RequestOptions):Promise<T>{
  const controller=new globalThis.AbortController();
  const abort=()=>controller.abort();options.signal?.addEventListener("abort",abort,{once:true});
  if(options.signal?.aborted)abort();
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error("timeout"));},options.timeoutMs??12000);}),
    ]);
  }finally{clearTimeout(timer);options.signal?.removeEventListener("abort",abort);}
}
export async function sendComment(base:string,slug:string,input:CommentInput,options:RequestOptions={}):Promise<CommentSendResult>{
  try{
    return await bounded(async signal=>{
      const response=await (options.fetch??fetch)(`${base}/v1/projects/${encodeURIComponent(slug)}/comments`,{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),signal,credentials:"omit",cache:"no-store",
      });
      const data=await response.json();
      if(response.ok){
        const comment=data?.ok===true?parsePublicComment(data.comment,slug):null;
        return comment?{kind:"success",comment}:{kind:"unconfirmed"};
      }
      if(response.status>=500||data?.error?.code==="submission_unconfirmed")return {kind:"unconfirmed"};
      return data?.ok===false&&typeof data.error?.code==="string"
        ?{kind:"error",code:data.error.code}:{kind:"unconfirmed"};
    },options);
  }catch{return {kind:"unconfirmed"};}
}
export async function readComments(base:string,slug:string,cursor:string|null,options:RequestOptions={}):Promise<CommentPage|null>{
  try{
    return await bounded(async signal=>{
      const query=new URLSearchParams();
      if(cursor)query.set("cursor",cursor);
      if(options.order)query.set("order",options.order);
      const response=await (options.fetch??fetch)(`${base}/v1/projects/${encodeURIComponent(slug)}/comments${query.size?`?${query}`:""}`,{
        signal,credentials:"omit",cache:"no-store",
      });
      if(!response.ok)return null;
      const data=await response.json();
      if(options.order==="asc"&&data?.order!=="asc")return null;
      return parseCommentPage(data,slug);
    },options);
  }catch{return null;}
}
