// @ts-check
import { defineConfig } from 'astro/config';

// Static output for Cloudflare Pages — no adapter needed for fully pre-rendered sites.
// Switch to adapter: cloudflare() + output: 'server' if you add server-side routes.
export default defineConfig({
  output: 'static',
});