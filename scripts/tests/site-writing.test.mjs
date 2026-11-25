import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {copy} from "../../src/i18n/index.ts";
import {contactFormCopy} from "../../src/data/contact-form.ts";
import {projectDetails} from "../../src/data/project-details.ts";
import {projects} from "../../src/data/projects.ts";

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),"utf8");
const decode=text=>text.replaceAll("&#39;","'").replaceAll("&amp;","&").replaceAll("&quot;",'"');
const plain=text=>decode(text.replace(/<[^>]+>/g,"")).replace(/\s+/g," ").trim();

test("localized invitations expose complete sentence units and continuous metadata text",()=>{
  for(const locale of ["id","en"]){
    for(const text of [copy[locale].contact,contactFormCopy[locale]]){
      assert.ok(Array.isArray(text.leadSentences),`${locale}: explicit sentence units missing`);
      assert.equal(text.leadSentences.length,2);
      assert.equal(text.lead,text.leadSentences.join(" "));
      assert.ok(text.leadSentences.every(s=>/[.!?]$/.test(s)));
    }
  }
});

test("authored reader address stays professional without changing feedback states",()=>{
  for(const [key,value] of Object.entries({...copy.id.contact,...contactFormCopy.id})){
    if(typeof value==="string")assert.doesNotMatch(value,/\bkamu\b|idemu|pertanyaanmu|Pesanmu|Isianmu/,key);
  }
  for(const locale of ["id","en"]){
    const text=contactFormCopy[locale];
    for(const key of ["success","failure","rateLimit","unconfirmed","required","rejected"])
      assert.ok(text[key].length>0,`${locale}/${key}`);
  }
});

test("Home output propagates the same role punctuation to title, metadata and visible role",()=>{
  for(const locale of ["id","en"]){
    const html=read(`dist/${locale}/index.html`);
    const expected="AI, Software, & Embedded Systems";
    assert.equal(plain(html.match(/<p class="intro-role"[^>]*>([\s\S]*?)<\/p>/)?.[1]??""),expected);
    assert.equal(plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]??""),`Muhammad Faza · ${expected}`);
    assert.equal(decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1]??""),
      copy[locale].intro.paragraphs[0]);
    const stats=plain(html.match(/<aside[^>]*class="[^"]*portfolio-stats[^"]*"[\s\S]*?<\/aside>/)?.[0]??"");
    assert.ok(stats.includes(locale==="id"?"Project":"Projects"));
    assert.equal(plain(html.match(/<h2[^>]*id="work-title"[^>]*>([\s\S]*?)<\/h2>/)?.[1]??""),
      locale==="id"?"Beberapa karya unggulan.":"Featured projects.");
  }
  assert.equal(plain(read("dist/index.html").match(/<title>([\s\S]*?)<\/title>/)?.[1]??""),
    "Muhammad Faza · AI, Software, & Embedded Systems");
});

test("Contact sentence spans preserve continuous reading order and inter-sentence spaces",()=>{
  for(const locale of ["id","en"]){
    const html=read(`dist/${locale}/contact/index.html`);
    const sentences=[...html.matchAll(/<span class="contact-sentence">([\s\S]*?)<\/span>/g)].map(match=>plain(match[1]));
    assert.deepEqual(sentences,[...copy[locale].contact.leadSentences,...contactFormCopy[locale].leadSentences]);
    assert.match(html,/<\/span> <span class="contact-sentence">/);
  }
});

test("localized Detail labels punctuate three-element lists consistently",()=>{
  assert.equal(projectDetails.gamein.id.deliverable,"Katalog, arcade, & artikel");
  assert.equal(projectDetails.gamein.en.deliverable,"Catalog, arcade, & articles");
  assert.equal(projectDetails["mini-notepad"].id.highlights[1].title,"Undo, redo, & tab");
  assert.equal(projectDetails["mini-notepad"].en.highlights[1].title,"Undo, redo, & tabs");
});

test("public project records retain honest runtime and version boundaries",()=>{
  const byId=Object.fromEntries(projects.map(project=>[project.id,project]));
  for(const locale of ["id","en"]){
    assert.match(byId.capify.content[locale].status,/offline/i);
    assert.match(byId["brawl-buddies"].content[locale].status,/prototype/i);
    assert.match(byId.portfolio.content[locale].status,/V2/);
    assert.ok(byId.portfolio.links.every(link=>link.label[locale].includes("V1")));
    assert.ok(projects.every(project=>project.content[locale].contribution===null));
    assert.match(projectDetails["mini-notepad"][locale].implementation,/save\/load/);
    assert.match(projectDetails.mariokan[locale].overview.join(" "),/netlist/);
    assert.match(byId.czip.content[locale].development.join(" "),/600/);
  }
});
