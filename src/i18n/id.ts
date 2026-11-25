import type { SiteCopy } from "./types.ts";

const contactSentences = [
  "Saya terbuka untuk pekerjaan full-time, freelance, dan kolaborasi.",
  "Mari diskusikan kebutuhan Anda.",
] as const;

export const id: SiteCopy = {
  stats:{label:"Portfolio dalam angka",projects:"Project",years:"Tahun aktif",technologies:"Teknologi",since:"Sejak"},
  hiring:{
    title:"Mari bangun project berikutnya.",
    introduction:"Saya dapat membantu Anda mengembangkan App Web, App Mobile, Machine Learning, dan Embedded System. Saya juga mengintegrasikan software dan hardware sesuai kebutuhan sistem yang ingin Anda bangun.",
    opportunities:"Saya terbuka untuk pekerjaan full-time, freelance, dan kolaborasi secara remote atau hybrid. Kenali pekerjaan saya melalui project berikut, atau lihat resume untuk mengetahui latar belakang saya.",
    rolesLabel:"Bidang pekerjaan",projectsAction:"Lihat project",
    roles:["Computer Engineer","AI Engineer","Embedded AI","Web Developer","App Developer","End-to-End Builder"],
  },
  lanyard: { flip:"Balik kartu", instruction:"Tarik dan lepaskan kartu. Klik atau gunakan tombol untuk membaliknya." },
  nav: { home: "Home", project: "Project", contact: "Kontak", label: "Navigasi utama" },
  intro: {
    greeting: "Halo, saya",
    name: "Muhammad Faza",
    role: "AI, Software, & Embedded Systems",
    paragraphs: [
      "Saya adalah pengembang App Web, App Mobile, Machine Learning, dan Embedded System. Saya mengintegrasikan software dan hardware menjadi sistem yang menyelesaikan masalah tertentu. Dalam pengembangan produk Anda, saya dapat berperan sebagai System Engineer maupun Engineer Specialist.",
      "Saya menjaga integritas dalam setiap pekerjaan dan berkomitmen menyelesaikan apa yang sudah saya mulai. Saya belajar dari kegagalan, terbuka terhadap masukan, dan terus meningkatkan kemampuan serta kualitas pekerjaan saya.",
    ],
    motto: "1.0001 is better than 1",
  },
  actions: { work: "Lihat karya saya", contact: "Hubungi saya", resume: "Lihat resume", detail: "Lihat project", allProjects: "Semua project", back: "Kembali ke project" },
  preferences: { language: "Bahasa", theme: "Tema", light: "Terang", dark: "Gelap", menu:"Bahasa dan tema" },
  skills: {
    title: "Dari ide ke sistem.",
    lead: "Berikut tools dan teknologi yang saya gunakan. Pilih salah satu untuk membaca kegunaannya.",
    technologies: "Bahasa & teknologi", tools: "Tools",
    armor: "Lihat armor", portrait: "Lihat portrait", pause: "Jeda animasi", resume: "Lanjutkan animasi",
    all: "Lihat semua tools & teknologi", closeAll: "Tutup daftar", close: "Tutup penjelasan", open: "Buka penjelasan",
    select: "Pilih tool atau teknologi untuk membaca penjelasannya.",
    pausedPanel: "Dijeda saat penjelasan terbuka.", pausedList: "Dijeda saat daftar terbuka.",
    pausedManual: "Animasi dijeda.", pausedInteraction: "Dijeda selama berinteraksi dengan item.",
    unavailable: "Armor belum dapat dimuat. Portrait normal tetap tersedia.",
  },
    work: { title: "Beberapa karya unggulan.", mediaUnavailable: "Pratinjau belum tersedia." },
  contact: {
    title: "Ada yang ingin dibangun?",
    lead: contactSentences.join(" "), leadSentences: contactSentences,
    send: "Kirim email", copy: "Salin email", copied: "Email disalin.",
    copyFailed: "Email belum berhasil disalin. Pilih alamat di atas untuk menyalinnya secara manual.",
    profiles: "Temui saya di sini.",
    profilesLead: "Anda dapat menghubungi saya melalui email atau Instagram. Saya juga membagikan project dan proses pengerjaannya melalui profil berikut.",
    availability: "Terbuka untuk bekerja bersama.",
    availabilityText: "Full-time, freelance, dan kolaborasi. Remote atau hybrid.",
    preferred: "Untuk membahas project atau kebutuhan tim Anda, hubungi saya melalui email.",
  },
  catalog: {
    category: "Kategori project", emptyTitle: "Belum ada yang cocok.",
    emptyCategory: "Belum ada project dalam kategori ini. Pilih kategori lain atau tampilkan semua project.",
    mediaError: "Gambar belum dapat dimuat. Buka project untuk membaca ringkasannya.",
    title: "Project", lead: "Aplikasi, eksperimen, dan alat yang saya kerjakan.",
    search: "Cari project", placeholder: "Nama, teknologi, atau ringkasan", reset: "Hapus pencarian",
    empty: "Tidak ada project yang cocok. Coba kata lain atau hapus pencarian.", count: "project",
    noJs: "Semua project ditampilkan. Aktifkan JavaScript untuk memakai pencarian dan filter.",
  },
  categories: { all: "Semua", web: "Web", app: "App", hardware: "Hardware", hybrid: "Hybrid", tools: "Tools" },
  detail: { purpose: "Tentang project", stack: "Teknologi", evidence: "Bukti & materi", development: "Proses & pengembangan", source: "Lihat source", landing: "Buka landing", demo: "Buka demo", download: "Unduh", contribution: "Kontribusi" },
  common: { skip: "Lewati ke konten", copyright: "Muhammad Faza", navScroll: "Gulir area menu untuk melihat semua tautan.", notFound: "Halaman tidak ditemukan.", notFoundBody: "Alamat ini tidak tersedia. Kembali ke Home atau lihat project." },
};
