const resumeHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Resume</title>
    <link rel="icon" href="/favicon.svg" />
    <style>
      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        background: #2b2b2b;
      }

      iframe {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
      }
    </style>
  </head>
  <body>
    <iframe src="/assets/documents/Resume.pdf" title="Resume"></iframe>
  </body>
</html>`;

export function GET() {
  return new Response(resumeHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
