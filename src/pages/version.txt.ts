// Deploy marker for .github/workflows/indexnow.yml: the commit this build came from.
// Cloudflare Pages sets CF_PAGES_COMMIT_SHA during its build.
export function GET() {
  return new Response(process.env.CF_PAGES_COMMIT_SHA ?? 'unknown', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
