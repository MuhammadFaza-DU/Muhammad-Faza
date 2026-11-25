import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const safePath = (relative, prefix) => {
  if (!relative.startsWith(prefix) || relative.includes("..") || path.isAbsolute(relative)) {
    throw new Error(`Catalog path outside owned roots: ${relative}`);
  }
  return path.resolve(root, relative);
};
const entries = JSON.parse(await readFile(path.join(root, "docs/v2/assets/catalog-sources.json"), "utf8"));
const manifest = [];
for (const entry of entries) {
  if (!/^[a-z0-9-]+$/.test(entry.id) || manifest.some(item => item.id === entry.id)) throw new Error("Invalid catalog ID");
  const sources = [];
  for (const source of entry.sources) {
    const bytes = await readFile(safePath(source.path, "assets/masters/"));
    const { width, height } = await sharp(bytes).metadata();
    if (!width || !height) throw new Error(`Undecodable media: ${source.path}`);
    sources.push({ ...source, sha256: sha(bytes), width, height });
  }
  const recipe = entry.recipe;
  let image;
  if (recipe.kind === "screens") {
    const layers = [];
    for (const [index, source] of sources.entries()) {
      if (source.width < 280 || source.height < 576) throw new Error("Undersized app screen");
      const input = await sharp(safePath(source.path, "assets/masters/"))
        .resize(280, 576, { fit: "contain", background: recipe.background, withoutEnlargement: true }).png().toBuffer();
      layers.push({ input, left: 44 + index * 296, top: 12 });
    }
    image = sharp({ create: { width: 960, height: 600, channels: 3, background: recipe.background } }).composite(layers);
  } else {
    const source = sources[0];
    if (source.width < 960 || source.height < 600) throw new Error(`Undersized source: ${source.path}`);
    image = sharp(safePath(source.path, "assets/masters/"));
    if (recipe.kind === "crop") image = image.extract({ left: recipe.left, top: recipe.top, width: recipe.width, height: recipe.height });
    image = image.resize(960, 600, { fit: "contain", background: recipe.background, withoutEnlargement: true });
  }
  const prepared = await image.png().toBuffer();
  const outputs = [];
  for (const width of [320, 640, 960]) {
    const height = width * 5 / 8;
    const bytes = await sharp(prepared).resize(width, height).webp({ quality: 88 }).toBuffer();
    const relative = `media/catalog/${entry.id}-${width}.webp`;
    const target = safePath(`public/${relative}`, "public/media/catalog/");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    outputs.push({ path: relative, width, height, sha256: sha(bytes) });
  }
  manifest.push({ id: entry.id, alt: entry.alt, recipe, sources, outputs });
}
await writeFile(path.join(root, "docs/v2/assets/catalog-media.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Catalog only: ${manifest.length} evidence sets, ${manifest.length * 3} responsive images.`);
