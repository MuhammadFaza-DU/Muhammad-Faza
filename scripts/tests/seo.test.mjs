import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const origin="https://mfazaa.my.id";
const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),"utf8");
const load=()=>loadModule("lib/seo.ts");

test("SEO route inventory covers localized content but never compatibility or private paths",async()=>{
  const {indexablePaths}=await load();
  const paths=indexablePaths();
  assert.equal(paths.length,28);
  assert.equal(new Set(paths).size,28);
  for(const path of ["/id/","/en/","/id/project/","/en/contact/","/id/project/codecraft-optimizer/","/en/project/mini-notepad-cpp/"])
    assert.ok(paths.includes(path),path);
  for(const path of ["/","/404/","/project/","/contact/","/resume/","/skill/","/.env","/archive/"])
    assert.equal(paths.includes(path),false,path);
});

test("canonical and reciprocal language links stay on the matching route",async()=>{
  const {seoForPath}=await load();
  for(const [path,canonical,indexable,pair] of [
    ["/","/en/",true,{id:"/id/",en:"/en/","x-default":"/"}],
    ["/en/","/en/",true,{id:"/id/",en:"/en/","x-default":"/"}],
    ["/id/project/tazk/","/id/project/tazk/",true,{id:"/id/project/tazk/",en:"/en/project/tazk/","x-default":"/en/project/tazk/"}],
    ["/en/contact/","/en/contact/",true,{id:"/id/contact/",en:"/en/contact/","x-default":"/en/contact/"}],
    ["/404/","/404/",false,{}],
    ["/resume/","/resume/",false,{}],
    ["/en/project/not-a-project/","/en/project/not-a-project/",false,{}],
    ["//evil.example","/404/",false,{}],
  ]){
    const result=seoForPath(path);
    assert.equal(result.canonicalPath,canonical,path);
    assert.equal(result.indexable,indexable,path);
    assert.deepEqual(result.alternates,pair,path);
  }
});

test("identity graph associates the actual owner aliases and approved public profiles",async()=>{
  const {identityGraph}=await load();
  const graph=identityGraph(origin);
  assert.equal(graph["@context"],"https://schema.org");
  const person=graph["@graph"].find(node=>node["@type"]==="Person");
  assert.equal(person.name,"Muhammad Faza");
  assert.deepEqual(person.alternateName,["Faza","mfazaa"]);
  assert.equal(person.url,"https://mfazaa.my.id/");
  assert.ok(person.sameAs.includes("https://github.com/MuhammadFaza-DU"));
  assert.ok(person.sameAs.includes("https://www.linkedin.com/in/m-faza-443479372"));
  assert.equal(person.sameAs.some(url=>url.startsWith("mailto:")),false);
  assert.equal("aggregateRating" in person,false);
});

test("inline JSON-LD cannot terminate its script element",async()=>{
  const {jsonLd}=await load();
  const payload={name:"</script><script>alert('x')</script>",note:"A & B"};
  const serialized=jsonLd(payload);
  assert.equal(serialized.includes("<"),false);
  assert.deepEqual(JSON.parse(serialized),payload);
});

test("built sitemap advertises exactly the canonical localized HTML pages",()=>{
  assert.ok(existsSync(new URL("../../dist/sitemap.xml",import.meta.url)),"Missing built sitemap");
  const xml=read("dist/sitemap.xml");
  assert.match(xml,/xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.equal(urls.length,28);
  assert.equal(new Set(urls).size,28);
  for(const url of urls){
    const parsed=new URL(url);
    assert.equal(parsed.origin,origin);
    assert.match(parsed.pathname,/^\/(?:id|en)\//);
    const html=read(`dist${parsed.pathname}index.html`);
    assert.ok(html.includes(`rel="canonical" href="${url}"`),url);
    assert.doesNotMatch(html,/<meta name="robots" content="[^"]*noindex/);
  }
});

test("built robots permits normal assets and announces the canonical sitemap",()=>{
  assert.ok(existsSync(new URL("../../dist/robots.txt",import.meta.url)),"Missing built robots");
  const robots=read("dist/robots.txt");
  assert.match(robots,/User-agent: \*/);
  assert.match(robots,/Allow: \//);
  assert.match(robots,/Sitemap: https:\/\/mfazaa\.my\.id\/sitemap\.xml/);
  assert.doesNotMatch(robots,/Disallow: \/(?:$|\r?$|_astro|media)/m);
});

test("built locale metadata is reciprocal, parseable, and bounded away from error/alias pages",async()=>{
  const {indexablePaths}=await load();
  for(const path of indexablePaths()){
    const html=read(`dist${path}index.html`);
    const counterpart=path.startsWith("/id/")?path.replace("/id/","/en/"):path.replace("/en/","/id/");
    const language=path.startsWith("/id/")?"en":"id";
    const alternate=new RegExp(`<link[^>]*rel="alternate"[^>]*hreflang="${language}"[^>]*href="${origin}${counterpart}"`);
    assert.match(html,alternate,path);
    const other=read(`dist${counterpart}index.html`);
    assert.ok(other.includes(`href="${origin}${path}"`),counterpart);
  }
  for(const file of ["404.html","contact/index.html","project/index.html","resume/index.html","skill/index.html"])
    assert.match(read(`dist/${file}`),/<meta name="robots" content="noindex, follow"/,file);
  for(const path of ["","id/","en/"]){
    const html=read(`dist/${path}index.html`);
    const blocks=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length,1,path||"/");
    assert.equal(JSON.parse(blocks[0][1])["@context"],"https://schema.org");
  }
});
