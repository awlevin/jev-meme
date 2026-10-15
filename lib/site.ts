// Canonical origin for share links and metadata. Vercel exposes the production
// domain to the browser bundle; local dev falls back to localhost.
const production = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = production ? `https://${production}` : "http://localhost:3000";

export const memeUrl = (id: string) => `${SITE_URL}/m/${id}`;
