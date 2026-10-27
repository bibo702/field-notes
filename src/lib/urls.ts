/** Internal links always go through this helper, including feeds and public assets. */
export function withBase(path = '') {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

export function postUrl(id: string) {
  return withBase(`posts/${id.split('/').map(encodeURIComponent).join('/')}/`);
}

export function tagUrl(tag: string) {
  return withBase(`tags/${encodeURIComponent(tag)}/`);
}
