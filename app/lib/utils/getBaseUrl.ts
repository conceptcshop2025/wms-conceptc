/**
 * Resolves the base URL for internal API calls.
 *
 * In the browser, relative URLs work, so we return an empty string.
 * On the server (e.g. cron jobs), fetch needs an absolute URL, so we use the
 * Vercel deployment URL, an explicit site URL, or localhost as a fallback.
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";

  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}
