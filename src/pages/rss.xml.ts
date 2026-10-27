import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../config';
import { publishedPosts } from '../lib/posts';
import { postUrl, withBase } from '../lib/urls';

export async function GET(context: APIContext) {
  return rss({
    title: site.title,
    description: site.description,
    site: new URL(withBase(), context.site).href,
    items: (await publishedPosts()).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: new URL(postUrl(post.id), context.site).href,
    })),
    customData: '<language>en</language>',
  });
}
