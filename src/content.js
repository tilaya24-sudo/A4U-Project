import { INITIAL_SITE } from './default-content.js';
import { supabase } from './supabase.js';
import { clone } from './utils.js';

export function normalizeSite(input) {
  const base = clone(INITIAL_SITE);
  if (!input || typeof input !== 'object') return base;
  base.settings = {
    ...base.settings, ...(input.settings || {}),
    colors: { ...base.settings.colors, ...(input.settings?.colors || {}) },
    social: { ...base.settings.social, ...(input.settings?.social || {}) },
    calculatorRates: { ...base.settings.calculatorRates, ...(input.settings?.calculatorRates || {}) }
  };
  for (const slug of Object.keys(base.pages)) {
    const page = input.pages?.[slug];
    if (!page) continue;
    base.pages[slug] = {
      ...base.pages[slug], ...page,
      sections: Array.isArray(page.sections) ? page.sections : base.pages[slug].sections
    };
  }
  return base;
}
export async function loadPublished() {
  if (!supabase) return normalizeSite();
  const { data, error } = await supabase.from('site_published').select('content').eq('id', 'main').maybeSingle();
  if (error) {
    console.warn('Site published content unavailable:', error.message);
    return normalizeSite();
  }
  return normalizeSite(data?.content);
}
export async function loadDraft() {
  if (!supabase) throw new Error('Configure Supabase environment variables first.');
  const { data, error } = await supabase.from('site_drafts').select('content').eq('id', 'main').maybeSingle();
  if (error) throw error;
  if (data?.content && Object.keys(data.content).length) return normalizeSite(data.content);
  return loadPublished();
}
export async function saveDraft(data) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('site_drafts').upsert({ id: 'main', content: data, updated_at: new Date().toISOString() });
  if (error) throw error;
}
export async function publishSite(data) {
  if (!supabase) throw new Error('Supabase is not configured.');
  // Save draft first so the two versions remain aligned after publishing.
  await saveDraft(data);
  const { error } = await supabase.from('site_published').upsert({
    id: 'main', content: data, published_at: new Date().toISOString()
  });
  if (error) throw error;
}
