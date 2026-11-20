import './style.css';
import { PAGE_META, INITIAL_SITE } from './default-content.js';
import { loadPublished } from './content.js';
import { supabase } from './supabase.js';
import { escapeHtml as e, escapeAttr as a, lineBreaks, safeUrl, targetAttrs, cssColor } from './utils.js';

const root = document.getElementById('app');
const path = window.location.pathname.replace(/\/$/, '') || '/';
const slug = Object.keys(PAGE_META).find(id => PAGE_META[id].path === path) || 'home';
const previewMode = new URLSearchParams(window.location.search).get('preview') === '1';
let currentSite = INITIAL_SITE;

const link = (href, text, className = '') => {
  const url = safeUrl(href, '/free-consultation');
  return `<a class="${a(className)}" href="${a(url)}"${targetAttrs(url)}>${e(text)} <span aria-hidden="true">↗</span></a>`;
};
const icon = (value = '✦') => `<span class="item-icon" aria-hidden="true">${e(value)}</span>`;
const sectionWrap = (section, children, cls = '') => `
  <section id="${a(section.id)}" class="content-section section-${a(section.type)} theme-${a(section.theme || 'white')} align-${a(section.align || 'left')} ${cls}">
    <div class="container">${children}</div>
  </section>`;
const sectionIntro = sec => `
  <div class="section-heading">
    ${sec.eyebrow ? `<span class="eyebrow">${e(sec.eyebrow)}</span>` : ''}
    ${sec.title ? `<h2>${e(sec.title)}</h2>` : ''}
    ${sec.subtitle ? `<h3>${e(sec.subtitle)}</h3>` : ''}
    ${sec.body ? `<p>${lineBreaks(sec.body)}</p>` : ''}
  </div>`;

function mediaElement(section, className = '') {
  const url = safeUrl(section.mediaUrl);
  if (!url) return `<div class="placeholder-art ${className}" aria-hidden="true"><span>4<span>U</span></span><small>Enabling Growth<br>Accelerating Success</small></div>`;
  if (section.mediaType === 'video') return `<video class="media-box ${className}" controls preload="metadata" playsinline src="${a(url)}" aria-label="${a(section.mediaAlt || section.title || 'Video')}"></video>`;
  if (section.mediaType === 'file') return `<div class="media-file">${link(url, section.mediaAlt || 'Open attached file', 'btn btn-primary')}</div>`;
  return `<img class="media-box ${className}" src="${a(url)}" alt="${a(section.mediaAlt || section.title || '')}" loading="lazy">`;
}

function renderSection(sec) {
  if (!sec || sec.visible === false) return '';
  const items = Array.isArray(sec.items) ? sec.items : [];
  switch (sec.type) {
    case 'hero': return sectionWrap(sec, `
      <div class="hero-layout">
        <div class="hero-copy">
          ${sec.eyebrow ? `<div class="eyebrow">${e(sec.eyebrow)}</div>` : ''}
          <h1>${e(sec.title)}</h1>
          ${sec.subtitle ? `<h2>${e(sec.subtitle)}</h2>` : ''}
          ${sec.body ? `<p>${lineBreaks(sec.body)}</p>` : ''}
          <div class="hero-actions">${sec.ctaText ? link(sec.ctaHref, sec.ctaText, 'btn btn-primary') : ''}
            ${slug === 'home' ? link('/solutions', 'Explore Our Solutions', 'btn btn-outline') : ''}</div>
          ${slug === 'home' ? '<div class="hero-points"><span>✓ Skilled Teams</span><span>✓ Flexible Operations</span><span>✓ Global Expertise</span></div>' : ''}
        </div>
        <div class="hero-art"><div class="hero-orb"></div>${mediaElement(sec, 'hero-picture')}<div class="floating-pill">↗ <b>Grow with confidence</b></div></div>
      </div>`, 'hero-section');
    case 'split': return sectionWrap(sec, `
      <div class="split-layout ${sec.reverse ? 'reversed' : ''}">
        <div class="split-art">${mediaElement(sec)}</div>
        <div class="split-copy">${sectionIntro(sec)}
          ${sec.ctaText ? link(sec.ctaHref, sec.ctaText, 'btn btn-primary') : ''}
        </div>
      </div>`);
    case 'cards': return sectionWrap(sec, `${sectionIntro(sec)}<div class="cards-grid">
      ${items.map(it => `<article class="feature-card">
        ${it.mediaUrl && safeUrl(it.mediaUrl) ? `<img class="feature-thumb" alt="${a(it.title || '')}" src="${a(safeUrl(it.mediaUrl))}" loading="lazy">` : icon(it.icon)}
        <h3>${e(it.title)}</h3>${it.subtitle ? `<strong>${e(it.subtitle)}</strong>` : ''}
        ${it.body ? `<p>${lineBreaks(it.body)}</p>` : ''}
      </article>`).join('')}</div>`);
    case 'steps': return sectionWrap(sec, `${sectionIntro(sec)}<div class="steps-grid">
      ${items.map((it, i) => `<article class="step-card"><span class="step-number">${e(it.icon || String(i + 1).padStart(2, '0'))}</span><h3>${e(it.title)}</h3><p>${lineBreaks(it.body)}</p></article>`).join('')}
      </div>`);
    case 'people': return sectionWrap(sec, `${sectionIntro(sec)}<div class="people-grid">
      ${items.map(it => `<article class="person-card"><div class="person-photo">${it.mediaUrl && safeUrl(it.mediaUrl) ? `<img loading="lazy" src="${a(safeUrl(it.mediaUrl))}" alt="Portrait of ${a(it.title)}">` : '<span aria-hidden="true">◎</span>'}</div><div class="person-info"><h3>${e(it.title)}</h3><div class="person-title">${e(it.subtitle || '')}</div><p>${lineBreaks(it.body)}</p></div></article>`).join('')}</div>`);
    case 'banner': return sectionWrap(sec, `<div class="banner-content">${sectionIntro(sec)}${sec.ctaText ? link(sec.ctaHref, sec.ctaText, 'btn btn-primary') : ''}</div>`);
    case 'calculator': return sectionWrap(sec, `<div class="calc-layout">${sectionIntro(sec)}<div class="calculator" id="a4u-calculator">
      <div class="calc-form">
        <label>Service<select id="calc-service"><option value="finance">Accounting & Bookkeeping</option><option value="apar">Accounts Payable / Receivable</option><option value="hr">HR & Payroll</option><option value="customer">Customer Service</option><option value="admin">Administration</option><option value="it">IT Service Desk</option></select></label>
        <label>Team Members<input id="calc-people" type="number" min="1" max="100" value="2"></label>
        <label>Coverage<select id="calc-hours"><option value="1">Full-time · 40h/week</option><option value="0.5">Part-time · 20h/week</option></select></label>
        <label>Currency<select id="calc-currency"><option value="USD">USD</option><option value="PHP">PHP (illustrative)</option></select></label>
      </div><div class="estimate-result"><small>Illustrative monthly estimate</small><strong id="calc-result">—</strong><span id="calc-detail"></span></div>
      <p class="small-note">This calculator uses editable example planning assumptions only. Prices are not a quotation, published rates, or guaranteed savings.</p>
      ${link('/free-consultation', 'Request a Personalized Quote', 'btn btn-primary')}
    </div></div>`);
    case 'contact': return sectionWrap(sec, `<div class="contact-layout">${sectionIntro(sec)}
      <form id="consultation-form" class="contact-form" novalidate>
      <div class="form-row"><label>First Name *<input name="first_name" required maxlength="80" autocomplete="given-name"></label><label>Last Name *<input name="last_name" required maxlength="80" autocomplete="family-name"></label></div>
      <div class="form-row"><label>Work Email *<input name="email" required type="email" maxlength="180" autocomplete="email"></label><label>Job Title<input name="job_title" maxlength="120"></label></div>
      <div class="form-row"><label>Company Name *<input name="company" required maxlength="160" autocomplete="organization"></label><label>Industry<input name="industry" maxlength="120"></label></div>
      <div class="form-row"><label>Country *<input name="country" required maxlength="100" autocomplete="country-name"></label><label>Preferred Way of Contact<select name="preferred_contact"><option value="Email">Email</option><option value="Phone">Phone</option><option value="Other">Other</option></select></label></div>
      <label>Contact Details<input name="contact_details" maxlength="180" placeholder="Phone number or other preferred contact"></label>
      <label>Message *<textarea name="message" required maxlength="4000" rows="5" placeholder="Tell us what kind of support your team needs..."></textarea></label>
      <div class="honeypot" aria-hidden="true"><label>Leave this field blank<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <label class="check-row"><input type="checkbox" name="privacy" required> <span>I understand that Accel4U will process my information to respond to this consultation request. *</span></label>
      <label class="check-row"><input type="checkbox" name="marketing"> <span>I'd also like to receive other communications from Accel4U (optional).</span></label>
      <button class="btn btn-primary" type="submit">Submit Consultation Request ↗</button>
      <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
      </form></div>`);
    case 'resources': return sectionWrap(sec, `${sectionIntro(sec)}<div class="cards-grid">
       ${items.map(it => `<article class="feature-card">${icon(it.icon || '↓')}<h3>${e(it.title)}</h3><p>${lineBreaks(it.body)}</p>${safeUrl(it.mediaUrl) ? link(it.mediaUrl, 'Open Resource', 'text-link') : '<small>Resource coming soon</small>'}</article>`).join('')}</div>`);
    case 'media': return sectionWrap(sec, `<div class="split-layout"><div class="split-art">${mediaElement(sec)}</div><div class="split-copy">${sectionIntro(sec)}${sec.ctaText ? link(sec.ctaHref, sec.ctaText, 'btn btn-primary') : ''}</div></div>`);
    default: return '';
  }
}

function applySettings(site) {
  const colors = site.settings.colors || {};
  const defaults = INITIAL_SITE.settings.colors;
  for (const k of Object.keys(defaults)) {
    document.documentElement.style.setProperty(`--${k}`, cssColor(colors[k], defaults[k]));
  }
  document.body.dataset.font = site.settings.font === 'serif' ? 'serif' : 'system';
  const page = site.pages[slug] || site.pages.home;
  document.title = page.seoTitle || `${PAGE_META[slug].label} | Accel4U`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = page.seoDescription || '';
}

function render(site) {
  if (!site?.pages?.[slug]) return;
  currentSite = site;
  applySettings(site);
  const brandUrl = safeUrl(site.settings.logoUrl);
  root.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site-header"><div class="container header-inner">
      <a class="brand-link" href="/" aria-label="Accel4U - Home">${brandUrl ? `<img src="${a(brandUrl)}" alt="Accel4U logo">` : '<b>Accel<span>4U</span></b>'}</a>
      <button type="button" class="mobile-menu" id="mobile-menu" aria-label="Open navigation" aria-expanded="false" aria-controls="main-navigation">☰</button>
      <nav class="nav-links" id="main-navigation" aria-label="Primary navigation">
        ${Object.entries(PAGE_META).map(([key, meta]) => `<a href="${a(meta.path)}" ${slug === key ? 'aria-current="page"' : ''} class="${slug === key ? 'active' : ''} ${key === 'consultation' ? 'nav-cta' : ''}">${e(meta.label)}</a>`).join('')}
      </nav>
    </div></header>
    <main id="main-content">${(site.pages[slug].sections || []).map(renderSection).join('') || '<section class="container"><h1>No sections are currently published.</h1></section>'}</main>
    <footer class="site-footer"><div class="container footer-grid">
      <div class="footer-brand">${brandUrl ? `<img src="${a(brandUrl)}" alt="Accel4U logo">` : '<h3>Accel4U</h3>'}<p>${e(site.settings.tagline)}</p><p>${e(site.settings.footerNote)}</p></div>
      <div><h3>Company</h3><a href="/about">About Us</a><a href="/about#about-leadership">Leadership</a><a href="/about#about-values">Core Values</a></div>
      <div><h3>Solutions</h3><a href="/solutions">Our Services</a><a href="/solutions#sol-finance">Finance Operations</a><a href="/solutions#sol-industries">Industries</a></div>
      <div><h3>Get Started</h3><a href="/how-to">How To</a><a href="/free-consultation">Free Consultation</a><div class="footer-social">${Object.entries(site.settings.social || {}).filter(([,v])=>safeUrl(v)).map(([k,v])=>`<a href="${a(safeUrl(v))}" rel="noopener noreferrer" target="_blank">${e(k)}</a>`).join('')}</div></div>
    </div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${e(site.settings.siteName)}. All rights reserved.</span>
      <a class="admin-footer-link" href="/admin.html" title="Authorized staff access only">Admin Login</a></div></footer>`;
  document.getElementById('mobile-menu')?.addEventListener('click', ev => {
    const nav = document.getElementById('main-navigation');
    const open = nav.classList.toggle('open');
    ev.currentTarget.setAttribute('aria-expanded', String(open));
    ev.currentTarget.textContent = open ? '✕' : '☰';
  });
  if (slug === 'consultation') wireContact();
  if (document.getElementById('a4u-calculator')) wireCalculator();
}

function wireCalculator() {
  const calc = document.getElementById('a4u-calculator');
  const update = () => {
    const rates = currentSite.settings.calculatorRates || INITIAL_SITE.settings.calculatorRates;
    const service = calc.querySelector('#calc-service').value;
    const people = Math.max(1, Math.min(100, Number(calc.querySelector('#calc-people').value) || 1));
    const coverage = Number(calc.querySelector('#calc-hours').value);
    const currency = calc.querySelector('#calc-currency').value;
    const rate = Math.max(0, Number(rates[service]) || 0);
    const usd = rate * people * coverage;
    const fx = Math.max(1, Number(currentSite.settings.phpPerUsd) || 58);
    calc.querySelector('#calc-result').textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(currency === 'PHP' ? usd * fx : usd);
    calc.querySelector('#calc-detail').textContent = `${people} team member${people === 1 ? '' : 's'} · ${coverage === 1 ? 'Full-time' : 'Part-time'} · Per month`;
  };
  calc.querySelectorAll('input, select').forEach(el => el.addEventListener('input', update));
  update();
}

function wireContact() {
  const form = document.getElementById('consultation-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.getElementById('form-status');
    if (!form.reportValidity()) return;
    const inputs = Object.fromEntries(new FormData(form).entries());
    if (inputs.website) { status.textContent = 'Thank you for contacting us.'; return; }
    if (!supabase) { status.textContent = 'Online submission is not enabled yet. Please contact Accel4U through its official channels.'; status.dataset.type = 'error'; return; }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.dataset.type = '';
    status.textContent = 'Sending your request…';
    try {
      const payload = {
        first_name: inputs.first_name.trim(), last_name: inputs.last_name.trim(), email: inputs.email.trim(),
        job_title: inputs.job_title.trim(), company: inputs.company.trim(), industry: inputs.industry.trim(),
        country: inputs.country.trim(), preferred_contact: inputs.preferred_contact,
        contact_details: inputs.contact_details.trim(), message: inputs.message.trim(),
        privacy_acknowledged: true, marketing_opt_in: Boolean(inputs.marketing)
      };
      const { error } = await supabase.from('lead_submissions').insert(payload);
      if (error) throw error;
      status.textContent = 'Your consultation request was submitted successfully. Thank you!';
      form.reset();
    } catch (error) {
      console.error('Consultation form error:', error);
      status.dataset.type = 'error';
      status.textContent = 'Your request could not be sent. Please try again later.';
    } finally { button.disabled = false; }
  });
}

render(INITIAL_SITE);
if (previewMode && window.parent !== window) {
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (event.data?.type !== 'ACCEL4U_PREVIEW' || !event.data.site) return;
    render(event.data.site);
  });
  window.parent.postMessage({ type: 'ACCEL4U_READY' }, window.location.origin);
} else {
  loadPublished().then(render).catch(error => console.warn(error));
}
