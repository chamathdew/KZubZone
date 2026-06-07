export const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const cleanSlug = (slug = '') => String(slug).replace(/-\d+$/, '');

export const permalinkSlug = (item = {}) => {
  const slug = String(item.slug || '');
  const titleSlug = slugify(item.title || '');

  if (titleSlug && slug === titleSlug) {
    return slug;
  }

  if (titleSlug && slug.startsWith(`${titleSlug}-`)) {
    return titleSlug;
  }

  return cleanSlug(slug);
};
