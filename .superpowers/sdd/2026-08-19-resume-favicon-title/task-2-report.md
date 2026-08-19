# Task 2 Report: Resume Viewer Titles

## Change

- Updated the HTML document title in `src/app/resume/route.ts` to `Resume Muhammad Faza`.
- Updated the iframe title in `src/app/resume/route.ts` to `Resume Muhammad Faza`.
- Preserved `<link rel="icon" href="/favicon.svg" />` unchanged.
- Preserved the iframe PDF source `/assets/documents/Resume.pdf` unchanged.

## Verification

Command:

```powershell
npx --yes ripgrep -n "Resume Muhammad Faza|favicon\.svg|assets/documents/Resume\.pdf" "src/app/resume/route.ts"
```

Output:

```text
6:    <title>Resume Muhammad Faza</title>
7:    <link rel="icon" href="/favicon.svg" />
26:    <iframe src="/assets/documents/Resume.pdf" title="Resume Muhammad Faza"></iframe>
```

The output confirms the exact title appears twice, the favicon path appears once, and the existing PDF path appears once.
