import { test, expect } from '@playwright/test';

test('navigation, article, tags, feed, 404, and keyboard skip link', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Field Notes');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('.post-row')).toHaveCount(3);
  await page.getByRole('link', { name: /A useful note starts/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A useful note starts with one good question');
  await expect(page.locator('pre.astro-code')).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Tags' }).click();
  await page.locator('.topic-grid').getByRole('link').filter({ hasText: 'learning' }).click();
  await expect(page.locator('.post-row')).toHaveCount(2);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About' }).click();
  await expect(page.getByText('Editable author placeholder')).toBeVisible();
  const feed = await page.request.get(new URL('rss.xml', test.info().project.use.baseURL).href);
  expect(feed.status()).toBe(200);
  expect(await feed.text()).not.toContain('draft-template');
  const draft = await page.request.get(new URL('posts/draft-template/', test.info().project.use.baseURL).href);
  expect(draft.status()).toBe(404);
  await page.goto('404.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('isn’t here.');
  await page.getByRole('link', { name: 'Back to the notes' }).click();
  await expect(page).toHaveTitle('Field Notes');
});

test('theme persists and the button works with a keyboard', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  const toggle = page.getByRole('button', { name: 'Dark theme' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('blocked storage keeps system preference and an in-memory theme choice', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage blocked', 'SecurityError'); },
    });
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('mobile layout has no horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ['./', 'about/', 'tags/', 'posts/writing-a-useful-learning-note/', '404.html']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  }
});

test('content remains readable with JavaScript disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.locator('.post-row')).toHaveCount(3);
  await expect(page.locator('#theme-toggle')).toBeHidden();
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).colorScheme)).toBe('dark');
  await context.close();
});

test('desktop and mobile visual captures', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  await page.screenshot({ path: testInfo.outputPath('home-light.png'), fullPage: true });
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await page.screenshot({ path: testInfo.outputPath('home-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: testInfo.outputPath('home-mobile.png'), fullPage: true });
  await page.goto('posts/writing-a-useful-learning-note/');
  await page.screenshot({ path: testInfo.outputPath('article-mobile.png'), fullPage: true });
});
