import type { SkillRecord } from "./types.ts";

const toolEntries = [
  ["arduino", "Arduino", "Board dan tools pengembangan untuk membaca sensor, mengendalikan aktuator, dan membuat Embedded System.", "Boards and development tools for reading sensors, controlling actuators, and building Embedded Systems."],
  ["vscode", "VS Code", "Editor kode dengan ekstensi untuk menulis, menelusuri, dan menjalankan berbagai project.", "A code editor with extensions for writing, navigating, and running different projects."],
  ["matlab", "MATLAB", "Lingkungan komputasi numerik untuk menganalisis data, mengembangkan algoritma, dan menjalankan simulasi.", "A numerical computing environment for analyzing data, developing algorithms, and running simulations."],
  ["mysql", "MySQL", "Database relasional yang mengelola data terstruktur dan kueri SQL.", "A relational database for structured data and SQL queries."],
  ["opencode", "OpenCode", "Coding agent yang menggunakan model AI untuk membaca, menulis, dan memeriksa kode dengan tools pengembangan.", "A coding agent that uses AI models and development tools to read, write, and check code."],
  ["supabase", "Supabase", "Platform berbasis Postgres untuk database, autentikasi, penyimpanan, dan layanan aplikasi.", "A Postgres-based platform for databases, authentication, storage, and application services."],
  ["figma", "Figma", "Alat desain kolaboratif untuk merancang antarmuka, menyusun komponen, dan mencoba prototype.", "A collaborative design tool for designing interfaces, organizing components, and trying prototypes."],
] as const;

const technologyEntries = [
  ["python", "Python", "Bahasa pemrograman untuk otomasi, pengolahan data, dan pengembangan Machine Learning.", "A programming language for automation, data processing, and Machine Learning development."],
  ["c", "C", "Bahasa pemrograman untuk mengelola memori secara langsung dan berinteraksi dengan perangkat keras.", "A programming language for direct memory management and working with hardware."],
  ["cpp", "C++", "Bahasa pemrograman yang menggabungkan pengelolaan memori dengan fitur seperti class dan template untuk menyusun sistem atau aplikasi.", "A programming language combining memory management with classes and templates for building systems and applications."],
  ["javascript", "JavaScript", "Bahasa yang menjalankan interaksi di browser dan juga aplikasi server.", "A language for browser interactions and server applications."],
  ["typescript", "TypeScript", "JavaScript dengan pemeriksaan tipe untuk menemukan ketidaksesuaian data sebelum program dijalankan.", "JavaScript with type checking to catch mismatched data before the program runs."],
  ["dart", "Dart", "Bahasa pemrograman yang digunakan bersama Flutter untuk membangun aplikasi.", "A programming language used with Flutter to build applications."],
  ["react", "React", "Library untuk menyusun antarmuka dari komponen yang diperbarui saat data atau state berubah.", "A library for building interfaces from components that update when data or state changes."],
  ["nextjs", "Next.js", "Framework React untuk routing, rendering, dan kebutuhan aplikasi web.", "A React framework for routing, rendering, and web application features."],
  ["astro", "Astro", "Framework web untuk menghasilkan halaman HTML dengan JavaScript pada bagian interaktif yang membutuhkannya.", "A web framework that generates HTML pages and adds JavaScript to the interactive sections that need it."],
  ["nodejs", "Node.js", "Runtime JavaScript di luar browser untuk server, script, dan tools.", "A JavaScript runtime outside the browser for servers, scripts, and tools."],
  ["flutter", "Flutter", "Toolkit untuk membuat interface aplikasi lintas platform dengan Dart.", "A toolkit for building cross-platform application interfaces with Dart."],
  ["sql", "SQL", "Bahasa kueri untuk membaca, mengolah, dan mengelola data relasional.", "A query language for reading, processing, and managing relational data."],
  ["hono", "Hono", "Framework web berbasis Web Standards untuk mengatur route dan menangani permintaan serta respons HTTP.", "A Web Standards-based framework for routing and handling HTTP requests and responses."],
  ["express", "Express", "Framework Node.js untuk routing HTTP, middleware, dan API.", "A Node.js framework for HTTP routing, middleware, and APIs."],
  ["vite", "Vite", "Tool untuk menjalankan server pengembangan frontend dan menyiapkan build aplikasi untuk publikasi.", "A tool for running a frontend development server and building applications for publication."],
  ["html", "HTML", "Markup yang memberi struktur dan makna pada konten halaman web.", "Markup that gives web content its structure and meaning."],
  ["css", "CSS", "Bahasa stylesheet untuk layout, tipografi, warna, dan tampilan responsif.", "A stylesheet language for layout, typography, color, and responsive presentation."],
  ["tailwind", "Tailwind CSS", "Framework CSS berbasis utility untuk menyusun styling langsung pada markup.", "A utility-based CSS framework for composing styles in markup."],
] as const;

function records(entries: readonly (readonly [string, string, string, string])[], group: SkillRecord["group"]): SkillRecord[] {
  return entries.map(([id, name, indonesian, english]) => ({
    id, name, group, description: { id: indonesian, en: english },
    ...(group === "tool" ? { assetId: id } : {}),
  }));
}

export const tools = records(toolEntries, "tool");
export const technologies = records(technologyEntries, "technology");
