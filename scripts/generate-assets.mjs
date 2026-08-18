import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (p) => readFileSync(resolve(root, p));
const write = (p, data) => writeFileSync(resolve(root, p), data);

const NAV_W = 256;
const PROFILE_W = 800;
const BG_W = 1920;
const LOGO_W = 512;

// 1) Navbar photo: from 374KB PNG shown at 32px
write(
  "public/assets/images/foto-profil-nav.webp",
  await sharp(read("public/assets/images/Foto Profil.png"))
    .resize(NAV_W)
    .webp({ quality: 80 })
    .toBuffer()
);

// 2) Profile photo (HiringSection / TiltPhoto)
write(
  "public/assets/images/profile.webp",
  await sharp(read("public/assets/images/FOTO TERKEREN.webp"))
    .resize(PROFILE_W, undefined, { withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer()
);

// 3) Full-screen fixed background
write(
  "public/assets/images/bg-statis.webp",
  await sharp(read("public/assets/images/BG_Statis.webp"))
    .resize(BG_W, undefined, { withoutEnlargement: true })
    .webp({ quality: 68 })
    .toBuffer()
);

// 4) Intro logo: extract the embedded PNG from the oversize SVG wrapper
const mfSvg = read("public/assets/icon/icon/mf_fix2.svg").toString("utf-8");
const match = mfSvg.match(/data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)/);
if (!match) throw new Error("mf_fix2.svg: embedded raster not found");
const logoInner = Buffer.from(match[1], "base64");

write(
  "public/assets/icon/icon/mf-intro.webp",
  await sharp(logoInner)
    .resize(LOGO_W, undefined, { withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
);

const logoRaster = await sharp(logoInner).resize(420).png().toBuffer();
const logoRasterSmall = await sharp(logoInner).resize(112).png().toBuffer();

// 5) OG image 1200x630 (text-free branded card; typography refinable later)
const glowSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="20%" cy="10%" r="60%">
      <stop offset="0%" stop-color="rgba(16,185,129,0.22)"/>
      <stop offset="100%" stop-color="rgba(16,185,129,0)"/>
    </radialGradient>
    <radialGradient id="g2" cx="82%" cy="25%" r="55%">
      <stop offset="0%" stop-color="rgba(52,211,153,0.16)"/>
      <stop offset="100%" stop-color="rgba(52,211,153,0)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#05070b"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
</svg>`;

const ogBase = await sharp(Buffer.from(glowSvg)).resize(1200, 630).png().toBuffer();
write(
  "public/og.png",
  await sharp(ogBase)
    .composite([{ input: logoRaster, left: (1200 - 420) / 2, top: (630 - 420) / 2 }])
    .png()
    .toBuffer()
);

// 6) Apple touch icon 180x180 (iOS ignores SVG icons)
write(
  "public/apple-touch-icon.png",
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: "#05070b" },
  })
    .composite([{ input: logoRasterSmall, left: 34, top: 34 }])
    .png()
    .toBuffer()
);

console.log("assets generated");
