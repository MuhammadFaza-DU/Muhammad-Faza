import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {existsSync,readFileSync,readdirSync} from "node:fs";

export function createCommentsDb(){
  const migrations=new URL("../../../services/comments/migrations/",import.meta.url);
  assert.ok(existsSync(migrations),"Comments migration not implemented");
  const sqlite=new DatabaseSync(":memory:");
  for(const file of readdirSync(migrations).filter(file=>file.endsWith(".sql")).sort()){
    sqlite.exec(readFileSync(new URL(file,migrations),"utf8"));
  }
  let tail=Promise.resolve();
  class Statement{
    constructor(sql,values=[]){this.sql=sql;this.values=values;}
    bind(...values){return new Statement(this.sql,values);}
    async first(){return sqlite.prepare(this.sql).get(...this.values)??null;}
    async all(){return {results:sqlite.prepare(this.sql).all(...this.values)};}
    runSync(){
      const before=sqlite.prepare("SELECT total_changes() AS n").get().n;
      sqlite.prepare(this.sql).run(...this.values);
      return {meta:{changes:Number(sqlite.prepare("SELECT total_changes() AS n").get().n-before)}};
    }
    async run(){return this.runSync();}
  }
  const db={
    prepare(sql){return new Statement(sql);},
    batch(statements){
      const run=tail.then(()=>{
        sqlite.exec("BEGIN");
        try{const result=statements.map(statement=>statement.runSync());sqlite.exec("COMMIT");return result;}
        catch(error){sqlite.exec("ROLLBACK");throw error;}
      });
      tail=run.catch(()=>{});return run;
    },
  };
  return {db,sqlite,close:()=>sqlite.close()};
}
