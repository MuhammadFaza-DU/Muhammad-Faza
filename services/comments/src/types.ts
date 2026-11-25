export type SqlValue=string|number|null;
export interface DbResult<T=Record<string,unknown>> {results?:T[];meta:{changes:number}}
export interface DbStatement {
  bind(...values:SqlValue[]):DbStatement;
  first<T=Record<string,unknown>>():Promise<T|null>;
  all<T=Record<string,unknown>>():Promise<{results:T[]}>;
  run():Promise<DbResult>;
}
export interface CommentsDatabase {
  prepare(sql:string):DbStatement;
  batch(statements:DbStatement[]):Promise<DbResult[]>;
}
export interface CommentsEnv {
  DB:CommentsDatabase;
  TURNSTILE_SECRET:string;
  ABUSE_HASH_SALT:string;
  ALLOWED_ORIGINS:string;
  ALLOWED_HOSTNAMES:string;
}
