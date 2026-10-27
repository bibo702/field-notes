import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** The only public-content query. Drafts are excluded in dev AND production. */
export async function publishedPosts(): Promise<Post[]> {
  return (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id));
}

export function postTags(posts: Post[]) {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort();
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

export function readingTime(post: Post) {
  return Math.max(1, Math.ceil((post.body ?? '').split(/\s+/).length / 220));
}
