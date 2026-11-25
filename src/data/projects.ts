import type { Category, ProjectRecord } from "./types.ts";

interface Entry {
  id: string; slug?: string; title: string; category: Category; tags: string[];
  repo?: string; live?: { kind: "demo" | "landing"; url: string };
  summary: [string, string]; status: [string, string];
  detail: [string, string]; development: [string, string];
  runtimeEvidence?: ProjectRecord["evidence"];
}

const entries: Entry[] = [
  {
    id: "tazk", title: "Tazk", category: "app", tags: ["Flutter", "Dart", "Riverpod", "SQLite"],
    repo: "Tazk-Android-App", live: { kind: "landing", url: "https://tazk-manager-mfdu.vercel.app" },
    summary: ["Tugas, kebiasaan, dan sesi fokus dalam aplikasi Android offline-first.", "Tasks, habits, and focus sessions in an offline-first Android app."],
    status: ["APK v2.0 tersedia", "v2.0 APK available"],
    detail: ["Tazk menggabungkan pengelolaan tugas, kebiasaan, dan timer fokus tanpa mengharuskan akun atau koneksi internet.", "Tazk brings tasks, habits, and a focus timer together without requiring an account or an internet connection."],
    development: ["README, manifest, dan log rilis mencatat versi 2.0. Screenshot repo disebut berasal dari rilis tersebut. Pengujian pada perangkat belum diulang saat menyiapkan portfolio ini.", "The README, manifest, and release log record version 2.0. Repository screenshots are attributed to that release. Device testing has not been repeated while preparing this portfolio."],
  },
  {
    id: "gamein", title: "GameIn", category: "web", tags: ["Astro", "TypeScript", "Tailwind CSS"],
    repo: "gamein", live: { kind: "demo", url: "https://gamein-8cq.pages.dev" },
    summary: ["Katalog game dengan mini-game original dan artikel dalam situs statis.", "A static game catalog with original mini-games and articles."],
    status: ["Situs publik", "Public site"],
    detail: ["GameIn menyusun katalog game, artikel, dan mini-game dalam satu situs berbasis Astro.", "GameIn brings a game catalog, articles, and mini-games together in an Astro-based site."],
    development: ["Struktur dan teknologi situs merujuk pada README serta manifest. Statistik dan hasil tes yang dicantumkan repo belum diverifikasi melalui pengukuran independen.", "The site's structure and technologies are documented in its README and manifest. Repository statistics and test results have not been independently verified."],
  },
  {
    id: "stackcrate", title: "StackCrate", category: "web", tags: ["Next.js", "TypeScript", "Supabase", "Cloudflare R2"],
    repo: "StackCrate", live: { kind: "demo", url: "https://stack-crate.vercel.app" },
    summary: ["Katalog aset editing video dengan penjelajahan publik dan fitur berbasis akun.", "A video-editing asset catalog with public browsing and account-based features."],
    status: ["Situs publik", "Public site"],
    detail: ["StackCrate menyusun aset editing video dalam katalog publik. Unduhan, favorit, dan pengelolaan aset merupakan fitur berbasis akun menurut dokumentasi project.", "StackCrate organizes video-editing assets in a public catalog. Its documentation describes downloads, favorites, and asset management as account-based features."],
    development: ["Next.js, Supabase, dan integrasi S3 terlihat pada manifest; R2 disebut dalam dokumentasi. Alur login dan unduhan belum diuji ulang untuk portfolio.", "The manifest includes Next.js, Supabase, and S3 integration; the documentation identifies R2. Login and download flows have not been retested for the portfolio."],
  },
  {
    id: "capify", title: "Capify", category: "web", tags: [],
    live: { kind: "demo", url: "https://capify-v1-demo.vercel.app/" },
    summary: ["Demo web untuk menyiapkan subtitle video dan mengatur gaya teks.", "A web demo for preparing video subtitles and styling text."],
    status: ["Demo; backend offline", "Demo; backend offline"],
    detail: ["Capify menyediakan demo antarmuka untuk menyiapkan subtitle dan gaya teks video. Repo source publiknya belum teridentifikasi.", "Capify provides a demo interface for preparing video subtitles and text styles. A public source repository has not been identified."],
    development: ["Studio melaporkan backend offline saat diperiksa. Proses unggah dan ekspor video belum terverifikasi. Framework dan arsitektur backend belum dapat dipastikan dari sumber yang tersedia.", "The studio reported an offline backend when inspected. Video upload and export remain unverified. The available sources do not establish its framework or backend architecture."],
  },
  {
    id: "mariokan", title: "MarioKan", category: "hardware", tags: ["Architecture", "Hardware"],
    repo: "MarioKan",
    summary: ["Eksplorasi arsitektur hardware dengan diagram dan probe mandiri.", "A hardware architecture exploration with diagrams and standalone probes."],
    status: ["Arsitektur & probe", "Architecture & probes"],
    detail: ["Materi MarioKan saat ini berfokus pada rancangan arsitektur dan probe mandiri, bukan demonstrasi game-on-board yang sudah selesai.", "MarioKan currently focuses on architecture design and standalone probes, not a completed game-on-board demonstration."],
    development: ["Diagram yang tersedia menjelaskan rancangan arsitektur. Hasil hardware, netlist tersintesis, dan gameplay belum ditunjukkan oleh materi tersebut.", "The available diagram documents the architecture design. It does not demonstrate finished hardware, a synthesized netlist, or gameplay."],
  },
  {
    id: "brawl-buddies", title: "Brawl Buddies: Chaos Kitchen", category: "web", tags: ["React", "TypeScript", "Phaser", "Vite"],
    repo: "game-chef-pixel", live: { kind: "demo", url: "https://game-chef-pixel.pages.dev/" },
    summary: ["Prototype game browser dengan scaffold gameplay dan rencana pengembangan.", "A browser-game prototype with a gameplay scaffold and development plans."],
    status: ["Prototype", "Prototype"],
    detail: ["README menjelaskan Brawl Buddies sebagai prototype/scaffold game browser. Manifest frontend memuat React, Phaser, dan Vite.", "The README describes Brawl Buddies as a browser-game prototype/scaffold. Its frontend manifest includes React, Phaser, and Vite."],
    development: ["Mekanik lanjutan dan backend opsional masih berupa rencana, bukan gameplay yang sudah teruji. Artwork pihak ketiga bukan karya original saya.", "Advanced mechanics and the optional backend remain planned work rather than verified gameplay. Third-party artwork is not my original work."],
  },
  {
    id: "mini-notepad", slug: "mini-notepad-cpp", title: "Mini Notepad C++", category: "tools", tags: ["C++", "CLI"],
    repo: "mini-notepad-cpp",
    summary: ["Editor terminal C++ yang mengeksplorasi tab serta undo/redo.", "A C++ terminal editor exploring tabs and undo/redo."],
    status: ["Eksperimen CLI", "CLI experiment"],
    detail: ["Source dan README menunjukkan editor berbasis struktur linked dengan tab serta stack undo/redo.", "The source and README describe a linked-structure editor with tabs and undo/redo stacks."],
    development: ["Fitur save/load dan GUI belum diimplementasikan menurut README. Bukti yang tersedia menunjukkan editor terminal, bukan antarmuka grafis.", "The README lists save/load and a GUI as unimplemented. Available evidence shows a terminal editor, not a graphical interface."],
  },
  {
    id: "czip", title: "CZIP", category: "tools", tags: ["C", "CLI", "Compression"],
    repo: "CZIP-simple-compression-txt",
    summary: ["Tool kompresi CLI dalam C dengan jalur RLE, Huffman, dan CRC32.", "A C compression CLI with RLE, Huffman, and CRC32 paths."],
    status: ["Tool CLI", "CLI tool"],
    detail: ["README dan source memperlihatkan proses encode/decode, modul RLE/Huffman, CRC32, serta materi tes dan Makefile.", "The README and source show encode/decode operations, RLE/Huffman modules, CRC32, tests, and a Makefile."],
    development: ["Kompresi Huffman, verifikasi integritas, dan dekompresi telah dijalankan pada fixture teks 600 byte untuk capture portfolio; hasil roundtrip identik. Ini uji contoh terbatas, bukan benchmark performa atau bukti semua jalur algoritma.", "Huffman compression, integrity verification, and decompression were run on a 600-byte text fixture for the portfolio capture; the roundtrip was byte-identical. This limited fixture run is not a performance benchmark or proof of every algorithm path."],
    runtimeEvidence: [{sourceUrl:"https://github.com/MuhammadFaza-DU/CZIP-simple-compression-txt/tree/3e4144a3bee193c9d1a6be515a4a9f358f797567",checkedAt:"2026-11-15",kind:"runtime-checked",scope:"Original GCC C11 build; sample.txt 600-byte fixture, Huffman compression/verify/decompress and byte-identical roundtrip only. Raw stdout retained as local capture evidence."}],
  },
  {
    id: "codecraft", slug: "codecraft-optimizer", title: "CodeCraft Optimizer", category: "tools", tags: ["Markdown", "Agent skill"],
    repo: "codecraft-optimizer-ide",
    summary: ["Skill instruksi yang dapat digunakan ulang untuk agent dan IDE.", "A reusable instruction skill for agents and IDEs."],
    status: ["Skill instruksi", "Instruction skill"],
    detail: ["CodeCraft berisi instruksi, referensi, dan metadata untuk coding agent. Bentuk produknya adalah skill instruksi, bukan aplikasi editor C++.", "CodeCraft contains instructions, references, and coding-agent metadata. It is an instruction skill, not a C++ editor application."],
    development: ["Efektivitas terhadap kualitas kode atau performa agent belum dibenchmark secara independen. Source instruksi ditampilkan sebagai materi, bukan dijalankan oleh portfolio.", "Its impact on code quality or agent performance has not been independently benchmarked. Instruction sources are presented as material, not executed by the portfolio."],
  },
  {
    id: "optimizer-ai-web", title: "Optimizer AI Web", category: "tools", tags: ["Markdown", "AI instructions"],
    repo: "optimizer-ai-web",
    summary: ["Dokumen instruksi untuk dipakai bersama AI web atau chat.", "Instruction documents for use with web or chat AI."],
    status: ["Dokumen instruksi", "Instruction documents"],
    detail: ["Repo berisi instruksi paste-in/uploadable untuk AI web/chat. Ini bukan layanan chat yang di-host sebagai aplikasi tersendiri.", "The repository contains paste-in/uploadable instructions for web/chat AI. It is not a separately hosted chat application."],
    development: ["Efektivitas instruksi belum diukur melalui benchmark untuk portfolio ini. Materi arsip repo belum dibongkar atau dijalankan.", "The instructions' effectiveness has not been benchmarked for this portfolio. Archived repository material has not been unpacked or executed."],
  },
  {
    id: "portfolio", title: "Muhammad Faza Portfolio", category: "web", tags: ["Astro", "React", "TypeScript", "Three.js"],
    repo: "Muhammad-Faza", live: { kind: "demo", url: "https://muhammadfaza.vercel.app" },
    summary: ["Portfolio V2 dengan karya, interaksi 3D, dan konten Indonesia/English, dibangun dengan Astro.", "An Astro-based V2 portfolio with projects, 3D interactions, and Indonesian/English content."],
    status: ["V2 sedang dikembangkan", "V2 in development"],
    detail: ["Bukti publik project ini merujuk pada implementasi Next.js V1. Astro V2 sedang dibangun secara lokal dan tidak disamakan dengan versi publik.", "Public evidence for this project refers to the Next.js V1 implementation. Astro V2 is being built locally and is not presented as the public version."],
    development: ["Source dan aset V1 disimpan terpisah sebagai arsip read-only. Halaman portfolio tidak mengekspos folder arsip tersebut.", "V1 source and assets are retained in a separate read-only archive. The portfolio does not expose that archive."],
  },
];

export const projects: ProjectRecord[] = entries.map((entry) => {
  const source = entry.repo ? `https://github.com/MuhammadFaza-DU/${entry.repo}` : entry.live!.url;
  const content = (index: 0 | 1) => ({
    title: entry.title, summary: entry.summary[index], status: entry.status[index],
    purpose: entry.detail[index], contribution: null,
    workingEvidence: [], development: [entry.development[index]],
  });
  return {
    id: entry.id, slug: entry.slug ?? entry.id, category: entry.category,
    tags: entry.tags, thumbnailId: entry.id, firstPublished: null,
    links: [
      ...(entry.live ? [{ kind: entry.live.kind, url: entry.live.url, ...(entry.id === "portfolio" ? { label: { id: "Demo publik V1", en: "Public V1 demo" } } : {}) }] : []),
      ...(entry.repo ? [{ kind: "source" as const, url: source, ...(entry.id === "portfolio" ? { label: { id: "Source publik V1", en: "Public V1 source" } } : {}) }] : []),
    ],
    evidence: [...(entry.runtimeEvidence??[]),{
      sourceUrl: source, checkedAt: "2026-11-14", kind: "source-inspected",
      scope: entry.repo ? "README/manifests/source inspected; not a complete runtime test." : "Public demo page/icon availability only; no repository or backend verification.",
    }],
    content: { id: content(0), en: content(1) },
  };
});
