import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {projects} from "../../src/data/projects.ts";

test("each localized Detail has real prominent media, structured content and native destinations",()=>{
  for(const locale of ["id","en"])for(const project of projects) {
    const html=readFileSync(new URL(`../../dist/${locale}/project/${project.slug}/index.html`,import.meta.url),"utf8");
    const image=[...html.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]).find(tag=>tag.includes('class="detail-image"'));
    assert.ok(image,`${locale}/${project.id} needs genuine prominent Detail media`);
    assert.match(image,/fetchpriority="high"/);
    assert.doesNotMatch(image,/loading="lazy"/);
    assert.match(image,/width="\d+"/);assert.match(image,/height="\d+"/);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    for(const section of ["detail-about","detail-features","detail-implementation","detail-materials"])assert.ok(html.includes(`id="${section}"`),`${project.id}: ${section}`);
    assert.match(html,/data-catalog-back/);
    for(const link of project.links)assert.ok(html.includes(`href="${link.url}"`),`${project.id} lost ${link.kind}`);
    assert.ok(html.includes('data-detail-media-error hidden'),"Image failures need a reserved explanation");
    assert.doesNotMatch(html,/<figcaption\b|class="detail-full-image"/,"The preview must not repeat its explanatory footer or full-image action");
  }
});

test("Detail descriptions cover all curated projects in both languages without changing catalog records",async()=>{
  const {projectDetails}=await import("../../src/data/project-details.ts");
  assert.deepEqual(Object.keys(projectDetails).sort(),projects.map(project=>project.id).sort());
  for(const project of projects)for(const locale of ["id","en"]) {
    const content=projectDetails[project.id][locale];
    assert.ok(content.overview.length>=2,`${project.id}/${locale} needs an explanation, not a repeated card summary`);
    assert.ok(content.highlights.length>=2);
    assert.ok(content.implementation.length>80);
    assert.ok(content.mediaCaption.length>25);
    assert.ok(content.overview.every(p=>p!==project.content[locale].summary));
    for(const source of content.sources)assert.equal(new URL(source.url).protocol,"https:");
    assert.doesNotMatch([...content.overview,content.implementation,...content.highlights.map(item=>`${item.title} ${item.body}`)].join(" "),/—|\[TODO\]|lorem ipsum/i);
  }
});
