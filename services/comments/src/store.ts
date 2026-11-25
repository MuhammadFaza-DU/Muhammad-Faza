import {COMMENT_LIMITS,encodeCommentCursor,parseCommentCursor,type CommentInput,type CommentPage,type PublicComment,type CommentOrder} from "../../../src/lib/project-comments.ts";
import type {CommentsDatabase,SqlValue} from "./types.ts";

interface CommentRow {id:string;project_slug:string;display_name:string;body:string;created_at:number;request_id:string}
interface ReceiptRow {project_slug:string;payload_hash:string;deleted:number}
export interface StoreCommand {
  slug:string;input:CommentInput;payloadHash:string;tokenDigest:string;abuseKey:string;now:number;id:string;
}
export type StoreResult={kind:"created"|"existing"|"limited"|"conflict"|"deleted"|"replayed";comment?:PublicComment};
const publicRecord=(row:CommentRow):PublicComment=>({
  id:row.id,projectSlug:row.project_slug,displayName:row.display_name,body:row.body,
  createdAt:new Date(row.created_at).toISOString(),
});

export async function listComments(db:CommentsDatabase,slug:string,cursor:string|null,order:CommentOrder="desc"):Promise<CommentPage> {
  const point=cursor===null?null:parseCommentCursor(cursor);
  if(cursor!==null&&!point)throw new TypeError("Invalid comment cursor");
  const values:SqlValue[]=[slug];
  let condition="";
  if(point){
    condition=order==="asc"?" AND (created_at > ? OR (created_at = ? AND id > ?))":
      " AND (created_at < ? OR (created_at = ? AND id < ?))";
    const time=Date.parse(point.createdAt);values.push(time,time,point.id);
  }
  values.push(COMMENT_LIMITS.page+1);
  const {results}=await db.prepare(`SELECT id,project_slug,display_name,body,created_at,request_id
    FROM comments WHERE project_slug=?${condition} ORDER BY created_at ${order==="asc"?"ASC":"DESC"},id ${order==="asc"?"ASC":"DESC"} LIMIT ?`).bind(...values).all<CommentRow>();
  const comments=results.slice(0,COMMENT_LIMITS.page).map(publicRecord),last=comments.at(-1);
  return {comments,nextCursor:results.length>COMMENT_LIMITS.page&&last?encodeCommentCursor(last):null};
}

export async function lookupSubmission(
  db:CommentsDatabase,command:Pick<StoreCommand,"slug"|"input"|"payloadHash"|"now">,
):Promise<StoreResult|null> {
  const tombstone=await db.prepare("SELECT project_slug FROM deletion_tombstones WHERE request_id=? AND expires_at>?")
    .bind(command.input.requestId,command.now).first<{project_slug:string}>();
  if(tombstone)return {kind:tombstone.project_slug===command.slug?"deleted":"conflict"};
  const receipt=await db.prepare("SELECT project_slug,payload_hash,deleted FROM submission_receipts WHERE request_id=? AND expires_at>?")
    .bind(command.input.requestId,command.now).first<ReceiptRow>();
  if(receipt&&(receipt.project_slug!==command.slug||receipt.payload_hash!==command.payloadHash))return {kind:"conflict"};
  if(receipt?.deleted)return {kind:"deleted"};
  const row=await db.prepare("SELECT * FROM comments WHERE request_id=?").bind(command.input.requestId).first<CommentRow>();
  if(!row)return null;
  if(row.project_slug!==command.slug||row.display_name!==command.input.displayName||row.body!==command.input.body)return {kind:"conflict"};
  return {kind:"existing",comment:publicRecord(row)};
}

export async function storeSubmission(db:CommentsDatabase,command:StoreCommand):Promise<StoreResult> {
  const existing=await lookupSubmission(db,command);
  if(existing)return existing;
  const {slug,input,payloadHash,tokenDigest,abuseKey,now,id}=command;
  const expiry=now+COMMENT_LIMITS.rateWindowMs,receiptExpiry=now+COMMENT_LIMITS.receiptTtlMs;
  const statements=[
    db.prepare("DELETE FROM deletion_tombstones WHERE request_id IN (SELECT request_id FROM deletion_tombstones WHERE expires_at<=? LIMIT 100)").bind(now),
    db.prepare("DELETE FROM rate_limit_buckets WHERE bucket_key IN (SELECT bucket_key FROM rate_limit_buckets WHERE expires_at<=? LIMIT 100)").bind(now),
    db.prepare("DELETE FROM submission_receipts WHERE request_id IN (SELECT request_id FROM submission_receipts WHERE expires_at<=? LIMIT 100)").bind(now),
    db.prepare(`INSERT INTO rate_limit_buckets(bucket_key,hits,expires_at) VALUES(?,0,?)
      ON CONFLICT(bucket_key) DO UPDATE SET
      hits=CASE WHEN rate_limit_buckets.expires_at<=? THEN 0 ELSE rate_limit_buckets.hits END,
      expires_at=CASE WHEN rate_limit_buckets.expires_at<=? THEN excluded.expires_at ELSE rate_limit_buckets.expires_at END`)
      .bind(abuseKey,expiry,now,now),
    db.prepare(`INSERT INTO submission_receipts(request_id,payload_hash,token_digest,comment_id,project_slug,created_at,expires_at,deleted,abuse_key)
      SELECT ?,?,?,?,?,?,?,0,? WHERE EXISTS
      (SELECT 1 FROM rate_limit_buckets WHERE bucket_key=? AND hits<? AND expires_at>?)
      AND NOT EXISTS (SELECT 1 FROM deletion_tombstones WHERE request_id=? AND expires_at>?)
      ON CONFLICT(request_id) DO NOTHING`)
      .bind(input.requestId,payloadHash,tokenDigest,id,slug,now,receiptExpiry,abuseKey,abuseKey,COMMENT_LIMITS.rate,now,input.requestId,now),
    db.prepare(`INSERT INTO comments(id,project_slug,display_name,body,created_at,request_id)
      SELECT ?,?,?,?,?,? WHERE EXISTS
      (SELECT 1 FROM submission_receipts WHERE request_id=? AND comment_id=? AND payload_hash=? AND project_slug=? AND deleted=0 AND expires_at>?)
      AND NOT EXISTS (SELECT 1 FROM deletion_tombstones WHERE request_id=? AND expires_at>?)
      ON CONFLICT(request_id) DO NOTHING`)
      .bind(id,slug,input.displayName,input.body,now,input.requestId,input.requestId,id,payloadHash,slug,now,input.requestId,now),
  ];
  let written=false;
  try{
    const result=await db.batch(statements);
    written=(result.at(-1)?.meta.changes??0)>0;
  }catch(error){
    const accepted=await lookupSubmission(db,command);
    if(accepted)return accepted;
    const replay=await db.prepare("SELECT request_id FROM submission_receipts WHERE token_digest=? AND request_id<>? AND expires_at>?")
      .bind(tokenDigest,input.requestId,now).first();
    if(replay)return {kind:"replayed"};
    throw error;
  }
  const accepted=await lookupSubmission(db,command);
  if(accepted?.kind==="existing")return {...accepted,kind:written?"created":"existing"};
  return accepted??{kind:"limited"};
}
