import type {Localized} from "./types.ts";

export interface DetailContent {
  deliverable: string;
  overview: string[];
  highlights: {title:string;body:string}[];
  implementation: string;
  mediaCaption: string;
  sources: {label:string;url:string}[];
}

type Pair<T> = [T,T];
interface DetailEntry {
  id:string;
  deliverable:Pair<string>;
  overview:Pair<string[]>;
  highlights:{title:Pair<string>;body:Pair<string>}[];
  implementation:Pair<string>;
  mediaCaption:Pair<string>;
  sources:{label:Pair<string>;url:string}[];
}
const readme=(repo:string,ref:string)=>`https://github.com/MuhammadFaza-DU/${repo}/blob/${ref}/README.md`;
const entries:DetailEntry[]=[
  {
    id:"tazk",deliverable:["Aplikasi Android","Android application"],
    overview:[
      ["Tazk menyatukan tugas harian, kebiasaan, dan sesi fokus dalam satu aplikasi Android. Pengguna dapat melihat agenda hari ini, menyelesaikan tugas, mencatat kebiasaan, lalu menjalankan Pomodoro tanpa berpindah aplikasi.",
        "Data disimpan dalam SQLite di perangkat, tanpa kewajiban membuat akun. Kalender dan statistik membantu membaca aktivitas yang sudah tercatat, sementara pengingat dan widget membawa sebagian fungsi aplikasi ke luar layar utamanya."],
      ["Tazk combines daily tasks, habits, and focus sessions in one Android app. Users can check today's agenda, finish tasks, log habits, and start a Pomodoro without switching applications.",
        "Data lives in SQLite on the device, with no account required. A calendar and statistics make recorded activity easier to review, while reminders and home-screen widgets bring parts of the workflow outside the main app."],
    ],
    highlights:[
      {title:["Tugas & kebiasaan","Tasks & habits"],body:["Tugas memiliki prioritas, jadwal, dan subtugas. Kebiasaan memakai jadwal serta catatan per tanggal agar tampilan hari ini dan kalender merujuk data yang sama.","Tasks have priorities, schedules, and subtasks. Habits use schedules and per-date logs so the today and calendar views refer to the same records."]},
      {title:["Fokus & progres","Focus & progress"],body:["Timer fokus dapat berjalan mandiri atau terhubung dengan kebiasaan. Statistik merangkum penyelesaian, waktu fokus, XP, dan pola kebiasaan.","The focus timer can run on its own or link to a habit. Statistics summarize completion, focus time, XP, and habit patterns."]},
      {title:["Data tetap di perangkat","On-device data"],body:["Ekspor/impor JSON menyediakan jalur cadangan data dengan checksum. Pengecekan versi dilakukan manual dari pengaturan, bukan polling latar belakang.","JSON export/import provides a backup path with a checksum. Update checks are started manually from Settings rather than background polling."]},
    ],
    implementation:["Flutter dan Riverpod menangani antarmuka serta state aplikasi. Drift menjadi lapisan akses SQLite, sementara integrasi Android memakai Kotlin dan RemoteViews untuk widget. Fitur dipisahkan ke area tugas, kebiasaan, kalender, fokus, statistik, dan pengaturan.",
      "Flutter and Riverpod handle the interface and application state. Drift provides access to SQLite, while the Android integration uses Kotlin and RemoteViews for widgets. Features are organized into tasks, habits, calendar, focus, statistics, and settings."],
    mediaCaption:["Screenshot aplikasi dari dokumentasi repo: Home, Pomodoro, dan statistik. Bukan capture perangkat baru untuk portfolio ini.","Application screenshots from repository documentation: Home, Pomodoro, and statistics. Not newly captured on a device for this portfolio."],
    sources:[{label:["README aplikasi","Application README"],url:readme("Tazk-Android-App","bf2788fe0a7c7f53525361084ecd4a70143f25ec")}],
  },
  {
    id:"gamein",deliverable:["Katalog, arcade, & artikel","Catalog, arcade, & articles"],
    overview:[
      ["GameIn menyediakan katalog game, mini-game browser, dan artikel terkait. Pengunjung dapat mencari game atau menjelajahi koleksi berdasarkan dekade, genre, dan platform.",
        "Setiap game memiliki halaman detail dengan informasi dan sumbernya. Bagian arcade memuat Snake, Breakout, dan Memory Match, sedangkan artikel menaut kembali ke game terkait sehingga penjelajahan tidak berhenti pada daftar judul."],
      ["GameIn offers a game catalog, browser mini-games, and related articles. Visitors can search for games or browse collections by decade, genre, and platform.",
        "Each game has a detail page with information and sources. The arcade includes Snake, Breakout, and Memory Match, while articles link back to relevant games so exploration goes beyond a list of titles."],
    ],
    highlights:[
      {title:["Jelajah lintas era","Explore across eras"],body:["Pencarian dan koleksi memberi beberapa jalur masuk ke katalog. Halaman detail memisahkan ringkasan, fakta game, dan atribusi sumber.","Search and collections provide several routes into the catalog. Detail pages separate the summary, game facts, and source attribution."]},
      {title:["Arcade di browser","Browser arcade"],body:["Mini-game menggunakan Canvas 2D dan Web Audio. Aturan permainan dipisahkan dari input serta rendering agar logikanya dapat diuji tanpa DOM.","The mini-games use Canvas 2D and Web Audio. Game rules are separated from input and rendering so their logic can be tested without the DOM."]},
      {title:["Konten saling terhubung","Connected content"],body:["Artikel merujuk record katalog, sementara sumber teks dan artwork tetap dicatat terpisah dari lisensi kode situs.","Articles refer to catalog records, while text and artwork sources are recorded separately from the site's code license."]},
    ],
    implementation:["Astro menghasilkan halaman statis dari data katalog dan konten, dengan TypeScript untuk logika serta Tailwind CSS untuk styling. Situs dilayani melalui Cloudflare Pages tanpa backend akun; JavaScript dipakai pada interaksi yang membutuhkannya, termasuk arcade.",
      "Astro generates static pages from catalog data and content, with TypeScript for logic and Tailwind CSS for styling. Cloudflare Pages serves the site without an account backend; JavaScript powers interactions that need it, including the arcade."],
    mediaCaption:["Capture asli katalog GameIn yang berjalan, termasuk pencarian, filter, dan daftar game. Artwork game tetap milik pemegang haknya.","A genuine capture of the running GameIn catalog, including search, filters, and game listings. Game artwork belongs to its respective rights holders."],
    sources:[{label:["README GameIn","GameIn README"],url:readme("gamein","6bb116f5bd6ed4cb59b73a57ab39b372f52fd6e3")}],
  },
  {
    id:"stackcrate",deliverable:["Katalog aset audio & video","Audio & video asset catalog"],
    overview:[
      ["StackCrate mengumpulkan aset untuk editing video dalam katalog yang dapat ditelusuri lewat kategori dan pencarian. Tujuannya memudahkan editor menemukan klip atau audio tanpa berpindah-pindah di antara banyak sumber.",
        "Penjelajahan publik dipisahkan dari fitur berbasis akun. Dokumentasi menjelaskan preview audio/video, favorit, dan unduhan, serta area administrasi untuk mengelola aset, kategori, dan status publikasinya."],
      ["StackCrate brings video-editing assets into a catalog that can be explored through categories and search. It is intended to help editors find clips or audio without moving between many separate sources.",
        "Public browsing is separated from account-based features. The documentation describes audio/video previews, favorites, and downloads, alongside an administration area for assets, categories, and publishing status."],
    ],
    highlights:[
      {title:["Pencarian & kategori","Search & categories"],body:["Kartu aset menampilkan thumbnail, judul, kategori, dan jenis media. Filter serta urutan hasil membantu mempersempit daftar.","Asset cards show a thumbnail, title, category, and media type. Filters and sorting help narrow the listing."]},
      {title:["Alur pengguna","User workflow"],body:["Katalog dapat dijelajahi tanpa login. Menurut dokumentasi, favorit tersimpan dan unduhan memakai autentikasi, terpisah dari penjelajahan publik.","The catalog is browsable without signing in. According to the documentation, saved favorites and downloads use authentication, separate from public browsing."]},
      {title:["Pengelolaan aset","Asset management"],body:["Rancangan admin mencakup unggah, metadata, kategori, draft/publikasi, dan aset unggulan. Alur admin tidak diuji dalam penyiapan portfolio.","The documented admin workflow covers uploads, metadata, categories, drafts/publishing, and featured assets. Admin flows were not tested while preparing this portfolio."]},
    ],
    implementation:["Next.js App Router menangani halaman dan API. Supabase menyediakan database serta autentikasi, sedangkan Cloudflare R2 menyimpan media melalui antarmuka kompatibel S3. Dokumentasi memisahkan API katalog, favorit, thumbnail, dan URL unduhan.",
      "Next.js App Router handles pages and APIs. Supabase provides the database and authentication, while Cloudflare R2 stores media through an S3-compatible interface. The documentation separates catalog, favorites, thumbnail, and download-URL APIs."],
    mediaCaption:["Capture asli grid aset publik StackCrate. Ini bukti tampilan penjelajahan, bukan verifikasi fitur login, unduhan, atau admin.","A genuine capture of StackCrate's public asset grid. It documents browsing, not verification of login, downloads, or administration."],
    sources:[{label:["README StackCrate","StackCrate README"],url:readme("StackCrate","6d8814c5d3d35ee25a5fa65dfb83371b40c7f174")}],
  },
  {
    id:"capify",deliverable:["Demo antarmuka subtitle","Subtitle interface demo"],
    overview:[
      ["Capify adalah demo web yang memperkenalkan alur penyiapan subtitle video dan pengaturan gaya teks. Halaman publiknya menjadi pintu masuk ke studio, tempat proses kerja video ditampilkan dalam antarmuka.",
        "Halaman publik dan studio dapat ditampilkan, tetapi studio melaporkan backend offline saat diperiksa. Proses unggah, pembuatan subtitle, dan ekspor belum terverifikasi."],
      ["Capify is a web demo presenting a video-subtitle preparation and text-styling workflow. Its public page leads into a studio interface for the video workflow.",
        "The public page and studio interface are available to view, but the studio reported an offline backend when inspected. Upload, subtitle generation, and export remain unverified."],
    ],
    highlights:[
      {title:["Alur subtitle video","Video-subtitle workflow"],body:["Fokus demo adalah antarmuka untuk menyiapkan subtitle dan gaya teks. Gambar yang ditampilkan berasal dari halaman publik asli.","The demo focuses on an interface for preparing subtitles and text styles. The displayed image comes from its genuine public page."]},
      {title:["Batas demo","Demo limitations"],body:["Demo memperlihatkan antarmuka, bukan proses pengolahan video yang sudah teruji. Backend perlu tersedia sebelum alur tersebut dapat diperiksa.","The demo shows the interface, not verified video processing. The backend needs to be available before that workflow can be checked."]},
    ],
    implementation:["Repo source publik Capify belum teridentifikasi. Framework, layanan AI, dan arsitektur backend belum dapat dipastikan dari sumber yang tersedia. Penjelasan teknis saat ini terbatas pada antarmuka demo yang dapat diperiksa.",
      "A public source repository for Capify has not been identified. The available sources do not establish its framework, AI service, or backend architecture. Technical information is currently limited to the demo interface that can be inspected."],
    mediaCaption:["Capture halaman publik Capify. Studio melaporkan backend offline; gambar ini bukan bukti unggah atau ekspor video berhasil.","A capture of Capify's public page. The studio reported an offline backend; this image is not proof of successful video upload or export."],
    sources:[{label:["Halaman publik Capify","Capify public page"],url:"https://capify-v1-demo.vercel.app/"}],
  },
  {
    id:"mariokan",deliverable:["Rancangan FPGA & probe","FPGA design & probes"],
    overview:[
      ["MarioKan adalah rancangan platformer 2D untuk FPGA Digilent Basys 3. Targetnya menjalankan logika pemain, collision, dan keluaran video langsung dalam VHDL, tanpa soft CPU atau sistem operasi.",
        "Tahap yang tersedia saat ini adalah arsitektur fungsional dan probe mandiri. Diagram menunjukkan pembagian tanggung jawab hardware, bukan game yang sudah dapat dimainkan, netlist hasil sintesis, atau demonstrasi game-on-board."],
      ["MarioKan is a 2D platformer design for the Digilent Basys 3 FPGA. The target is to implement player logic, collision, and video output directly in VHDL, without a soft CPU or operating system.",
        "The available stage consists of functional architecture and standalone probes. The diagram documents hardware responsibilities, not a playable game, synthesized netlist, or game-on-board demonstration."],
    ],
    highlights:[
      {title:["Blok hardware yang terpisah","Separate hardware blocks"],body:["Rancangan memisahkan input, game controller, pemain, musuh, collision, memori level/aset, generator video, dan keluaran status.","The design separates input, game control, player and enemy logic, collision, level/asset memory, video generation, and status outputs."]},
      {title:["Jalur video terencana","Planned video path"],body:["Renderer dirancang membaca tile dan sprite saat piksel dipindai, bukan menyimpan satu framebuffer penuh. Integrasi video tetap memerlukan verifikasi.","The renderer is designed to fetch tiles and sprites as pixels are scanned, rather than store a complete framebuffer. Integrated video still requires verification."]},
      {title:["Target, bukan hasil jadi","A target, not a finished result"],body:["Kontrol tombol board dan keyboard eksternal merupakan bagian rancangan. Probe terpisah tidak dinyatakan sebagai implementasi gameplay lengkap.","Board-button and external-keyboard controls belong to the design. Separate probes are not represented as a complete gameplay implementation."]},
    ],
    implementation:["Dokumentasi menargetkan FPGA Artix-7 pada Basys 3, logika VHDL, dan keluaran VGA. Arsitektur membagi jalur kontrol, state permainan, serta rendering; produksi RTL game dan pengujian terintegrasi masih menjadi pekerjaan lanjutan.",
      "The documentation targets the Basys 3's Artix-7 FPGA, VHDL logic, and VGA output. The architecture separates control, game state, and rendering; production game RTL and integrated testing remain future work."],
    mediaCaption:["Diagram arsitektur fungsional dari repo MarioKan. Dokumentasi desain, bukan screenshot game atau hasil hardware selesai.","The functional architecture diagram from the MarioKan repository. Design documentation, not a game screenshot or finished hardware result."],
    sources:[{label:["README & status MarioKan","MarioKan README & status"],url:readme("MarioKan","d584d7e876cf2b4025b281f05427e114c2f6abe7")}],
  },
  {
    id:"brawl-buddies",deliverable:["Prototype game browser","Browser-game prototype"],
    overview:[
      ["Brawl Buddies: Chaos Kitchen mengeksplorasi game beat 'em up bertema memasak untuk browser. Konsepnya menghubungkan pertarungan, pengumpulan bahan, dan memasak power-up sebagai satu loop permainan.",
        "Versi ini masih berupa playable scaffold atau prototype menurut repo. Aset pixel-art final, mekanik combat lanjutan, dan sinkronisasi multiplayer masih termasuk rencana pengembangan."],
      ["Brawl Buddies: Chaos Kitchen explores a cooking-themed browser beat 'em up. Its concept connects combat, ingredient collection, and cooking power-ups into one gameplay loop.",
        "The repository describes this version as a playable scaffold or prototype. Final pixel-art assets, advanced combat mechanics, and multiplayer synchronization remain planned work."],
    ],
    highlights:[
      {title:["Combat bertemu memasak","Combat meets cooking"],body:["Desain permainan memakai bahan yang dikumpulkan selama pertarungan untuk memasak efek bantuan. Ini menjelaskan konsep project, bukan hasil uji gameplay menyeluruh.","The game design uses ingredients collected during combat to cook useful effects. This describes the project's concept, not a comprehensive gameplay test."]},
      {title:["Canvas & HUD","Canvas & HUD"],body:["Phaser menangani area game, React menyusun antarmuka HUD, dan Zustand mengelola state frontend.","Phaser handles the game area, React builds the HUD interface, and Zustand manages frontend state."]},
      {title:["Batas prototype","Prototype boundary"],body:["Backend jaringan bersifat opsional dalam dokumentasi. Co-op dan leaderboard tidak disajikan sebagai fitur yang sudah diverifikasi di portfolio.","The documentation treats the networking backend as optional. Co-op and leaderboards are not presented as verified portfolio features."]},
    ],
    implementation:["Frontend memakai React, TypeScript, Vite, dan Phaser. Backend jaringan bersifat opsional dan didokumentasikan terpisah. Tampilan canvas serta antarmuka menjadi fondasi prototype; fitur jaringan belum terverifikasi.",
      "The frontend uses React, TypeScript, Vite, and Phaser. The optional networking backend is documented separately. The canvas and interface form the prototype's foundation; network features remain unverified."],
    mediaCaption:["Capture asli tampilan prototype browser. Aset pihak ketiga tidak dinyatakan sebagai artwork original milik pembuat portfolio.","A genuine capture of the browser prototype. Third-party assets are not represented as original artwork by the portfolio owner."],
    sources:[{label:["README prototype","Prototype README"],url:readme("game-chef-pixel","45c7a7f00c4e63463634aea339812c0b14a30f78")}],
  },
  {
    id:"mini-notepad",deliverable:["Editor teks terminal","Terminal text editor"],
    overview:[
      ["Mini Notepad C++ menggunakan editor teks terminal sebagai latihan penerapan struktur data. Baris teks disimpan dalam linked list, sehingga operasi menambah dan menghapus baris berhubungan langsung dengan pengelolaan node serta memori.",
        "Undo dan redo memakai stack aksi dengan urutan LIFO. Project juga mengeksplorasi beberapa tab dan riwayat aktivitas, dengan fokus pada mekanisme editing, bukan antarmuka desktop grafis."],
      ["Mini Notepad C++ uses a terminal text editor to explore practical data structures. Text lines are stored in a linked list, directly connecting insertion and deletion to node and memory management.",
        "Undo and redo use action stacks with LIFO ordering. The project also explores multiple tabs and activity history, focusing on editing mechanics rather than a graphical desktop interface."],
    ],
    highlights:[
      {title:["Edit per baris","Line-based editing"],body:["Pengguna menambah baris pada posisi tertentu atau menghapusnya lewat menu terminal. Struktur linked list menyimpan isi secara dinamis.","Users insert lines at a chosen position or remove them through a terminal menu. A linked list stores the content dynamically."]},
      {title:["Undo, redo, & tab","Undo, redo, & tabs"],body:["Aksi insert/delete masuk ke stack undo dan berpindah ke redo saat dibatalkan. Multi-tab memperluas latihan pengelolaan state editor.","Insert/delete actions enter an undo stack and move to redo when reversed. Multiple tabs extend the exercise in managing editor state."]},
    ],
    implementation:["Source utama ditulis dalam satu file C++, dengan linked list untuk baris dan stack untuk histori aksi. README secara eksplisit menempatkan save/load file, pencarian teks, modularisasi, dan GUI sebagai pengembangan berikutnya.",
      "The main source is a single C++ file, using a linked list for lines and stacks for action history. The README explicitly lists file save/load, text search, modularization, and a GUI as future work."],
    mediaCaption:["Cuplikan stdout dari menjalankan editor CLI asli. Bukan mockup GUI; transcript lengkap disimpan sebagai bukti capture.","An excerpt of stdout from running the actual CLI editor. Not a GUI mockup; the complete transcript is retained as capture evidence."],
    sources:[{label:["README Mini Notepad","Mini Notepad README"],url:readme("mini-notepad-cpp","3fc0890809173c4a1d00a97ff9b95593973dc6a0")}],
  },
  {
    id:"czip",deliverable:["Utilitas kompresi CLI","CLI compression utility"],
    overview:[
      ["CZIP adalah utilitas kompresi file berbasis command line yang ditulis dalam C. Proses encode dan decode menerapkan manipulasi bit, manajemen memori, dan struktur tree/min-heap.",
        "Source menyediakan jalur Run-Length Encoding dan Huffman, disertai CRC32 untuk pemeriksaan integritas. README juga menjelaskan pemilihan algoritma otomatis dan pemrosesan beberapa file, tetapi angka kecepatan atau rasio kompresinya tidak dipakai sebagai hasil pengukuran portfolio."],
      ["CZIP is a command-line file-compression utility written in C. Its encoding and decoding operations use bit manipulation, memory management, and tree/min-heap structures.",
        "The source provides Run-Length Encoding and Huffman paths, with CRC32 for integrity checking. The README also describes automatic algorithm selection and multi-file processing, but its speed and compression-ratio figures are not treated as portfolio measurements."],
    ],
    highlights:[
      {title:["Dua jalur kompresi","Two compression paths"],body:["RLE mengolah rentetan nilai berulang, sedangkan Huffman membangun representasi berdasarkan frekuensi simbol. Keduanya tersedia sebagai modul source terpisah.","RLE handles runs of repeated values, while Huffman constructs a representation based on symbol frequencies. They are available as separate source modules."]},
      {title:["Encode, verifikasi, & decode","Encode, verify, & decode"],body:["Capture portfolio menjalankan jalur Huffman pada fixture teks, memeriksa integritas, lalu membandingkan hasil dekompresi dengan input asli.","The portfolio capture exercised Huffman on a text fixture, checked integrity, and compared the decompressed output with the original input."]},
    ],
    implementation:["Modul C memisahkan operasi CLI, algoritma RLE/Huffman, dan CRC32. Repo menyertakan Makefile serta materi tes. Roundtrip fixture yang tercatat menunjukkan satu jalur contoh bekerja, bukan benchmark atau bukti semua kombinasi input.",
      "The C modules separate CLI operations, RLE/Huffman algorithms, and CRC32. The repository includes a Makefile and test material. The recorded fixture roundtrip demonstrates one example path, not a benchmark or proof of every input combination."],
    mediaCaption:["Cuplikan output asli kompresi Huffman, verifikasi, dan dekompresi fixture. Roundtrip identik; bukan benchmark performa.","An excerpt of actual Huffman compression, verification, and fixture decompression output. The roundtrip was byte-identical; this is not a performance benchmark."],
    sources:[{label:["README CZIP","CZIP README"],url:readme("CZIP-simple-compression-txt","3e4144a3bee193c9d1a6be515a4a9f358f797567")}],
  },
  {
    id:"codecraft",deliverable:["Skill untuk agent & IDE","Agent & IDE skill"],
    overview:[
      ["CodeCraft Optimizer adalah kumpulan instruksi untuk coding assistant di lingkungan agent atau IDE. Panduan ini membantu assistant mengklarifikasi kebutuhan engineering saat menerima permintaan singkat, informal, atau ambigu.",
        "Materinya mengatur kapan assistant perlu bertanya, memeriksa konteks, atau menjawab langsung dengan mempertimbangkan risiko dan biaya. Ini merupakan produk instruksi yang dipakai oleh host agent, bukan aplikasi editor atau model AI baru."],
      ["CodeCraft Optimizer is an instruction set for coding assistants in agent or IDE environments. It guides assistants in clarifying engineering needs when a request is short, informal, or ambiguous.",
        "Its material defines when an assistant should ask, inspect context, or answer directly while considering risk and cost. It is an instruction product consumed by an agent host, not an editor application or a new AI model."],
    ],
    highlights:[
      {title:["Konteks sebelum perubahan","Context before changes"],body:["Instruksi mengasumsikan host memiliki akses file, perintah, dan edit. Panduan pendukung dipisahkan untuk dibaca sesuai kebutuhan.","The instructions assume the host has file, command, and editing access. Supporting guides are separated for use when needed."]},
      {title:["Pelaporan yang dapat diperiksa","Checkable reporting"],body:["Materi meminta assistant membedakan pekerjaan yang benar-benar dijalankan dari saran atau langkah manual, terutama pada perubahan berisiko tinggi.","The material asks assistants to distinguish work actually performed from suggestions or manual steps, particularly for high-risk changes."]},
    ],
    implementation:["Deliverable terdiri dari SKILL.md, direktori references, dan metadata agent. Pemakaian bergantung pada host yang mendukung skill. Materi ini ditampilkan sebagai source project, tidak dijalankan sebagai instruksi oleh halaman portfolio.",
      "The deliverable consists of SKILL.md, a references directory, and agent metadata. Usage depends on a skill-compatible host. This material is shown as project source, not executed as instructions by the portfolio page."],
    mediaCaption:["Cuplikan dokumen instruksi asli dari repo. Bukan screenshot aplikasi IDE atau bukti benchmark kualitas jawaban.","An excerpt of the repository's actual instruction document. Not an IDE application screenshot or evidence of an answer-quality benchmark."],
    sources:[{label:["README CodeCraft","CodeCraft README"],url:readme("codecraft-optimizer-ide","6e8e21b62d8ec3b218211620299b76af3a9d47ca")}],
  },
  {
    id:"optimizer-ai-web",deliverable:["Instruksi untuk AI web/chat","Web/chat AI instructions"],
    overview:[
      ["Optimizer AI Web membawa konsep panduan coding assistant ke antarmuka AI berbasis web atau chat. Materinya dapat ditempel ke percakapan, custom instructions, atau digunakan sebagai file skill pada layanan yang mendukungnya.",
        "Berbeda dari versi agent/IDE, panduan ini mengasumsikan AI tidak memiliki akses langsung ke file atau terminal. Konteks harus diberikan pengguna, dan saran verifikasi perlu dibedakan dari tes yang benar-benar dijalankan."],
      ["Optimizer AI Web brings coding-assistant guidance to web or chat AI interfaces. Its material can be pasted into a conversation or custom instructions, or used as a skill file on services that support it.",
        "Unlike the agent/IDE version, this guidance assumes the AI has no direct file or terminal access. The user must supply context, and proposed verification steps must be distinguished from tests actually performed."],
    ],
    highlights:[
      {title:["Dipakai di percakapan","Used within a conversation"],body:["Produk utamanya adalah blok instruksi yang dapat ditempel atau diunggah, bukan layanan chat yang di-host secara terpisah.","The main product is an instruction block that can be pasted or uploaded, not a separately hosted chat service."]},
      {title:["Batas akses yang eksplisit","Explicit access limits"],body:["Materi mengatur klarifikasi, kebutuhan artefak minimum, dan langkah verifikasi manual sesuai konteks yang diberikan pengguna.","The material defines clarification, minimum required artifacts, and manual verification steps based on the context the user provides."]},
    ],
    implementation:["Repo menyediakan dokumen paste-in dan SKILL.md sebagai bentuk distribusi. Cara memasangnya bergantung pada fitur custom/project instructions atau unggahan file milik layanan AI tujuan; repo ini tidak menyediakan backend inference sendiri.",
      "The repository distributes a paste-in document and SKILL.md. Installation depends on the target AI service's custom/project instructions or file-upload features; this repository does not provide its own inference backend."],
    mediaCaption:["Cuplikan dokumen produk asli. Tidak menyimulasikan percakapan AI, aplikasi chat, atau hasil efektivitas yang belum diukur.","An excerpt of the actual product document. It does not simulate an AI conversation, chat application, or unmeasured effectiveness result."],
    sources:[{label:["README Optimizer AI Web","Optimizer AI Web README"],url:readme("optimizer-ai-web","5dbe2451522417546eaa61e00e0347a90ff035b4")}],
  },
  {
    id:"portfolio",deliverable:["Website portfolio V2","V2 portfolio website"],
    overview:[
      ["Melalui portfolio ini, saya memperkenalkan pekerjaan, teknologi yang saya gunakan, dan cara menghubungi saya dalam bahasa Indonesia dan English. V2 yang sedang dikembangkan memakai Astro untuk halaman statis dan React islands untuk bagian interaktif.",
        "Di Home, Anda dapat mengenal saya melalui kartu 3D, tools dan skill, serta karya unggulan. Katalog menyediakan pencarian, filter kategori, dan penjelasan tiap project. Pilihan penjelajahan tetap tersimpan saat Anda kembali dari halaman Detail."],
      ["I use this portfolio to introduce my work, the technologies I use, and how to contact me in Indonesian and English. The V2 under development uses Astro for static pages and React islands for interactive sections.",
        "On Home, you can get to know me through a 3D card, tools and skills, and featured projects. The catalog provides search, category filters, and a page for each project. Your browsing choices remain in place when you return from a Detail page."],
    ],
    highlights:[
      {title:["Konten dua bahasa","Bilingual content"],body:["Navigasi, ringkasan, dan Detail tersedia dalam Indonesia dan English, dengan preferensi bahasa serta tema yang dapat dipilih pengunjung.","Navigation, summaries, and Detail pages are available in Indonesian and English, with visitor-selectable language and theme preferences."]},
      {title:["Karya sebagai bukti","Projects as evidence"],body:["Thumbnail berasal dari antarmuka, dokumen, diagram, atau output program asli. Status dan keterbatasan tiap karya tetap dibedakan.","Thumbnails come from real interfaces, documents, diagrams, or program output. Each project's status and limitations remain distinct."]},
      {title:["V1 & V2 tidak disamakan","V1 and V2 stay distinct"],body:["Gambar ini mewakili V2 lokal. Tautan publik yang tersedia masih mengarah ke implementasi Next.js V1 dan diberi label sesuai versinya.","This image represents local V2. Available public links still point to the Next.js V1 implementation and are labeled accordingly."]},
    ],
    implementation:["Astro mengatur route dan konten statis, React menangani komponen interaktif, dan Three.js dipakai pada kartu 3D. Source V1 dipisahkan sebagai arsip, bukan diimpor menjadi bagian runtime V2 atau disajikan melalui folder publik.",
      "Astro handles routes and static content, React powers interactive components, and Three.js is used for the 3D card. V1 source is kept in an archive, not imported into the V2 runtime or served through the public directory."],
    mediaCaption:["Capture Astro V2 lokal yang sedang dikembangkan. Bukan tampilan versi publik V1 pada tautan demo/source di halaman ini.","A capture of local Astro V2 under development. Not the public V1 version reached through this page's demo/source links."],
    sources:[{label:["README publik V1","Public V1 README"],url:readme("Muhammad-Faza","5de4f2efa50a8ec65d4c87be1c65f76b6614b09e")}],
  },
];

export const projectDetails:Record<string,Localized<DetailContent>>=Object.fromEntries(entries.map(entry=>{
  const localize=(index:0|1):DetailContent=>({
    deliverable:entry.deliverable[index],overview:entry.overview[index],
    highlights:entry.highlights.map(item=>({title:item.title[index],body:item.body[index]})),
    implementation:entry.implementation[index],mediaCaption:entry.mediaCaption[index],
    sources:entry.sources.map(source=>({label:source.label[index],url:source.url})),
  });
  return [entry.id,{id:localize(0),en:localize(1)}];
}));

export const detailCopy={
  id:{
    preview:"Pratinjau project",fullImage:"Buka gambar penuh",status:"Status",deliverable:"Bentuk project",
    features:"Fitur & cakupan",implementation:"Cara project disusun",materials:"Dokumentasi & catatan",
    sourceNote:"Dokumentasi dan catatan berikut menjelaskan sumber, status, dan batas pengujian project.",
    mediaError:"Gambar belum dapat dimuat. Penjelasan project dan tautan sumber tetap tersedia.",
  },
  en:{
    preview:"Project preview",fullImage:"Open full image",status:"Status",deliverable:"Project format",
    features:"Features & scope",implementation:"How the project is organized",materials:"Documentation & notes",
    sourceNote:"The documentation and notes below explain the project's sources, status, and testing limits.",
    mediaError:"The image could not load. The project description and source links are still available.",
  },
};
