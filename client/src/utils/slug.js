export const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const cleanSlug = (slug = '') => String(slug).replace(/-\d+$/, '');

export const permalinkSlug = (item = {}) => {
  const slug = String(item.slug || '');
  if (slug) {
    return slug;
  }

  return slugify(item.title || '');
};
