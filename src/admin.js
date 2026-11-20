import './admin.css';
import { supabase, isConfigured, siteError } from './supabase.js';
import { PAGE_META, SECTION_TYPES, makeSection } from './default-content.js';
import { normalizeSite, loadDraft, saveDraft, publishSite } from './content.js';
import { clone, escapeHtml as esc, safeUrl, formatFileSize } from './utils.js';

const $ = id => document.getElementById(id);
let site = normalizeSite();
let currentPage = 'home';
let selectedSectionId = site.pages.home.sections[0]?.id;
let activeView = 'overview';
let user = null;
let role = '';
let dirty = false;
let knownMedia = [];
let leadsCache = [];
let recoveryMode = false;
const pageList = Object.entries(PAGE_META);
const fieldNames = {
  eyebrow: 'Eyebrow / Small Label', title: 'Section Heading', subtitle: 'Subheading',
  body: 'Description / Body Text', ctaText: 'Button Text', ctaHref: 'Button URL',
  mediaUrl: 'Image / Video / File URL', mediaAlt: 'Media Alternative Text / File Title'
};
const itemFields = ['title', 'subtitle', 'body', 'icon', 'mediaUrl'];

function notify(message, isError = false) {
  const n = $('notice');
  n.textContent = message;
  n.classList.toggle('error', isError);
  n.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { n.hidden = true; }, isError ? 9000 : 5000);
}
function markDirty() {
  dirty = true;
  $('dirty-indicator').textContent = '● Unsaved draft changes';
  $('dirty-indicator').classList.add('unsaved');
}
function clearDirty() {
  dirty = false;
  $('dirty-indicator').textContent = '✓ Draft saved';
  $('dirty-indicator').classList.remove('unsaved');
}
function getPage() { return site.pages[currentPage]; }
function getSection() { return getPage().sections.find(s => s.id === selectedSectionId); }
function getField(labelText, value, callback, { type = 'text', multiline = false, options = null, full = false, min = null, max = null } = {}) {
  const wrapper = document.createElement('label');
  wrapper.className = `editor-field${full ? ' span-full' : ''}`;
  const title = document.createElement('span'); title.textContent = labelText;
  let field;
  if (options) {
    field = document.createElement('select');
    for (const [val, name] of options) {
      const opt = document.createElement('option'); opt.value = val; opt.textContent = name; field.append(opt);
    }
    field.value = String(value ?? '');
  } else if (multiline) {
    field = document.createElement('textarea'); field.rows = 4; field.value = value ?? '';
  } else {
    field = document.createElement('input'); field.type = type;
    if (type === 'checkbox') field.checked = Boolean(value);
    else field.value = value ?? '';
    if (min !== null) field.min = min;
    if (max !== null) field.max = max;
  }
  field.addEventListener(type === 'checkbox' || options ? 'change' : 'input', () => {
    callback(type === 'checkbox' ? field.checked : type === 'number' ? Number(field.value) : field.value);
    markDirty();
  });
  wrapper.append(title, field);
  return wrapper;
}
function sectionLabel(section, index) {
  return `${index + 1}. ${section.title || SECTION_TYPES[section.type] || 'Untitled Section'}`;
}
function navigate(view) {
  activeView = view;
  document.querySelectorAll('.panel-view').forEach(panel => panel.hidden = panel.id !== `panel-${view}`);
  document.querySelectorAll('#sidebar-nav button').forEach(button => button.classList.toggle('selected', button.dataset.view === view));
  const headings = { overview: 'Dashboard', pages: 'Pages & Layout', media: 'Media Library', theme: 'Design & Settings', inquiries: 'Consultation Leads', publish: 'Publish Website' };
  $('view-heading').textContent = headings[view];
  if (view === 'pages') renderPages();
  if (view === 'theme') renderTheme();
  if (view === 'overview') renderOverview();
  if (view === 'media') refreshMedia();
  if (view === 'inquiries') refreshLeads();
  if (view === 'publish') $('publish-status').textContent = role === 'admin' ? 'Only clicking Publish makes saved draft changes visible publicly.' : 'Your editor role can save drafts, but an administrator must publish changes.';
  document.querySelectorAll('#publish-button,#publish-top').forEach(button => button.disabled = role !== 'admin');
}
function renderOverview() {
  $('stat-pages').textContent = pageList.length;
  $('stat-sections').textContent = Object.values(site.pages).reduce((sum, pg) => sum + pg.sections.length, 0);
  // Leads are retrieved only in the protected admin view, not on the public website.
  if (supabase) supabase.from('lead_submissions').select('id', { count: 'exact', head: true }).then(({ count, error }) => {
    $('stat-leads').textContent = error ? '—' : count ?? 0;
  });
}
function renderPages() {
  const list = $('page-list'); list.replaceChildren();
  for (const [key, meta] of pageList) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = meta.label;
    button.classList.toggle('active', currentPage === key);
    button.addEventListener('click', () => { currentPage = key; selectedSectionId = getPage().sections[0]?.id; renderPages(); });
    list.append(button);
  }
  const sections = $('section-list'); sections.replaceChildren();
  getPage().sections.forEach((section, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.classList.toggle('active', section.id === selectedSectionId);
    button.classList.toggle('off', section.visible === false);
    button.innerHTML = `<span>${esc(sectionLabel(section, index))}</span><span>${section.visible === false ? '◌' : '◉'}</span>`;
    button.addEventListener('click', () => { selectedSectionId = section.id; renderPages(); });
    sections.append(button);
  });
  $('selected-page-title').textContent = `${PAGE_META[currentPage].label} Page`;
  const seo = $('page-seo'); seo.replaceChildren();
  seo.append(
    getField('SEO Page Title', getPage().seoTitle, value => { getPage().seoTitle = value; }, { full: true }),
    getField('SEO Description', getPage().seoDescription, value => { getPage().seoDescription = value; }, { full: true, multiline: true })
  );
  renderSectionEditor();
}
function renderSectionEditor() {
  const editor = $('section-editor'); editor.replaceChildren();
  const actions = $('section-actions'); actions.replaceChildren();
  const section = getSection();
  if (!section) { $('section-editor-title').textContent = 'Select or add a section'; return; }
  $('section-editor-title').textContent = section.title || SECTION_TYPES[section.type];
  const index = getPage().sections.indexOf(section);
  const tool = (text, cb, klass = 'outline') => {
    const b = document.createElement('button'); b.type = 'button'; b.className = `admin-button small ${klass}`; b.textContent = text;
    b.addEventListener('click', cb); actions.append(b); return b;
  };
  const move = direction => {
    const next = index + direction;
    if (next < 0 || next >= getPage().sections.length) return;
    [getPage().sections[index], getPage().sections[next]] = [getPage().sections[next], getPage().sections[index]];
    markDirty(); renderPages();
  };
  tool('↑ Move Up', () => move(-1));
  tool('↓ Move Down', () => move(1));
  tool('Duplicate', () => {
    const copy = clone(section); copy.id = `${copy.type}-${Date.now().toString(36)}`;
    getPage().sections.splice(index + 1, 0, copy); selectedSectionId = copy.id; markDirty(); renderPages();
  });
  tool('Delete', () => {
    if (!window.confirm(`Delete the section "${section.title}" from this draft?`)) return;
    getPage().sections.splice(index, 1); selectedSectionId = getPage().sections[Math.max(0, index - 1)]?.id;
    markDirty(); renderPages();
  }, 'danger');
  const fields = document.createElement('div'); fields.className = 'field-grid';
  fields.append(getField('Section Type', section.type, value => {
    section.type = value; if (['cards', 'steps', 'people', 'resources'].includes(value) && !Array.isArray(section.items)) section.items = [];
    renderSectionEditor();
  }, { options: Object.entries(SECTION_TYPES) }));
  fields.append(getField('Background Theme', section.theme || 'white', value => { section.theme = value; }, {
    options: [['white', 'White'], ['light', 'Light Gray'], ['navy', 'Brand Navy'], ['orange', 'Brand Orange']]
  }));
  fields.append(getField('Text Alignment', section.align || 'left', value => { section.align = value; }, { options: [['left', 'Left'], ['center', 'Centered']] }));
  fields.append(getField('Visible on Website', section.visible !== false, value => { section.visible = value; renderPages(); }, { type: 'checkbox' }));
  for (const key of Object.keys(fieldNames)) {
    const applies = ['eyebrow', 'title', 'body'].includes(key) ||
      (key === 'subtitle' && ['hero', 'split', 'banner', 'media'].includes(section.type)) ||
      (key.startsWith('cta') && ['hero', 'split', 'banner', 'media'].includes(section.type)) ||
      (key.startsWith('media') && ['hero', 'split', 'media'].includes(section.type));
    if (!applies) continue;
    fields.append(getField(fieldNames[key], section[key] || '', value => {
      section[key] = value;
      if (key === 'title') $('section-editor-title').textContent = value || 'Untitled Section';
    }, { multiline: key === 'body', full: ['body', 'mediaUrl'].includes(key) }));
  }
  if (['hero', 'split', 'media'].includes(section.type)) {
    fields.append(getField('Media Type', section.mediaType || 'image', value => { section.mediaType = value; }, {
      options: [['image', 'Image'], ['video', 'Video'], ['file', 'Downloadable File']]
    }));
  }
  if (['split', 'media'].includes(section.type)) {
    fields.append(getField('Reverse Image and Text Layout', section.reverse || false, value => { section.reverse = value; }, { type: 'checkbox' }));
  }
  editor.append(fields);
  if (['hero', 'split', 'media'].includes(section.type)) {
    const pick = document.createElement('button'); pick.type = 'button'; pick.className = 'admin-button outline'; pick.textContent = 'Browse Uploaded Media →';
    pick.addEventListener('click', () => navigate('media')); editor.append(pick);
  }
  if (['cards', 'steps', 'people', 'resources'].includes(section.type)) {
    const title = document.createElement('h3'); title.style.marginTop = '26px'; title.textContent = 'Cards / Items'; editor.append(title);
    if (!Array.isArray(section.items)) section.items = [];
    section.items.forEach((item, i) => {
      const block = document.createElement('div'); block.className = 'item-editor';
      const bar = document.createElement('div'); bar.className = 'item-header';
      const heading = document.createElement('strong'); heading.textContent = `Item ${i + 1}: ${item.title || '(Untitled)'}`;
      const control = document.createElement('div'); control.className = 'editor-toolbar';
      const button = (text, handler) => { const b = document.createElement('button'); b.className = 'admin-button outline small'; b.textContent = text; b.type = 'button'; b.addEventListener('click', handler); control.append(b); };
      button('↑', () => swapItem(i, i - 1)); button('↓', () => swapItem(i, i + 1));
      button('Remove', () => { if (!confirm('Remove this item?')) return; section.items.splice(i, 1); markDirty(); renderSectionEditor(); });
      bar.append(heading, control); block.append(bar);
      const grid = document.createElement('div'); grid.className = 'field-grid';
      for (const key of itemFields) {
        if (key === 'icon' && section.type === 'people') continue;
        grid.append(getField({ title: 'Title / Name', subtitle: 'Subtitle / Position', body: 'Description', icon: 'Icon / Step Number', mediaUrl: 'Photo / Resource URL' }[key], item[key] || '', value => {
          item[key] = value; if (key === 'title') heading.textContent = `Item ${i + 1}: ${value || '(Untitled)'}`;
        }, { multiline: key === 'body', full: key === 'body' || key === 'mediaUrl' }));
      }
      block.append(grid); editor.append(block);
    });
    const addItem = document.createElement('button'); addItem.type = 'button'; addItem.className = 'admin-button outline'; addItem.textContent = '+ Add Item';
    addItem.addEventListener('click', () => { section.items.push({ title: 'New Item', subtitle: '', body: '', icon: '✦', mediaUrl: '' }); markDirty(); renderSectionEditor(); });
    editor.append(addItem);
    function swapItem(i, j) {
      if (j < 0 || j >= section.items.length) return;
      [section.items[i], section.items[j]] = [section.items[j], section.items[i]];
      markDirty(); renderSectionEditor();
    }
  }
}
function renderTheme() {
  const parent = $('theme-editor'); parent.replaceChildren();
  const settings = site.settings;
  const texts = [['siteName', 'Business Name'], ['tagline', 'Tagline'], ['footerNote', 'Footer Note'], ['logoUrl', 'Logo Image URL']];
  for (const [key, label] of texts) parent.append(getField(label, settings[key], value => { settings[key] = value; }, { full: key === 'logoUrl' }));
  for (const [name, label] of [['navy', 'Brand Navy'], ['orange', 'Accent Orange'], ['blue', 'Secondary Blue'], ['light', 'Light Background'], ['ink', 'Body Text']]) {
    parent.append(getField(label, settings.colors[name], value => { settings.colors[name] = value; }, { type: 'color' }));
  }
  parent.append(getField('Font Family', settings.font || 'system', value => { settings.font = value; }, {
    options: [['system', 'Modern Sans Serif'], ['serif', 'Classic Serif']]
  }));
  for (const [key, label] of [['linkedin','LinkedIn URL'], ['facebook','Facebook URL'], ['instagram','Instagram URL']]) {
    parent.append(getField(label, settings.social[key], value => { settings.social[key] = value; }));
  }
  const rates = $('calculator-editor'); rates.replaceChildren();
  const labels = { finance: 'Accounting & Bookkeeping (USD)', apar: 'AP / AR (USD)', hr: 'HR & Payroll (USD)', customer: 'Customer Service (USD)', admin: 'Administration (USD)', it: 'IT Service Desk (USD)' };
  for (const [key, label] of Object.entries(labels)) {
    rates.append(getField(label, settings.calculatorRates[key], value => {
      settings.calculatorRates[key] = Math.max(0, Math.min(100000, value || 0));
    }, { type: 'number', min: 0, max: 100000 }));
  }
  rates.append(getField('Illustrative PHP per USD Exchange Rate', settings.phpPerUsd, value => {
    settings.phpPerUsd = Math.max(1, Math.min(1000, value || 1));
  }, { type: 'number', min: 1, max: 1000 }));
}
async function save() {
  if (!user) return notify('Please sign in again.', true);
  try { await saveDraft(site); clearDirty(); notify('Draft saved successfully.'); }
  catch (error) { notify(`Could not save draft: ${siteError(error)}`, true); }
}
async function publish() {
  if (role !== 'admin') return notify('Only administrator accounts may publish changes.', true);
  if (!confirm('Publish this draft to the live website?')) return;
  try { await publishSite(site); clearDirty(); notify('Website changes published successfully!'); $('publish-status').textContent = 'Published successfully. Refresh the live website to see changes.'; }
  catch (error) { notify(`Publishing failed: ${siteError(error)}`, true); }
}
function preview() {
  const dialog = $('preview-dialog'); const frame = $('preview-frame');
  if (!dialog.open) dialog.showModal();
  frame.src = `${PAGE_META[currentPage].path}?preview=1`;
}
function previewSend(event) {
  const frame = $('preview-frame');
  if (event?.origin && event.origin !== window.location.origin) return;
  if (event?.source && event.source !== frame.contentWindow) return;
  if (!frame.contentWindow) return;
  frame.contentWindow.postMessage({ type: 'ACCEL4U_PREVIEW', site: clone(site) }, window.location.origin);
}

const extensions = {
  images: ['jpg','jpeg','png','webp','gif'],
  videos: ['mp4','webm'],
  files: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','zip']
};
function classifyFile(file) {
  const ext = file.name.toLowerCase().split('.').pop();
  for (const [folder, allowed] of Object.entries(extensions)) if (allowed.includes(ext)) return { folder, ext };
  return null;
}
async function uploadMedia() {
  const file = $('media-upload').files?.[0];
  if (!file) return notify('Choose a file to upload.', true);
  if (!supabase) return notify('Supabase is not configured.', true);
  const type = classifyFile(file);
  if (!type) return notify('Unsupported file type. See the accepted formats.', true);
  if (file.size > 48 * 1024 * 1024) return notify('File is too large (48 MB maximum).', true);
  const upload = $('upload-button'); upload.disabled = true;
  upload.textContent = 'Uploading…';
  try {
    const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 55) || 'asset';
    const name = `${type.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${base}.${type.ext}`;
    const { error } = await supabase.storage.from('site-media').upload(name, file, { upsert: false, cacheControl: '3600', contentType: file.type || undefined });
    if (error) throw error;
    const { data } = supabase.storage.from('site-media').getPublicUrl(name);
    const section = getSection();
    if (section && ['hero','split','media'].includes(section.type)) {
      section.mediaUrl = data.publicUrl;
      section.mediaType = type.folder === 'images' ? 'image' : type.folder === 'videos' ? 'video' : 'file';
      markDirty();
      notify('File uploaded and attached to the selected section. Save or publish your changes.');
    } else notify('File uploaded. Use “Copy URL” to add it to any media field.');
    $('media-upload').value = '';
    await refreshMedia();
  } catch (error) { notify(`Upload failed: ${siteError(error)}`, true); }
  finally { upload.disabled = false; upload.textContent = 'Upload File'; }
}
async function refreshMedia() {
  const list = $('media-list'); list.textContent = 'Loading uploaded files…';
  if (!supabase || !user) { list.textContent = 'Configure Supabase and sign in to view media.'; return; }
  try {
    const all = await Promise.all(Object.keys(extensions).map(async folder => {
      const { data, error } = await supabase.storage.from('site-media').list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      return (data || []).filter(file => file.name && file.id).map(file => ({ ...file, folder, path: `${folder}/${file.name}` }));
    }));
    knownMedia = all.flat().sort((a,b) => (b.created_at || '').localeCompare(a.created_at || ''));
    list.replaceChildren();
    if (!knownMedia.length) { list.innerHTML = '<div class="empty-state">No media uploaded yet.</div>'; return; }
    for (const media of knownMedia) {
      const { data } = supabase.storage.from('site-media').getPublicUrl(media.path);
      const url = data.publicUrl;
      const card = document.createElement('article'); card.className = 'media-card';
      const thumb = document.createElement('div'); thumb.className = 'media-thumb';
      if (media.folder === 'images') { const img = document.createElement('img'); img.src = url; img.alt = media.name; img.loading = 'lazy'; thumb.append(img); }
      else thumb.textContent = media.folder === 'videos' ? '▶' : '▤';
      const name = document.createElement('strong'); name.textContent = media.name; name.title = media.name;
      const details = document.createElement('small'); details.textContent = `${media.folder} · ${formatFileSize(media.metadata?.size)}`;
      const buttons = document.createElement('div'); buttons.className = 'media-actions';
      const action = (label, callback, klass = 'outline') => { const b = document.createElement('button'); b.type = 'button'; b.className = `admin-button small ${klass}`; b.textContent = label; b.addEventListener('click', callback); buttons.append(b); };
      action('Copy URL', async () => {
        try { await navigator.clipboard.writeText(url); notify('Public media URL copied.'); }
        catch (_) { window.prompt('Copy this media URL:', url); }
      });
      action('Use on Section', () => {
        const section = getSection();
        if (!section) { notify('Select a section under Pages first.', true); return; }
        section.mediaUrl = url;
        section.mediaType = media.folder === 'images' ? 'image' : media.folder === 'videos' ? 'video' : 'file';
        markDirty(); navigate('pages'); notify('Media added to the selected section.');
      });
      if (media.folder === 'images') action('Set as Logo', () => { site.settings.logoUrl = url; markDirty(); notify('Logo updated in the draft.'); });
      action('Delete', async () => {
        if (!confirm(`Permanently delete ${media.name} from Storage? Check that it is not in use on the live website first.`)) return;
        const { error } = await supabase.storage.from('site-media').remove([media.path]);
        if (error) notify(`Delete failed: ${siteError(error)}`, true);
        else { notify('Media deleted.'); await refreshMedia(); }
      }, 'danger');
      card.append(thumb, name, details, buttons); list.append(card);
    }
  } catch (error) { list.innerHTML = `<div class="empty-state">Unable to load media: ${esc(siteError(error))}. Run the Supabase setup SQL first.</div>`; }
}
async function refreshLeads() {
  const tbody = $('leads-list'); tbody.innerHTML = '<tr><td colspan="5">Loading consultation requests…</td></tr>';
  if (!supabase) { tbody.innerHTML = '<tr><td colspan="5">Supabase is not configured.</td></tr>'; return; }
  const { data, error } = await supabase.from('lead_submissions').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) { tbody.innerHTML = `<tr><td colspan="5">${esc(siteError(error))}</td></tr>`; return; }
  leadsCache = data || [];
  tbody.replaceChildren();
  if (!leadsCache.length) { tbody.innerHTML = '<tr><td colspan="5">No consultation requests yet.</td></tr>'; return; }
  for (const lead of leadsCache) {
    const tr = document.createElement('tr');
    for (const content of [new Date(lead.created_at).toLocaleString(), `${lead.first_name} ${lead.last_name}\n${lead.email}\n${lead.contact_details || ''}`, `${lead.company}\n${lead.country || ''}`, lead.message || '']) {
      const td = document.createElement('td'); td.style.whiteSpace = 'pre-line'; td.style.maxWidth = '350px'; td.style.overflowWrap = 'anywhere'; td.textContent = content; tr.append(td);
    }
    const td = document.createElement('td');
    const select = document.createElement('select');
    for (const s of ['new', 'contacted', 'qualified', 'closed']) {
      const option = document.createElement('option'); option.value = s; option.textContent = s.charAt(0).toUpperCase() + s.slice(1); select.append(option);
    }
    select.value = lead.status;
    select.addEventListener('change', async () => {
      const { error } = await supabase.from('lead_submissions').update({ status: select.value }).eq('id', lead.id);
      if (error) notify(`Cannot update lead: ${siteError(error)}`, true);
      else notify('Lead status updated.');
    });
    td.append(select); tr.append(td); tbody.append(tr);
  }
}
async function ensureAuthorized(authUser) {
  const { data, error } = await supabase.from('site_admins').select('role').eq('user_id', authUser.id).maybeSingle();
  if (error) throw error;
  if (!data?.role) throw new Error('This account does not have website admin access. Ask the site owner to grant access in Supabase.');
  user = authUser; role = data.role;
  site = await loadDraft();
  selectedSectionId = site.pages.home.sections[0]?.id;
  $('user-email').textContent = `${authUser.email} · ${role}`;
  $('auth-view').hidden = true;
  $('dashboard').hidden = false;
  clearDirty();
  navigate('overview');
}
async function checkSession() {
  if (!supabase) { $('setup-hint').hidden = false; $('login-form').querySelector('button').disabled = true; return; }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return;
  if (recoveryMode) return;
  try { await ensureAuthorized(data.user); }
  catch (error) { await supabase.auth.signOut(); notify(siteError(error), true); }
}
function wireAuth() {
  if (!isConfigured) return;
  supabase.auth.onAuthStateChange(event => {
    if (event !== 'PASSWORD_RECOVERY') return;
    recoveryMode = true;
    $('login-form').hidden = true; $('reset-request-form').hidden = true;
    $('new-password-form').hidden = false;
    $('toggle-reset').hidden = true;
    notify('Please enter your new password.');
  });
  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button'); button.disabled = true;
    const data = new FormData(form);
    try {
      const { data: result, error } = await supabase.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') });
      if (error) throw error;
      await ensureAuthorized(result.user);
      form.reset();
    } catch (error) { notify(siteError(error), true); await supabase.auth.signOut(); }
    finally { button.disabled = false; }
  });
  $('toggle-reset').addEventListener('click', () => {
    const reset = $('reset-request-form');
    reset.hidden = !reset.hidden;
    $('login-form').hidden = !reset.hidden;
    $('toggle-reset').textContent = reset.hidden ? 'Forgot password?' : 'Back to sign in';
  });
  $('reset-request-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin.html` });
    if (error) notify(siteError(error), true);
    else notify('If your account is registered, a password reset link has been sent.');
  });
  $('new-password-form').addEventListener('submit', async event => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return notify(siteError(error), true);
    recoveryMode = false;
    $('new-password-form').hidden = true; $('login-form').hidden = false;
    $('toggle-reset').hidden = false;
    notify('Password updated. You may now sign in.');
    await supabase.auth.signOut();
  });
  $('signout-button').addEventListener('click', async () => {
    if (dirty && !confirm('You have unsaved changes. Sign out anyway?')) return;
    await supabase.auth.signOut(); user = null; role = ''; site = normalizeSite();
    $('dashboard').hidden = true; $('auth-view').hidden = false; notify('Signed out successfully.');
  });
}

function wireInterface() {
  $('sidebar-nav').addEventListener('click', event => {
    const button = event.target.closest('button[data-view]'); if (button) navigate(button.dataset.view);
  });
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));
  for (const id of ['save-draft', 'save-top']) $(id).addEventListener('click', save);
  for (const id of ['publish-button', 'publish-top']) $(id).addEventListener('click', publish);
  for (const id of ['preview-page', 'preview-current']) $(id).addEventListener('click', preview);
  $('preview-frame').addEventListener('load', () => previewSend());
  window.addEventListener('message', event => { if (event.data?.type === 'ACCEL4U_READY') previewSend(event); });
  $('close-preview').addEventListener('click', () => { $('preview-dialog').close(); $('preview-frame').src = 'about:blank'; });
  $('preview-dialog').addEventListener('click', event => { if (event.target === $('preview-dialog')) $('preview-dialog').close(); });
  $('add-type').innerHTML = Object.entries(SECTION_TYPES).map(([key,label]) => `<option value="${esc(key)}">${esc(label)}</option>`).join('');
  $('add-section').addEventListener('click', () => {
    const section = makeSection($('add-type').value);
    getPage().sections.push(section); selectedSectionId = section.id; markDirty(); renderPages();
  });
  $('upload-button').addEventListener('click', uploadMedia);
  $('refresh-media').addEventListener('click', refreshMedia);
  $('refresh-leads').addEventListener('click', refreshLeads);
  window.addEventListener('beforeunload', event => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });
}

wireInterface();
wireAuth();
checkSession();
