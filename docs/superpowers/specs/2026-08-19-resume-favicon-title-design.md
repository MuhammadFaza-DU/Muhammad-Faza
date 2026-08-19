# Resume, Favicon, and Browser Title Revision

## Goal

Replace the portfolio's published resume with `C:\Users\LENOVO\Downloads\Resume or CV.pdf` and make the browser identity match the provided reference: a black square favicon with a white `M`, plus the title `Resume Muhammad Faza` on the resume viewer page.

## Scope

- Replace `public/assets/documents/Resume.pdf` with the supplied PDF.
- Keep the existing `public/favicon.svg`, which already matches the requested `M` favicon visual.
- Ensure the global metadata continues to reference the `M` favicon for all pages.
- Change the custom `/resume` HTML document title to `Resume Muhammad Faza`.
- Change the resume iframe title to `Resume Muhammad Faza` for consistent accessibility metadata.

## Out Of Scope

- No redesign of the portfolio pages.
- No change to the global title format for Home, Project, Skill, or Contact.
- No conversion of the favicon from SVG to PNG.
- No change to the resume URL or download filename.

## Implementation

The resume route already serves an HTML wrapper around `/assets/documents/Resume.pdf`. The implementation will preserve that route and replace only the static PDF content and title strings. The existing metadata in `src/app/layout.tsx` will be verified rather than rewritten unnecessarily.

## Verification

- Confirm the published resume asset is the supplied PDF by comparing the copied file's size and cryptographic hash with the source file.
- Run `npm run lint`.
- Run `npm run build`.
- Confirm the route source contains the requested title and favicon reference.
- Confirm no unrelated tracked source files are changed.
