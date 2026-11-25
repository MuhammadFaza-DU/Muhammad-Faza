export const COMMENT_LIMITS={
  name:60,body:1600,token:2048,page:20,requestBytes:8192,
  rate:6,rateWindowMs:600000,receiptTtlMs:86400000,
} as const;

export interface PublicComment {
  id:string;projectSlug:string;displayName:string;body:string;createdAt:string;
}
export interface CommentPage {comments:PublicComment[];nextCursor:string|null}
export interface CommentInput {displayName:string;body:string;requestId:string;token:string}
export interface CommentCursor {id:string;createdAt:string}
export type CommentOrder="asc"|"desc";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hasControls=(value:string,multiline=false)=>[...value].some(char=>{
  const code=char.charCodeAt(0);
  return code===127||(code<32&&!(multiline&&(code===9||code===10||code===13)));
});
const ISO_TIME=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const object=(value:unknown):value is Record<string,unknown>=>typeof value==="object"&&value!==null&&!Array.isArray(value);
export const isCommentId=(value:unknown):value is string=>typeof value==="string"&&UUID.test(value);
const wellFormed=(value:string)=>![...value].some(char=>{
  const point=char.codePointAt(0)!;
  return point>=0xd800&&point<=0xdfff;
});
const validName=(value:string)=>value.length>0&&value.length<=COMMENT_LIMITS.name&&!hasControls(value)&&wellFormed(value);
const validBody=(value:string)=>value.length>0&&value.length<=COMMENT_LIMITS.body&&!hasControls(value,true)&&wellFormed(value);
const timestamp=(value:unknown):value is string=>{
  if(typeof value!=="string"||!ISO_TIME.test(value))return false;
  const time=Date.parse(value);
  return Number.isFinite(time)&&new Date(time).toISOString()===value;
};

export function validateCommentInput(value:unknown):{ok:true;value:CommentInput}|{ok:false;code:"invalid_input"} {
  const invalid={ok:false,code:"invalid_input"} as const;
  if(!object(value)||typeof value.displayName!=="string"||typeof value.body!=="string"||
    typeof value.token!=="string"||!isCommentId(value.requestId))return invalid;
  const displayName=value.displayName.trim(),body=value.body.replace(/\r\n?/g,"\n").trim(),token=value.token.trim();
  if(!validName(displayName)||!validBody(body)||!token||token.length>COMMENT_LIMITS.token||
    hasControls(token))return invalid;
  return {ok:true,value:{displayName,body,token,requestId:value.requestId.toLowerCase()}};
}

export function encodeCommentCursor(value:CommentCursor):string {
  if(!isCommentId(value.id)||!timestamp(value.createdAt))throw new TypeError("Invalid comment cursor");
  return globalThis.btoa(JSON.stringify({id:value.id.toLowerCase(),createdAt:value.createdAt}))
    .replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
}

export function parseCommentCursor(value:unknown):CommentCursor|null {
  if(typeof value!=="string"||!value||value.length>256||!/^[a-zA-Z0-9_-]+$/.test(value))return null;
  try{
    const decoded:unknown=JSON.parse(globalThis.atob(value.replaceAll("-","+").replaceAll("_","/")));
    if(!object(decoded)||!isCommentId(decoded.id)||!timestamp(decoded.createdAt))return null;
    const cursor={id:decoded.id.toLowerCase(),createdAt:decoded.createdAt};
    return encodeCommentCursor(cursor)===value?cursor:null;
  }catch{return null;}
}

export function parsePublicComment(value:unknown,projectSlug:string):PublicComment|null {
  if(!object(value)||!isCommentId(value.id)||value.projectSlug!==projectSlug||
    !timestamp(value.createdAt)||typeof value.displayName!=="string"||typeof value.body!=="string"||
    !validName(value.displayName)||!validBody(value.body)||!value.displayName.trim()||!value.body.trim())return null;
  return {id:value.id.toLowerCase(),projectSlug,displayName:value.displayName,body:value.body,createdAt:value.createdAt};
}

export function parseCommentPage(value:unknown,projectSlug:string):CommentPage|null {
  if(!object(value)||value.ok!==true||!Array.isArray(value.comments)||value.comments.length>COMMENT_LIMITS.page||
    (value.nextCursor!==null&&parseCommentCursor(value.nextCursor)===null))return null;
  const comments=value.comments.map(item=>parsePublicComment(item,projectSlug));
  if(comments.some(item=>item===null))return null;
  return {comments:comments as PublicComment[],nextCursor:value.nextCursor as string|null};
}

export function mergeComments(existing:PublicComment[],incoming:PublicComment[],order:CommentOrder="desc"):PublicComment[] {
  const records=new Map(existing.map(comment=>[comment.id,comment]));
  for(const comment of incoming)records.set(comment.id,comment);
  const direction=order==="asc"?1:-1;
  return [...records.values()].sort((a,b)=>direction*(a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id)));
}
