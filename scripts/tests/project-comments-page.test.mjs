import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {projects} from "../../src/data/projects.ts";

test("each Detail includes final project-scoped comments without simulation or public deletion",()=>{
  for(const locale of ["id","en"])for(const project of projects){
    const html=readFileSync(new URL(`../../dist/${locale}/project/${project.slug}/index.html`,import.meta.url),"utf8");
    const panel=html.match(/<section\b[^>]*data-project-comments[\s\S]*?<\/section>/)?.[0];
    assert.ok(panel,`${locale}/${project.slug}: final comments missing`);
    assert.ok(panel.includes(`data-project="${project.slug}"`));
    assert.doesNotMatch(panel,/\bdata-locale=/,"data-locale is reserved for global locale-navigation anchors");
    assert.match(panel,/<label[^>]*for="project-comment-name"/);
    assert.match(panel,/<label[^>]*for="project-comment-message"/);
    assert.match(panel,/<input[^>]*id="project-comment-name"[^>]*maxlength="60"/);
    assert.match(panel,/<textarea[^>]*id="project-comment-message"[^>]*maxlength="1600"/);
    assert.match(panel,/<button[^>]*type="submit"[^>]*disabled/,"NoJS cannot accidentally submit");
    assert.match(panel,/role="status"/);
    assert.match(panel,locale==="id"?/Kirim komentar/:/Send comment/);
    assert.doesNotMatch(panel,/Nama dan komentar akan tampil publik|Cloudflare membantu mencegah spam|Komentar belum bisa dimuat|Your name and comment will be public|Cloudflare helps prevent spam|Comments could not be loaded/);
    assert.doesNotMatch(panel,/project-comments-privacy|aria-describedby="project-comments-privacy"/);
    assert.doesNotMatch(panel,/data-comments-preview|simulasi|simulation|pratinjau|Local preview|Remove simulation|data-remove-label/i);
    assert.doesNotMatch(panel,/<button[^>]*>[^<]*(?:Hapus|Delete)/i);
    assert.doesNotMatch(panel,/Apresiasi, kritik, dan pendapatmu|Your appreciation, criticism, and thoughts/);
    assert.doesNotMatch(panel,/formspree\.io|type="email"|type="file"|data-comment-entry|<iframe|<script[^>]*src="https:/);
    assert.ok(html.indexOf('id="detail-materials"')<html.indexOf("data-project-comments"));
  }
});
