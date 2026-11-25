import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {featuredProjectIds} from "../src/data/featured.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const outputRoot = path.join(root, "public");
const cache = path.join(root, "assets/source-cache");
const manifest = [];
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");

async function output(relative, bytes) {
  const target = path.resolve(outputRoot, relative);
  if (path.relative(outputRoot, target).startsWith("..")) throw new Error("Asset escapes public");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return target;
}

async function download(id, url, headers) {
  const local = path.join(cache, id);
  try {
    return await readFile(local);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Asset ${id}: HTTP ${response.status} at ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await mkdir(cache, { recursive: true });
  await writeFile(local, bytes);
  return bytes;
}

function record(id, bytes, source, kind, license, outputs, extra = {}) {
  manifest.push({
    id, ...source, sourceSha256: sha(bytes), kind, license,
    review: "prepared; visual integration pending", outputs, ...extra,
  });
}

async function imageOutput(relative, bytes, width, format = "webp") {
  const isVector = bytes.toString("utf8", 0, 256).includes("<svg");
  const pipeline = sharp(bytes, isVector ? { density: 768 } : {})
    .resize({ width, withoutEnlargement: !isVector });
  const { data, info } = await (format === "png" ? pipeline.png() : pipeline.webp({ quality: 88, alphaQuality: 100 }))
    .toBuffer({ resolveWithObject: true });
  await output(relative, data);
  return { path: relative, width: info.width, height: info.height };
}

async function portraits() {
  const sources = {
    studio: "assets/masters/portraits/Confident Young Man in Charcoal Suit.png",
    normal: "assets/masters/portraits/Confident Suit Portrait Cutout.png",
    armor: "assets/masters/portraits/Futuristic Armored Hero Portrait.png",
  };
  for (const [id, sourcePath] of Object.entries(sources)) {
    const bytes = await readFile(path.join(root, sourcePath));
    let prepared = bytes;
    const registration = id === "armor"
      ? { sourceCanvas: [1122, 1402], resizedWidth: 1043, translate: [32, 98], stage: [1122, 1402], method: "uniform resize and translation; face not repainted/warped" }
      : null;
    if (registration) {
      const resized = await sharp(bytes).resize({ width: registration.resizedWidth }).png().toBuffer();
      prepared = await sharp({ create: { width: 1122, height: 1402, channels: 4, background: "#00000000" } })
        .composite([{ input: resized, left: 32, top: 98 }]).png().toBuffer();
    }
    const outputs = [];
    for (const width of [512, 768]) {
      outputs.push(await imageOutput(`media/portrait/${id}-${width}.webp`, prepared, width));
    }
    record(id, bytes, { sourcePath, sourceRef: "owner-selected supplied master" }, "portrait",
      "Owner-supplied artwork; preserve source and do not claim original photographic engineering evidence.",
      outputs, { registration, caption: id === "armor" ? "User-supplied armored portrait artwork." : "Muhammad Faza portrait." });
  }
}

async function brand() {
  const sourcePath = "assets/masters/brand/mf-refined.svg";
  const bytes = await readFile(path.join(root, sourcePath));
  const source = bytes.toString("utf8");
  const paths = [...source.matchAll(/<path d="([^"]+)"\/>/g)].map(match => `<path d="${match[1]}"/>`).join("");
  if (!paths || /<image|<script|foreignObject|data:/i.test(source)) throw new Error("Unexpected MF master content");
  const svg = (fill, style = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="360 -100 1120 1120" fill="${fill}">${style}${paths}</svg>\n`;
  for (const [id, fill] of [["mf-black", "#101010"], ["mf-white", "#F5F5F5"]]) {
    const relative = `media/brand/${id}.svg`;
    await output(relative, Buffer.from(svg(fill)));
    record(id, bytes, { sourcePath, sourceRef: "Refined selected by owner 2026-11-14" }, "identity",
      "Owner-supplied selected monogram.", [{ path: relative, width: 1120, height: 1120 }],
      { caption: "Selected MF monogram, square padding derivative; original paths unchanged." });
  }
  await output("favicon.svg", Buffer.from(svg("#101010", "<style>@media(prefers-color-scheme:dark){path{fill:#F5F5F5}}</style>")));
  record("favicon", bytes, { sourcePath, sourceRef: "same selected Refined geometry" }, "identity",
    "Owner-supplied selected monogram.", [{ path: "favicon.svg", width: 1120, height: 1120 }]);
  const apple = await sharp(Buffer.from(svg("#F5F5F5"))).resize(180, 180).flatten({ background: "#0A0A0A" }).png().toBuffer();
  await output("apple-touch-icon.png", apple);
  record("apple-touch", bytes, { sourcePath, sourceRef: "same selected Refined geometry" }, "identity",
    "Owner-supplied selected monogram.", [{ path: "apple-touch-icon.png", width: 180, height: 180 }]);
}

async function fonts() {
  const cssUrl = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap";
  const css = (await download("archivo-google.css", cssUrl, {
    "User-Agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
  })).toString("utf8");
  const latin = css.split("/* latin */").at(-1);
  const url = latin.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
  if (!url) throw new Error("Archivo Latin font URL absent from Google Fonts response");
  const bytes = await download("archivo.woff2", url);
  if (bytes.toString("ascii", 0, 4) !== "wOF2") throw new Error("Archivo download is not WOFF2");
  await output("fonts/archivo.woff2", bytes);
  const licenseUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/OFL.txt";
  const license = await download("archivo-OFL.txt", licenseUrl);
  await output("licenses/archivo-OFL.txt", license);
  record("archivo", bytes, { sourceUrl: url, sourceRef: cssUrl }, "font",
    "SIL Open Font License 1.1; licenses/archivo-OFL.txt",
    [{ path: "fonts/archivo.woff2", width: null, height: null }],
    { axes: { wdth: [62, 125], wght: [100, 900] }, licenseUrl });
}

async function lanyard() {
  const sourcePath = "assets/masters/portraits/Confident Young Man in Charcoal Suit.png";
  const portrait = await readFile(path.join(root,sourcePath));
  const front = await sharp(portrait).resize(768,1080,{fit:"cover",position:"centre"}).webp({quality:90}).toBuffer();
  await output("media/lanyard/front.webp",front);
  record("lanyard-front",portrait,{sourcePath,sourceRef:"Owner-selected studio, cover crop; face not edited"},"portrait",
    "Owner-supplied artwork.",[{path:"media/lanyard/front.webp",width:768,height:1080}]);
  const brandPath = "assets/masters/brand/mf-refined.svg";
  const brand = await readFile(path.join(root,brandPath));
  const paths = [...brand.toString("utf8").matchAll(/<path d="([^"]+)"\/>/g)].map(match=>`<path d="${match[1]}"/>`).join("");
  if (!paths) throw new Error("MF texture geometry missing");
  const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="360 -100 1120 1120" fill="#fff">${paths}</svg>`;
  const logo = await sharp(Buffer.from(mark)).png().toBuffer();
  const back = await sharp({create:{width:768,height:1080,channels:3,background:"#101010"}})
    .composite([{input:logo,left:234,top:390}]).webp({quality:95}).toBuffer();
  await output("media/lanyard/back.webp",back);
  const small = await sharp(Buffer.from(mark)).resize(108,108).png().toBuffer();
  const strap = await sharp({create:{width:384,height:128,channels:3,background:"#101010"}})
    .composite([{input:small,left:10,top:10},{input:small,left:138,top:10},{input:small,left:266,top:10}])
    .webp({quality:95}).toBuffer();
  await output("media/lanyard/strap.webp",strap);
  record("lanyard-brand",brand,{sourcePath:brandPath,sourceRef:"Selected Refined paths, white on black, no silhouette changes"},"identity",
    "Owner-supplied monogram.",[{path:"media/lanyard/back.webp",width:768,height:1080},{path:"media/lanyard/strap.webp",width:384,height:128}]);
}

async function remoteArt() {
  const definitions = [
    { id: "tazk", url: "https://raw.githubusercontent.com/MuhammadFaza-DU/Tazk-Android-App/main/docs/assets/tazk-banner.png", kind: "identity", caption: "Tazk identity banner from its repository, not a screenshot." },
    { id: "gamein", url: "https://raw.githubusercontent.com/MuhammadFaza-DU/gamein/master/design/brand/logo.png", kind: "identity", caption: "GameIn identity mascot from its repository, not gameplay." },
    { id: "stackcrate", url: "https://raw.githubusercontent.com/MuhammadFaza-DU/StackCrate/main/public/favicon.svg", kind: "identity", caption: "StackCrate identity from its repository, not a product screenshot." },
  ];
  for (const item of definitions) {
    const bytes = await download(item.id, item.url);
    const prepared = await imageOutput(`media/projects/${item.id}/identity.webp`, bytes, item.id === "tazk" ? 1280 : 640);
    record(item.id, bytes, { sourceUrl: item.url, sourceRef: "repository branch path; captured source hash above" },
      item.kind, "Existing project repository artwork; final ownership/attribution review remains.",
      [prepared], { caption: item.caption });
  }
}

async function featuredArt(selected) {
  const featured=selected?JSON.parse(await readFile(path.join(root,"docs/v2/assets/featured-media.json"),"utf8"))
    .filter(item=>!selected.includes(item.id)):[];
  const sources=[
    {id:"tazk",file:"tazk-home.webp",url:"https://raw.githubusercontent.com/MuhammadFaza-DU/Tazk-Android-App/f7d299787307fbac84b0c475ecfee14d5883c51a/docs/assets/screens/home.webp",
      ref:"Repository app screenshot pinned to f7d2997; not recaptured on a local device",background:"#f4f2e8",fit:"contain"},
    {id:"gamein",file:"gamein-catalog-wide.png",url:"https://gamein-8cq.pages.dev/id/katalog/",
      ref:"Live public catalog captured 2026-11-15, desktop 1600x900 and independently rendered narrow 600x1100; no UI fabrication",background:"#0b120d",fit:"cover"},
    {id:"stackcrate",file:"stackcrate-catalog-wide.png",url:"https://stack-crate.vercel.app/",
      ref:"Live public asset grid captured 2026-11-15, desktop 1600x900 and independently rendered narrow 600x1100; public browsing only",background:"#211b16",fit:"cover"},
    {id:"capify",file:"capify-featured-wide.png",tallFile:"capify-featured-tall.png",url:"https://capify-v1-demo.vercel.app/",
      ref:"Genuine public interface captured 2026-11-16 at 1600x900 and independently at 600x1100; demo frontend only",background:"#09090b",fit:"cover",homeOnly:true},
    {id:"mariokan",sourcePath:"assets/masters/catalog/mariokan.png",
      url:"https://github.com/MuhammadFaza-DU/MarioKan/tree/d584d7e876cf2b4025b281f05427e114c2f6abe7",
      ref:"Original repository architecture diagram; full diagram wide and central controller/player/collision excerpt tall; design, not finished hardware",
      background:"#ffffff",fit:"contain",kind:"architecture",homeOnly:true},
  ];
  for(const source of sources) {
    if(selected&&!selected.includes(source.id))continue;
    const {id,background,fit}=source;
    const sourcePath=source.sourcePath??`assets/masters/project-screens/${source.file}`;
    const bytes=await readFile(path.join(root,sourcePath));
    const screens=id==="tazk"?await Promise.all(["home","pomodoro","stats"].map(async name=>{
      const screenPath=`assets/masters/project-screens/tazk-${name}.webp`;
      const screen=await readFile(path.join(root,screenPath));
      return {path:screenPath,sha256:sha(screen),url:source.url.replace("home.webp",`${name}.webp`)};
    })):undefined;
    const outputs=[];
    for(const variant of ["wide","tall"]) {
      const capturePath=source.kind==="architecture"||variant==="wide"||id==="tazk"?sourcePath:
        `assets/masters/project-screens/${source.tallFile??`${id}-catalog-tall.png`}`;
      let capture=await readFile(path.join(root,capturePath));
      let screenFrames;
      if(id==="tazk"&&variant==="wide") {
        screenFrames=[];
        const columns=await Promise.all(screens.map(async(screen,index)=>{
          const {data,info}=await sharp(await readFile(path.join(root,screen.path)))
            .resize({height:876}).png().toBuffer({resolveWithObject:true});
          const left=Math.round((1600-(info.width*3+48))/2)+index*(info.width+24);
          screenFrames[index]={path:screen.path,left,top:12,width:info.width,height:info.height};
          return {input:data,left,top:12};
        }));
        capture=await sharp({create:{width:1600,height:900,channels:3,background}})
          .composite(columns).png().toBuffer();
      }
      let excerpt;
      if(source.kind==="architecture"){
        if(variant==="tall"){
          excerpt={left:1100,top:440,width:1400,height:1450};
          capture=await sharp(capture).extract(excerpt).toBuffer();
        }
        capture=await sharp(capture).resize(variant==="wide"?1600:600,variant==="wide"?900:1100,
          {fit:"contain",background,withoutEnlargement:true,...(variant==="tall"?{position:"north"}:{})}).png().toBuffer();
      }
      const prepared=await imageOutput(`media/projects/${id}/featured-catalog-${variant}.webp`,capture,variant==="wide"?1600:900);
      outputs.push({...prepared,sourcePath:capturePath,sourceSha256:sha(await readFile(path.join(root,capturePath))),
        ...(excerpt?{excerpt}:{}),
        ...(screenFrames?{sourcePaths:screens.map(screen=>screen.path),screenFrames,composition:"Three complete actual screens, aspect ratios preserved; mobile uses the Home screen"}:{})});
    }
    record(`featured-${id}`,bytes,{sourcePath,sourceUrl:source.url,sourceRef:source.ref},source.kind??"screenshot",
      source.kind==="architecture"?"Original project architecture documentation, not hardware or gameplay evidence.":
        "Actual project UI; underlying product artwork and trademarks retained.",outputs,{caption:source.ref,fit,sources:screens});
    featured.push({id,view:source.kind==="architecture"?"architecture":"catalog",sourcePath,sourceUrl:source.url,sourceRef:source.ref,sourceSha256:sha(bytes),kind:source.kind??"screenshot",fit,background,sources:screens,outputs,
      ...(source.homeOnly?{homeOnly:true}:{})});
  }
  featured.sort((a,b)=>featuredProjectIds.indexOf(a.id)-featuredProjectIds.indexOf(b.id));
  await writeFile(path.join(root,"docs/v2/assets/featured-media.json"),JSON.stringify(featured,null,2)+"\n");
}

async function toolIcons() {
  const definitions = [
    ["arduino", "arduino/arduino-original.svg"],
    ["vscode", "vscode/vscode-original.svg"],
    ["matlab", "matlab/matlab-original.svg"],
    ["mysql", "mysql/mysql-original.svg"],
    ["supabase", "supabase/supabase-original.svg"],
    ["figma", "figma/figma-original.svg"],
  ];
  for (const [id, file] of definitions) {
    const url = `https://raw.githubusercontent.com/devicons/devicon/v2.17.0/icons/${file}`;
    const bytes = await download(`tool-${id}.svg`, url);
    const svg = bytes.toString("utf8");
    if (!/<svg[\s>]/.test(svg) || /<script|<foreignObject|<image|(?:href|src)=["']https?:/i.test(svg)) throw new Error(`Unexpected tool SVG: ${id}`);
    const metadata = await sharp(bytes).metadata();
    const relative = `media/tools/${id}.svg`;
    await output(relative, bytes);
    record(`tool-${id}`, bytes, { sourceUrl: url, sourceRef: "devicon v2.17.0" }, "identity",
      "Devicon MIT distribution; respective brand trademarks retained.",
      [{ path: relative, width: metadata.width, height: metadata.height }]);
  }
  const license = await download("devicon-LICENSE", "https://raw.githubusercontent.com/devicons/devicon/v2.17.0/LICENSE");
  await output("licenses/devicon-LICENSE.txt", license);
  const url = "https://opencode.ai/favicon.svg";
  const bytes = await download("tool-opencode.svg", url);
  if (/<script|<foreignObject|<image/i.test(bytes.toString("utf8"))) throw new Error("Unexpected OpenCode icon content");
  await output("media/tools/opencode.svg", bytes);
  record("tool-opencode", bytes, { sourceUrl: url, sourceRef: "official site favicon, captured source hash above" },
    "identity", "Official OpenCode identity; brand attribution, not agent-authored artwork.",
    [{ path: "media/tools/opencode.svg", width: 512, height: 512 }]);
}

async function resume() {
  const sourcePath = "assets/masters/documents/Resume.pdf";
  const bytes = await readFile(path.join(root, sourcePath));
  await output("assets/documents/Resume.pdf", bytes);
  record("resume", bytes, { sourcePath, sourceRef: "existing resume, byte-identical copy" }, "document",
    "Owner-provided resume.", [{ path: "assets/documents/Resume.pdf", width: null, height: null }]);
}

async function socialIcons() {
  for (const id of ["email","instagram","github","linkedin","youtube","tiktok"]) {
    const sourcePath = `assets/masters/social-icons/${id}.svg`;
    const bytes = await readFile(path.join(root,sourcePath));
    if (/<script|foreignObject|<image|(?:href|src)=["']https?:/i.test(bytes.toString("utf8"))) throw new Error(`Unexpected social SVG ${id}`);
    const relative = `media/social/${id}.svg`;
    await output(relative,bytes);
    record(`social-${id}`,bytes,{sourcePath,sourceRef:"Existing portfolio V1 icon, byte-identical curated copy"},"identity",
      "Existing portfolio icon; original brand trademarks retained.",[{path:relative,width:24,height:24}]);
  }
}

const featuredOnly=process.argv.includes("--featured-only");
const requested=process.argv.find(arg=>arg.startsWith("--projects="))?.slice("--projects=".length).split(",");
if(requested&&(!featuredOnly||!requested.length||requested.some(id=>!featuredProjectIds.includes(id))))throw new Error("Invalid targeted featured selection");
if(featuredOnly) {
  const existing=JSON.parse(await readFile(path.join(root,"docs/v2/assets/manifest.json"),"utf8"));
  manifest.push(...existing.filter(item=>!(requested??featuredProjectIds).map(id=>`featured-${id}`).includes(item.id)));
  await featuredArt(requested);
} else {
  await mkdir(cache, { recursive: true });
  await brand();
  await portraits();
  await fonts();
  await remoteArt();
  await featuredArt();
  await toolIcons();
  await resume();
  await socialIcons();
  await lanyard();
}
manifest.sort((a, b) => a.id.localeCompare(b.id));
await mkdir(path.join(root, "docs/v2/assets"), { recursive: true });
await writeFile(path.join(root, "docs/v2/assets/manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
if(!featuredOnly)await copyFile(path.join(root, "docs/v2/assets/manifest.json"), path.join(cache, "manifest-last-run.json"));
console.log(featuredOnly?`Prepared only ${(requested??featuredProjectIds).length*2} selected featured derivatives; other assets untouched.`:`Prepared ${manifest.length} sourced assets under public; visual integration remains pending.`);
