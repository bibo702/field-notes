import { defineConfig } from 'astro/config';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

// Node's loader preserves values already set by the shell or GitHub Actions.
if (existsSync('.env')) loadEnvFile('.env');
const origin = new URL(process.env.SITE_URL || 'https://example.com');
if (!['https:', 'http:'].includes(origin.protocol) || origin.pathname !== '/' ||
    origin.search || origin.hash || origin.username || origin.password) {
  throw new Error('SITE_URL must be an http(s) origin, e.g. https://username.github.io');
}
const rawBase = process.env.SITE_BASE_PATH || '/';
const segments = rawBase.split('/').filter(Boolean);
if (segments.some((segment) => !/^[a-zA-Z0-9._-]+$/.test(segment) || ['.', '..'].includes(segment))) {
  throw new Error('SITE_BASE_PATH must be / or a repository path, e.g. /field-notes/');
}
const base = segments.length ? `/${segments.join('/')}/` : '/';

export default defineConfig({
  site: origin.origin,
  base,
  output: 'static',
  trailingSlash: 'always',
  server: { host: true },
  vite: { server: { host: true, allowedHosts: true, strictPort: false } },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
});
