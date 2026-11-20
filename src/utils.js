export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);
export const escapeAttr = escapeHtml;
export const lineBreaks = value => escapeHtml(value).replace(/\r?\n/g, '<br>');
export const safeUrl = (value, fallback = '') => {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const v = value.trim();
  if (/^\/(?!\/)/.test(v) || /^#[-\w]+$/.test(v)) return v;
  try { const u = new URL(v); if (u.protocol === 'https:') return u.href; } catch (_) { /* invalid */ }
  return fallback;
};
export const targetAttrs = url => /^https:\/\//.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
export const cssColor = (input, fallback) => /^#[0-9a-f]{6}$/i.test(String(input)) ? input : fallback;
export const clone = obj => JSON.parse(JSON.stringify(obj));
export const formatFileSize = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round((bytes || 0) / 1024)} KB`;
