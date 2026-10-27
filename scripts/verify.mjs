import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';

const origin = 'https://verification.example';
const astro = path.resolve('node_modules/astro/bin/astro.mjs');
function build(base) {
  const result = spawnSync(process.execPath, [astro, 'build'], {
    stdio: 'inherit',
    env: { ...process.env, SITE_URL: origin, SITE_BASE_PATH: base },
  });
  assert.equal(result.status, 0, `Build failed for ${base}`);
}
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? files(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat();
}
async function validate(base) {
  const output = await files('dist');
  const htmlFiles = output.filter((file) => file.endsWith('.html'));
  let checkedLinks = 0;
  async function checkUrl(raw, from) {
    if (!raw || /^(mailto:|tel:|data:|javascript:)/.test(raw)) return;
    const url = new URL(raw, from);
    if (url.origin !== origin) return;
    assert.ok(url.pathname.startsWith(base), `Missing base: ${raw} on ${from}`);
    const relative = decodeURIComponent(url.pathname.slice(base.length));
    const target = path.join('dist', relative, url.pathname.endsWith('/') ? 'index.html' : '');
    await access(target).catch(() => assert.fail(`Broken URL: ${url.href} -> ${target}`));
    if (url.hash && target.endsWith('.html')) {
      const { document } = parseHTML(await readFile(target, 'utf8'));
      assert.ok(document.getElementById(decodeURIComponent(url.hash.slice(1))), `Missing fragment: ${url.href}`);
    }
    checkedLinks++;
  }
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    assert.ok(!/draft-template|draft-only|Draft template/.test(html), `Draft leaked into ${file}`);
    const { document } = parseHTML(html);
    const rel = path.relative('dist', file).replaceAll('\\', '/');
    const route = rel === 'index.html' ? '' : rel.replace(/index\.html$/, '');
    const pageUrl = new URL(base + route, origin);
    assert.equal(document.querySelectorAll('h1').length, 1, `${file} must have one h1`);
    assert.ok(document.querySelector('meta[name="description"]')?.getAttribute('content'));
    const canonical = document.querySelector('link[rel="canonical"]');
    if (rel === '404.html') {
      assert.equal(canonical, null);
      assert.match(document.querySelector('meta[name="robots"]').getAttribute('content'), /noindex/);
    } else {
      assert.equal(canonical?.getAttribute('href'), pageUrl.href);
      assert.equal(document.querySelector('meta[property="og:url"]')?.getAttribute('content'), pageUrl.href);
    }
    for (const element of document.querySelectorAll('[href], [src]')) {
      await checkUrl(element.getAttribute('href') ?? element.getAttribute('src'), pageUrl);
    }
  }
  const feed = await readFile('dist/rss.xml', 'utf8');
  assert.ok(!/draft-template|draft-only|Draft template/.test(feed), 'Draft leaked into RSS');
  const { document: feedDoc } = parseHTML(feed);
  const items = [...feedDoc.querySelectorAll('item')];
  const home = parseHTML(await readFile('dist/index.html', 'utf8')).document;
  const postLinks = [...home.querySelectorAll('.post-summary h3 a')].map((link) => new URL(link.getAttribute('href'), origin).href);
  assert.equal(items.length, postLinks.length, 'RSS must include every published post exactly once');
  assert.ok(items.length > 0, 'Starter content should be published');
  // Read XML URLs directly: HTML parsers treat the XML <link> element as void.
  const feedLinks = [...feed.matchAll(/<link>(.*?)<\/link>/g)].map((match) => match[1]);
  assert.equal(feedLinks[0], new URL(base, origin).href, 'Feed channel URL must include base');
  assert.deepEqual(feedLinks.slice(1).sort(), postLinks.sort(), 'Feed article URLs must match home links');
  for (const link of feedLinks) await checkUrl(link, new URL(base, origin));
  assert.ok(output.some((file) => file.includes(`${path.sep}tags${path.sep}`)));
  assert.ok(!output.some((file) => /draft-template|draft-only/.test(file)));
  const postHtml = await readFile('dist/posts/writing-a-useful-learning-note/index.html', 'utf8');
  assert.match(postHtml, /astro-code/);
  assert.match(postHtml, /--shiki-dark/);
  await access('dist/.nojekyll');
  console.log(`PASS ${base}: ${htmlFiles.length} HTML pages, ${checkedLinks} local URLs/fragments, ${items.length} RSS items; SEO, drafts, highlighting, and .nojekyll checked.`);
}

let failure;
try {
  for (const base of ['/', '/field-notes-test/']) {
    build(base);
    await validate(base);
  }
} catch (error) {
  failure = error;
} finally {
  // Leave the user with a normal local build, not the verification-only origin.
  const result = spawnSync(process.execPath, [astro, 'build'], { stdio: 'inherit', env: process.env });
  if (result.status !== 0 && !failure) failure = new Error('Restoring normal build failed');
}
if (failure) throw failure;
