// Modern utilities + modules (uses jQuery where helpful)
const IWB = (function () {
  const STORAGE_KEY = 'AI_APPS_LIST_V3';
  const THEME_KEY = 'AI_APPS_THEME';

  /* ================= Motion ================= */
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = prefersReduced ? 0 : 180;
  function motionSpeed() { return SPEED; }

  /* ================= Storage ================= */
  const storage = {
    get() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
      catch { return []; }
    },
    set(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); },
    clear() { localStorage.removeItem(STORAGE_KEY); },
  };

  /* ================= Theme ================= */
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('theme-light');
    else root.classList.remove('theme-light');
    localStorage.setItem(THEME_KEY, theme);
  }
  function toggleTheme() {
    const current = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }
  function initThemeToggle(buttonSelector) {
    const btn = document.querySelector(buttonSelector); if (!btn) return;
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(saved);
    btn.addEventListener('click', () => { toggleTheme(); btn.blur(); });
  }

  /* ================= Header elevation ================= */
  function initHeaderElevate(headerSel) {
    const header = document.querySelector(headerSel); if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 6) header.classList.add('is-elevated');
      else header.classList.remove('is-elevated');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ================= Validators ================= */
  // Update the app name validation to prevent spaces and numbers
  const validators = {
    appName: (v) => /^[A-Za-z]+$/.test(v),  // Only letters, no spaces or numbers
    company: (v) => /^[A-Za-z0-9]+$/.test(v), // Letters + digits, no spaces
    url: (v) => { try { new URL(v); return true; } catch { return false; } },
    required: (v) => v != null && String(v).trim().length > 0,
  };

  // Validate App Name in the form submission
  function validateForm(form) {
    let ok = true;
    const appName = form.appName.value.trim();

    // Validate app name to ensure it contains only letters (no spaces or numbers)
    if (!validators.appName(appName)) {
      setError(form, 'appName', 'The app name should contain letters only, without spaces or numbers.');
      ok = false;
    }

    // Additional form validations...
    return ok;
  }

  /* ================= Toasts ================= */
  const toastAreaId = 'toast-area';
  function ensureToastArea() {
    if (!document.getElementById(toastAreaId)) {
      const d = document.createElement('div');
      d.id = toastAreaId; d.className = 'toast-area';
      document.body.appendChild(d);
    }
  }
  function showToast(msg, type = 'success') {
    ensureToastArea();
    const wrap = document.getElementById(toastAreaId);
    const el = document.createElement('div');
    el.className = `toast ${type}`; el.role = 'status'; el.ariaLive = 'polite';
    el.innerHTML = `<span class="title">${type === 'success' ? 'Done' : type === 'error' ? 'Error' : 'Notice'}</span><span>${escapeHTML(msg)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-6px)'; }, 3200);
    setTimeout(() => { el.remove(); }, 3600);
  }

  /* ================= Helpers ================= */
  function setError(form, name, message) {
    const err = form.querySelector(`[data-for="${name}"]`);
    if (err) err.textContent = message || '';
  }
  function escapeHTML(s = '') {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function toEmbed(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
      if (u.hostname.includes('youtube.com')) {
        const id = u.searchParams.get('v'); if (id) return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch { return url; }
  }

  /* ================= Add App Form ================= */
  function validateForm(form) {
    let ok = true;
    const appName = form.appName.value.trim();
    const company = form.company.value.trim();
    const website = form.website.value.trim();
    const domain = form.domain.value;
    const isFree = (form.querySelector('input[name="isFree"]:checked') || {}).value;
    const summary = form.summary.value.trim();

    ['appName', 'company', 'website', 'domain', 'isFree', 'summary'].forEach(n => setError(form, n, ''));
    if (!validators.appName(appName)) { setError(form, 'appName', 'English letters only, no spaces.'); ok = false; }
    if (!validators.company(company)) { setError(form, 'company', 'Letters + digits only, no spaces.'); ok = false; }
    if (!validators.url(website)) { setError(form, 'website', 'Please enter a valid URL.'); ok = false; }
    if (!validators.required(domain)) { setError(form, 'domain', 'Please select a domain.'); ok = false; }
    if (!validators.required(isFree)) { setError(form, 'isFree', 'Please choose Free or Paid.'); ok = false; }
    if (!validators.required(summary)) { setError(form, 'summary', 'Please add a short summary.'); ok = false; }
    return ok;
  }
  function liveValidate(form) {
    form.appName.addEventListener('input', () =>
      setError(form, 'appName', validators.appName(form.appName.value.trim()) ? '' : 'Letters only')
    );
    form.company.addEventListener('input', () =>
      setError(form, 'company', validators.company(form.company.value.trim()) ? '' : 'Letters + digits')
    );
    form.website.addEventListener('input', () =>
      setError(form, 'website', validators.url(form.website.value.trim()) ? '' : 'Invalid URL')
    );
    form.summary.addEventListener('input', () =>
      setError(form, 'summary', form.summary.value.trim() ? '' : 'Required')
    );
  }
  function formToApp(form) {
    return {
      id: crypto.randomUUID(),
      appName: form.appName.value.trim(),
      company: form.company.value.trim(),
      website: form.website.value.trim(),
      domain: form.domain.value,
      isFree: form.querySelector('input[name="isFree"]:checked').value,
      summary: form.summary.value.trim(),
      logoUrl: form.logoUrl.value.trim(),
      audioUrl: form.audioUrl.value.trim(),
      videoUrl: form.videoUrl.value.trim(),
      createdAt: new Date().toISOString(),
    };
  }
  function initAddForm(selector) {
    const form = document.querySelector(selector); if (!form) return;
    liveValidate(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault(); if (!validateForm(form)) return;
      const list = storage.get(); list.unshift(formToApp(form)); storage.set(list);
      showToast('App added successfully');
      setTimeout(() => { window.location.href = 'apps.html'; }, 500);
    });
    form.addEventListener('reset', () =>
      ['appName', 'company', 'website', 'domain', 'isFree', 'summary'].forEach(n => setError(form, n, ''))
    );
  }

  /* ================= Apps page: filter, sort, paginate ================= */
  const state = { q: '', domain: '', free: '', sort: 'createdAt_desc', page: 1, pageSize: 8 };

  function applyFilters(list) {
    let out = [...list];
    if (state.q) {
      const q = state.q.toLowerCase();
      out = out.filter(a => a.appName.toLowerCase().includes(q) || a.company.toLowerCase().includes(q));
    }
    if (state.domain) out = out.filter(a => a.domain === state.domain);
    if (state.free) out = out.filter(a => (state.free === 'Free' ? a.isFree === 'Free' : a.isFree !== 'Free'));
    switch (state.sort) {
      case 'name_asc': out.sort((a, b) => a.appName.localeCompare(b.appName)); break;
      case 'name_desc': out.sort((a, b) => b.appName.localeCompare(a.appName)); break;
      case 'createdAt_asc': out.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      default: out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return out;
  }
  function paginate(list) {
    const start = (state.page - 1) * state.pageSize;
    return list.slice(start, start + state.pageSize);
  }

  function renderSkeleton(tbody) {
    tbody.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const tr = document.createElement('tr'); tr.className = 'skeleton-row';
      tr.innerHTML = `<td><span class="skeleton" style="width:40%"></span></td>
                      <td><span class="skeleton" style="width:50%"></span></td>
                      <td><span class="skeleton" style="width:35%"></span></td>
                      <td><span class="skeleton" style="width:30%"></span></td>
                      <td><span class="skeleton" style="width:25%"></span></td>`;
      tbody.appendChild(tr);
    }
  }

  function renderApps(tbody, infoEl, emptyEl) {
    const all = storage.get();
    const filtered = applyFilters(all);
    if (infoEl) infoEl.textContent = `Results: ${filtered.length}`;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    const pageItems = paginate(filtered);
    tbody.innerHTML = '';
    pageItems.forEach(app => appendAppRow(tbody, app));
  }

  function appendAppRow(tbody, app) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="flex items-center gap-2">
          ${app.logoUrl ? `<img src="${app.logoUrl}" alt="Logo ${escapeHTML(app.appName)}" style="width:28px;height:28px;border-radius:.5rem;border:1px solid var(--border);">` : ''}
          <a href="${app.website}" target="_blank" rel="noopener">${escapeHTML(app.appName)}</a>
        </div>
      </td>
      <td>${escapeHTML(app.company)}</td>
      <td><span class="badge">${escapeHTML(app.domain)}</span></td>
      <td>${app.isFree === 'Free' ? 'Free' : 'Paid'}</td>
      <td class="action">
        <button class="button ghost sm toggle-details" aria-expanded="false" aria-controls="details-${app.id}">Show details</button>
        <div id="details-${app.id}" class="app-details" role="region" aria-label="Details ${escapeHTML(app.appName)}">
          <p class="muted">${escapeHTML(app.summary)}</p>
          <div class="media mt-2">
            ${app.logoUrl ? `<img src="${app.logoUrl}" alt="Logo ${escapeHTML(app.appName)}">` : ''}
            ${app.audioUrl ? `<audio class="audio" controls src="${app.audioUrl}"></audio>` : ''}
            ${app.videoUrl ? (app.videoUrl.includes('youtube.com') || app.videoUrl.includes('youtu.be')
        ? `<iframe class="video" src="${toEmbed(app.videoUrl)}" title="Demo video" allowfullscreen></iframe>`
        : `<video class="video" controls src="${app.videoUrl}"></video>`)
        : ''}
          </div>
        </div>
      </td>`;
    tbody.appendChild(tr);
    $(tr).find('.toggle-details').on('click keydown', function (ev) {
      if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
      const btn = $(this);
      const panel = btn.parent().find('.app-details');
      const expanded = btn.attr('aria-expanded') === 'true';
      btn.attr('aria-expanded', String(!expanded));
      if (expanded) { panel.slideUp(SPEED); btn.text('Show details'); }
      else { panel.slideDown(SPEED); btn.text('Hide details'); }
    });
  }

  function initAppsPage(cfg) {
    const { tbodySel, infoSel, qSel, domainSel, freeSel, sortSel, pagerPrevSel, pagerNextSel, emptySel } = cfg;
    const tbody = document.querySelector(tbodySel); if (!tbody) return;
    const infoEl = document.querySelector(infoSel);
    const emptyEl = document.querySelector(emptySel);

    function refresh() { renderApps(tbody, infoEl, emptyEl); }

    // initial skeleton then real render
    renderSkeleton(tbody); setTimeout(refresh, prefersReduced ? 0 : 200);

    // Bind controls
    const q = document.querySelector(qSel);
    if (q) {
      const onQ = () => { state.q = q.value.trim(); state.page = 1; refresh(); };
      if (!$.debounce) $.debounce = (wait, fn) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, wait); }; };
      q.addEventListener('input', $.debounce(200, onQ));
    }
    const domain = document.querySelector(domainSel);
    if (domain) domain.addEventListener('change', () => { state.domain = domain.value; state.page = 1; refresh(); });
    const free = document.querySelector(freeSel);
    if (free) free.addEventListener('change', () => { state.free = free.value; state.page = 1; refresh(); });
    const sort = document.querySelector(sortSel);
    if (sort) sort.addEventListener('change', () => { state.sort = sort.value; refresh(); });
    const prev = document.querySelector(pagerPrevSel);
    if (prev) prev.addEventListener('click', () => { if (state.page > 1) { state.page--; refresh(); } });
    const next = document.querySelector(pagerNextSel);
    if (next) next.addEventListener('click', () => { state.page++; refresh(); });
  }

  /* ================= Data Ops: import / export / clear ================= */
  function toCSV(list) {
    const headers = ['appName', 'company', 'website', 'domain', 'isFree', 'summary', 'logoUrl', 'audioUrl', 'videoUrl', 'createdAt'];
    const rows = [headers.join(',')];
    list.forEach(a => {
      const vals = headers.map(h => `"${String(a[h] ?? '').replace(/"/g, '""')}"`);
      rows.push(vals.join(','));
    });
    return rows.join('\n');
  }
  function download(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }
  function initDataOps({ importInput, importBtn, exportBtn, clearBtn, emptyImportBtn }) {
    const fileInput = document.querySelector(importInput);
    const btnImport = document.querySelector(importBtn);
    const btnExport = document.querySelector(exportBtn);
    const btnClear = document.querySelector(clearBtn);
    const btnEmptyImport = document.querySelector(emptyImportBtn);

    function trigger() { fileInput && fileInput.click(); }
    if (btnImport && fileInput) btnImport.addEventListener('click', trigger);
    if (btnEmptyImport && fileInput) btnEmptyImport.addEventListener('click', trigger);

    if (fileInput) {
      fileInput.addEventListener('change', async () => {
        const f = fileInput.files && fileInput.files[0]; if (!f) return;
        try {
          const text = await f.text();
          const data = JSON.parse(text);
          if (!Array.isArray(data)) throw new Error('Invalid format: expected a JSON array.');
          const normalized = data.map(d => ({
            id: d.id || crypto.randomUUID(),
            appName: String(d.appName || '').trim(),
            company: String(d.company || '').trim(),
            website: String(d.website || ''),
            domain: String(d.domain || ''),
            isFree: d.isFree === 'Paid' ? 'Paid' : 'Free',
            summary: String(d.summary || ''),
            logoUrl: String(d.logoUrl || ''),
            audioUrl: String(d.audioUrl || ''),
            videoUrl: String(d.videoUrl || ''),
            createdAt: d.createdAt || new Date().toISOString(),
          }));
          storage.set(normalized);
          showToast('Import completed');
          location.reload();
        } catch (err) {
          showToast('Import failed: ' + err.message, 'error');
        } finally {
          fileInput.value = '';
        }
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const list = storage.get();
        if (!list.length) { showToast('Nothing to export', 'error'); return; }
        download('apps.csv', toCSV(list), 'text/csv');
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('This will delete all locally stored apps on this browser. Continue?')) {
          storage.clear(); showToast('Data cleared'); location.reload();
        }
      });
    }
  }

  return {
    motionSpeed,
    initThemeToggle,
    initHeaderElevate,
    initAddForm,
    initAppsPage,
    initDataOps
  };
})();
