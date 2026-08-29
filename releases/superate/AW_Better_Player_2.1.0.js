// ==UserScript==
// @name         AnimeWorld Better Player
// @namespace    aw-better-player
// @version      2.1.0
// @match        *://www.animeworld.ac/play/*
// @run-at       document-start
// @description  Il player migliore di sempre — riscritto da zero.
// @description:it Il player migliore di sempre — riscritto da zero.
// @license      MIT
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    // ── Costanti ──────────────────────────────────────────────────────────────
    const HIDE_DELAY_MS    = 3000;
    const SKIP_SECONDS     = 85;
    const SAVE_INTERVAL_MS = 5000;
    const RESUME_MIN_POS   = 5;
    const RESUME_END_GAP   = 10;
    const RESUME_MAX_AGE   = 30 * 24 * 60 * 60 * 1000;

    const KEY_VOL             = 'aw-np-vol';
    const KEY_MUTE            = 'aw-np-muted';
    const KEY_GLOBAL          = 'aw-np-global';
    const KEY_RESUME_ENABLE   = 'aw-np-resume-enabled';
    const KEY_RESUME_PFX      = 'aw-np-resume:';
    const KEY_SEEK_SECS       = 'aw-np-seek-secs';
    const KEY_AUTOEP_ENABLE   = 'aw-np-autoep-enabled';
    const KEY_AUTOEP_PFX      = 'aw-np-autoep:';
    const KEY_AUTOPLAY_ENABLE = 'aw-np-autoplay-enabled';
    const KEY_COLOR           = 'aw-np-color';
    const KEY_COLOR_GLOBAL    = 'aw-np-color-global';
    const KEY_ICON_COLOR      = 'aw-np-icon-color';
    const KEY_TOP_COLOR       = 'aw-np-top-color';
    const KEY_FLASH_ENABLE    = 'aw-np-flash-enabled';
    const KEY_SPEED           = 'aw-np-speed';

    const PALETTE = [
        { name: 'Bianco',  hex: '#ffffff' },
        { name: 'Rosso',   hex: '#f44336' },
        { name: 'Arancio', hex: '#ff9800' },
        { name: 'Giallo',  hex: '#ffeb3b' },
        { name: 'Verde',   hex: '#4caf50' },
        { name: 'Ciano',   hex: '#00bcd4' },
        { name: 'Azzurro', hex: '#42a5f5' },
        { name: 'Blu',     hex: '#1565c0' },
        { name: 'Viola',   hex: '#9c27b0' },
        { name: 'Rosa',    hex: '#e91e8c' },
    ];

    const SEEK_DEFAULT  = 5;    const SEEK_MIN   = 5;    const SEEK_MAX   = 30;  const SEEK_STEP  = 5;
    const SPEED_DEFAULT = 1;    const SPEED_MIN  = 0.25; const SPEED_MAX  = 3;   const SPEED_STEP = 0.25;

    // ── Blocca playerServersAndDownloads.js ───────────────────────────────────
    const _srcDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    Object.defineProperty(HTMLScriptElement.prototype, 'src', {
        configurable: true, enumerable: true,
        get() { return _srcDesc.get.call(this); },
        set(val) {
            if (typeof val === 'string' && val.includes('playerServersAndDownloads')) return;
            _srcDesc.set.call(this, val);
        }
    });

    // ── Storage helpers ───────────────────────────────────────────────────────
    const lsGet = k      => { try { return localStorage.getItem(k); }  catch { return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, v); }      catch {} };
    const lsDel = k      => { try { localStorage.removeItem(k); }      catch {} };

    // ── Impostazioni ──────────────────────────────────────────────────────────
    const isGlobalOn      = () => lsGet(KEY_GLOBAL)           !== '0';
    const pKey            = k  => isGlobalOn() ? k : k + ':' + (window.animeIdentifier || 'unknown');
    const isResumeOn      = () => lsGet(pKey(KEY_RESUME_ENABLE))    !== '0';
    const isAutoEpOn      = () => lsGet(pKey(KEY_AUTOEP_ENABLE))    === '1';
    const isAutoPlayOn    = () => lsGet(pKey(KEY_AUTOPLAY_ENABLE))  === '1';
    const isColorGlobalOn = () => lsGet(KEY_COLOR_GLOBAL)           !== '0';
    const isIconColorOn   = () => lsGet(KEY_ICON_COLOR)             === '1';
    const isTopColorOn    = () => lsGet(KEY_TOP_COLOR)              === '1';
    const isFlashOn       = () => lsGet(KEY_FLASH_ENABLE)           !== '0';
    const colorKey        = () => isColorGlobalOn() ? KEY_COLOR : KEY_COLOR + ':' + (window.animeIdentifier || 'unknown');
    const loadColor       = () => lsGet(colorKey()) || '#ffffff';
    const loadSeekSecs    = () => { const v = parseInt(lsGet(pKey(KEY_SEEK_SECS)) ?? String(SEEK_DEFAULT), 10); return isNaN(v) ? SEEK_DEFAULT : Math.max(SEEK_MIN, Math.min(SEEK_MAX, v)); };
    const loadSpeed       = () => { const v = parseFloat(lsGet(pKey(KEY_SPEED)) ?? String(SPEED_DEFAULT)); return isNaN(v) ? SPEED_DEFAULT : Math.max(SPEED_MIN, Math.min(SPEED_MAX, v)); };
    const fmtSpeed        = v  => v.toFixed(2) + 'x';

    // ── Colore ────────────────────────────────────────────────────────────────
    function applyColor(hex, wrap, dotEl) {
        if (wrap) {
            wrap.style.setProperty('--np-accent',         hex);
            wrap.style.setProperty('--np-accent-bg',      `color-mix(in srgb, ${hex} 30%, #282828)`);
            wrap.style.setProperty('--np-accent-bg-fg',    `color-mix(in srgb, #ffffff 78%, ${hex})`);
            wrap.style.setProperty('--np-accent-state-1', `color-mix(in srgb, ${hex} 20%, transparent)`);
            wrap.style.setProperty('--np-accent-state-2', `color-mix(in srgb, ${hex} 35%, transparent)`);
            wrap.style.setProperty('--np-accent-dim',     `color-mix(in srgb, #ffffff 60%, ${hex})`);
        }
        if (dotEl) dotEl.style.background = hex;
    }

    // ── Episodio automatico ───────────────────────────────────────────────────
    const animeId         = () => window.animeIdentifier || '';
    const saveLastEpisode = t  => { if (animeId()) lsSet(KEY_AUTOEP_PFX + animeId(), t); };
    const loadLastEpisode = () => animeId() ? lsGet(KEY_AUTOEP_PFX + animeId()) : null;

    // ── Volume ────────────────────────────────────────────────────────────────
    function loadVol() {
        const v = parseFloat(lsGet(KEY_VOL) ?? '1');
        return { vol: isNaN(v) ? 1 : Math.max(0, Math.min(1, v)), muted: lsGet(KEY_MUTE) === 'true' };
    }
    const saveVol = (vol, muted) => { lsSet(KEY_VOL, String(vol)); lsSet(KEY_MUTE, String(muted)); };

    // ── Resume ────────────────────────────────────────────────────────────────
    let _activeToken  = '';
    let _stopSavingFn = null;
    const resumeKey = () => KEY_RESUME_PFX + (_activeToken || location.pathname);
    const resumeTs  = () => resumeKey() + ':ts';

    function saveResumePos(t) {
        if (!isResumeOn() || !isFinite(t) || t <= RESUME_MIN_POS) return;
        lsSet(resumeKey(), String(t));
        lsSet(resumeTs(),  String(Date.now()));
    }
    function clearResumePos() { lsDel(resumeKey()); lsDel(resumeTs()); }

    function cleanupResumeStorage() {
        try {
            const now = Date.now();
            Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).forEach(k => {
                if (!k?.startsWith(KEY_RESUME_PFX) || k.endsWith(':ts')) return;
                const ts = parseFloat(lsGet(k + ':ts') ?? '');
                if (isNaN(ts) || now - ts > RESUME_MAX_AGE) { lsDel(k); lsDel(k + ':ts'); }
            });
        } catch {}
    }

    // ── Utilities ─────────────────────────────────────────────────────────────
    function fmt(s) {
        const t = Math.floor(s || 0), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
        return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    }
    function mk(tag, id) { const e = document.createElement(tag); if (id) e.id = id; return e; }
    function mkBtn(id, html, tip) {
        const b = mk('button'); b.className = 'np-btn'; b.id = id; b.innerHTML = html; b.tabIndex = -1;
        if (tip) { const t = document.createElement('span'); t.className = 'np-tip'; t.textContent = tip; b.appendChild(t); }
        return b;
    }
    function mkIcon(btn, html) { const s = document.createElement('span'); s.className = 'np-icon'; s.innerHTML = html; btn.prepend(s); return s; }
    function setIcon(el, html) { if (el) el.innerHTML = html; }
    function setTip(btn, text) { const t = btn.querySelector('.np-tip'); if (t) t.textContent = text; }
    function mkRowTip(text) { const t = document.createElement('span'); t.className = 'np-row-tip'; t.textContent = text; return t; }
    function mkSwitch(checked) {
        const label = document.createElement('label'); label.className = 'np-switch';
        const input = document.createElement('input'); input.type = 'checkbox'; input.checked = checked;
        const track = document.createElement('span'); track.className = 'np-switch-track';
        const thumb = document.createElement('span'); thumb.className = 'np-switch-thumb';
        label.append(input, track, thumb); return { label, input };
    }
    function getAdjacentEpisode(dir) {
        const all = Array.from(document.querySelectorAll('.episode a'));
        const idx = all.findIndex(a => a.classList.contains('active'));
        if (idx === -1) return null;
        return dir === 'next' ? (all[idx + 1] ?? null) : (all[idx - 1] ?? null);
    }
    function getUrlForToken(token) {
        return fetch(`/api/episode/serverPlayerAnimeWorld?alt=1&id=${token}`, { credentials: 'same-origin' })
            .then(r => { if (!r.ok) throw new Error(); return r.text(); })
            .then(html => { const m = html.match(/file:\s*["']([^"']+)/); return m ? m[1] : null; })
            .catch(() => null);
    }

    // ── Stili ─────────────────────────────────────────────────────────────────
    function injectStyle() {
        if (document.getElementById('aw-np-style')) return;
        const s = document.createElement('style'); s.id = 'aw-np-style';
        s.textContent = `
            #player { background:#000; }
            *, *::before, *::after { box-sizing:border-box; }
            *:focus { outline:none !important; }
            button { -webkit-tap-highlight-color:transparent; }

            /* ── Root ── */
            #aw-np { position:relative;width:100%;height:100%;background:#000;display:flex;flex-direction:column;overflow:hidden;font-family:'Google Sans',Roboto,'Helvetica Neue',sans-serif;user-select:none;touch-action:pan-x pan-y; }
            #aw-np-video { flex:1;width:100%;min-height:0;display:block;background:#000;cursor:none; }
            #aw-np.ui #aw-np-video { cursor:pointer; }

            /* ── Gradienti ── */
            .np-grad { position:absolute;left:0;right:0;height:160px;pointer-events:none;opacity:0;transition:opacity .35s cubic-bezier(.4,0,.2,1); }
            #aw-np.ui .np-grad { opacity:1; }
            #aw-np-gradient     { bottom:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%); }
            #aw-np-gradient-top { top:0;background:linear-gradient(to bottom,rgba(0,0,0,.9) 0%,rgba(0,0,0,.4) 60%,transparent 100%); }

            /* ── Top bar ── */
            .np-ui-layer { opacity:0;transition:opacity .35s cubic-bezier(.4,0,.2,1);pointer-events:none; }
            #aw-np.ui .np-ui-layer { opacity:1;pointer-events:all; }
            #aw-np-top { position:absolute;top:0;left:0;right:0;height:clamp(64px,8vh,90px);display:flex;align-items:flex-start;justify-content:space-between;padding:clamp(12px,1.8vh,18px) 16px; }
            #aw-np-top-left { display:flex;flex-direction:column;gap:2px;overflow:hidden; }
            #aw-np-title { font-size:clamp(22px,3.15vh,30px);font-weight:500;letter-spacing:.01em;color:var(--np-accent-bg-fg,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:clamp(120px,35vw,400px);text-shadow:0 1px 3px rgba(0,0,0,.8),0 0 12px rgba(0,0,0,.6); }
            #aw-np-epinfo { font-size:clamp(18px,2.4vh,22px);font-weight:400;letter-spacing:.02em;color:var(--np-accent-bg-fg,rgba(255,255,255,.7));opacity:.8;text-shadow:0 1px 3px rgba(0,0,0,.8); }
            #aw-np-top-right { display:flex;align-items:center;gap:14px;flex-shrink:0; }
            #aw-np-brand { font-size:clamp(16px,2.1vh,19px);font-weight:500;letter-spacing:.04em;color:var(--np-accent-bg-fg,rgba(255,255,255,.5));opacity:.6;white-space:nowrap;line-height:1;text-shadow:0 1px 3px rgba(0,0,0,.8);text-transform:uppercase; }
            #aw-np-dot { width:10px;height:10px;border-radius:50%;background:var(--np-accent,#fff);cursor:pointer;flex-shrink:0;transition:transform .2s cubic-bezier(.4,0,.2,1),box-shadow .2s;position:relative;top:-1px;box-shadow:0 0 0 0 var(--np-accent-dim,rgba(255,255,255,.3)); }
            #aw-np-dot:hover { transform:scale(1.4);box-shadow:0 0 0 4px var(--np-accent-dim,rgba(255,255,255,.15)); }
            #aw-np-dot:hover .np-tip { opacity:1;transition-delay:.3s; }
            #aw-np-dot .np-tip { bottom:auto;top:calc(100% + 10px);left:auto;right:0;transform:none; }
            #aw-np-dot .np-tip::after { top:auto;bottom:100%;left:auto;right:5px;transform:none;border-top-color:transparent;border-bottom-color:rgba(30,30,30,.97); }

            /* ── Pannello colori ── */
            #aw-np-color-panel { position:absolute;top:clamp(64px,8vh,90px);right:12px;background:var(--np-accent-bg,#000);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px;font-size:13px;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:11;opacity:0;transform:scale(.9) translateY(-8px);transform-origin:top right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3); }
            #aw-np-color-panel.open { opacity:1;transform:scale(1) translateY(0);pointer-events:all; }
            #aw-np-color-swatches { display:flex;flex-wrap:wrap;gap:8px;width:162px; }
            .np-swatch { width:26px;height:26px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .2s cubic-bezier(.4,0,.2,1),border-color .15s,box-shadow .2s;flex-shrink:0; }
            .np-swatch:hover { transform:scale(1.25);box-shadow:0 2px 8px rgba(0,0,0,.4); }
            .np-swatch.active { border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25); }

            /* ── Controlli ── */
            #aw-np-controls { position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;padding:0 6px 6px; }

            /* ── Seek bar ── */
            #aw-np-seek-wrap { height:44px;display:flex;align-items:center;cursor:pointer;padding:0 4px;touch-action:none; }
            #aw-np-seek-track { position:relative;width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,.2);transition:height .15s cubic-bezier(.4,0,.2,1); }
            #aw-np-seek-wrap:hover #aw-np-seek-track { height:6px; }
            #aw-np-seek-buf { position:absolute;inset:0;border-radius:inherit;background:var(--np-accent-dim,rgba(255,255,255,.5));width:0;opacity:.6; }
            #aw-np-seek-fill { position:absolute;inset:0;border-radius:inherit;background:var(--np-accent,#fff);width:0;transition:background .2s; }
            #aw-np-seek-thumb { position:absolute;top:50%;left:0;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;transform:translate(-50%,-50%) scale(0);transition:transform .15s cubic-bezier(.4,0,.2,1),box-shadow .15s;box-shadow:0 2px 6px rgba(0,0,0,.4); }
            #aw-np-seek-wrap:hover #aw-np-seek-thumb { transform:translate(-50%,-50%) scale(1); }
            #aw-np-seek-wrap.seeking #aw-np-seek-thumb { transform:translate(-50%,-50%) scale(1.2); }
            #aw-np-seek-tip { position:absolute;bottom:calc(100% + 10px);left:0;transform:translateX(-50%);background:var(--np-accent-bg,#282828);color:var(--np-accent-bg-fg,#fff);font-size:12px;font-weight:500;padding:4px 8px;border-radius:6px;pointer-events:none;white-space:nowrap;visibility:hidden;box-shadow:0 2px 8px rgba(0,0,0,.4);letter-spacing:.02em; }

            /* ── Barra bottoni ── */
            #aw-np-bar { display:flex;align-items:center;height:clamp(40px,5.5vh,56px);gap:0; }
            .np-icon { display:contents; }
            .np-btn {
                position:relative;overflow:hidden;
                display:flex;align-items:center;justify-content:center;
                width:clamp(36px,4.5vh,52px);height:clamp(36px,4.5vh,52px);
                background:none;border:none;cursor:pointer;
                color:var(--np-accent-bg-fg,rgba(255,255,255,.75));padding:0;flex-shrink:0;
                border-radius:50%;
                transition:color .2s cubic-bezier(.4,0,.2,1),background .2s;
            }
            .np-btn:hover { color:var(--np-accent-bg-fg,#fff);background:var(--np-accent-state-1,rgba(255,255,255,.1)); }
            .np-btn:active { background:var(--np-accent-state-2,rgba(255,255,255,.18)); }
            .np-btn svg { display:block;fill:currentColor;flex-shrink:0;width:clamp(20px,2.8vh,30px);height:clamp(20px,2.8vh,30px);transition:transform .2s cubic-bezier(.4,0,.2,1); }
            #aw-np:fullscreen .np-btn svg, #aw-np:-webkit-full-screen .np-btn svg { width:clamp(24px,3.36vh,36px);height:clamp(24px,3.36vh,36px); }
            .np-btn:active svg { transform:scale(.88); }
            .np-btn svg line { stroke:currentColor; }
            .accent-icons .np-btn { color:var(--np-accent,#fff); }
            .accent-icons .np-btn svg { fill:var(--np-accent,#fff); }
            .accent-icons .np-btn svg line { stroke:var(--np-accent,#fff); }
            .accent-top #aw-np-title { color:var(--np-accent,#fff); }
            .accent-top #aw-np-epinfo { color:var(--np-accent,#fff);opacity:.75; }
            .accent-top #aw-np-brand { color:var(--np-accent,#fff);opacity:.5; }

            /* Ripple */
            .np-ripple { position:absolute;border-radius:50%;background:var(--np-accent-state-1,rgba(255,255,255,.3));transform:scale(0);animation:np-ripple .4s cubic-bezier(.4,0,.2,1);pointer-events:none; }
            @keyframes np-ripple { to { transform:scale(2.5);opacity:0; } }

            #aw-np-time { font-size:clamp(11px,1.4vh,14px);font-weight:400;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));letter-spacing:.04em;white-space:nowrap;padding:0 6px;font-variant-numeric:tabular-nums;text-shadow:0 1px 3px rgba(0,0,0,.8); }
            #aw-np-spacer { flex:1; }

            /* ── Volume ── */
            #aw-np-vol-group { position:relative;display:flex;align-items:center; }
            #aw-np-vol-group::after { content:'';position:absolute;bottom:100%;left:-8px;right:-8px;height:calc(44px + 8px + 12px);pointer-events:none; }
            #aw-np-vol-group:hover::after { pointer-events:all; }
            #aw-np-vol-popup { position:absolute;bottom:calc(clamp(40px,5.5vh,56px) + 44px + 8px);left:50%;transform:translateX(-50%);width:44px;height:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;transition:height .25s cubic-bezier(.4,0,.2,1),padding .25s cubic-bezier(.4,0,.2,1);padding:0; }
            #aw-np-vol-group:hover #aw-np-vol-popup, #aw-np-vol-group:focus-within #aw-np-vol-popup { height:148px;padding:10px 0 12px;background:var(--np-accent-bg,#1c1c1c);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.4); }
            #aw-np-vol-pct { font-size:12px;font-weight:500;color:var(--np-accent-bg-fg,rgba(255,255,255,.85));width:32px;text-align:center;font-variant-numeric:tabular-nums;flex-shrink:0;display:block;letter-spacing:.02em;text-shadow:0 1px 3px rgba(0,0,0,.8); }            #aw-np-vol { -webkit-appearance:none;appearance:none;width:4px;height:108px;border-radius:2px;background:rgba(255,255,255,.2);cursor:pointer;outline:none;writing-mode:vertical-lr;direction:rtl;transition:background .15s; }
            #aw-np-vol::-webkit-slider-thumb { -webkit-appearance:none;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4);transition:transform .15s cubic-bezier(.4,0,.2,1); }
            #aw-np-vol:hover::-webkit-slider-thumb { transform:scale(1.2); }
            #aw-np-vol::-moz-range-thumb { width:14px;height:14px;background:var(--np-accent,#fff);border:none;border-radius:50%;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4); }

            /* ── Spinner ── */
            #aw-np-spinner { position:absolute;top:50%;left:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border:3px solid rgba(255,255,255,.12);border-top-color:var(--np-accent,#fff);border-radius:50%;animation:np-spin .65s linear infinite;pointer-events:none;display:none; }
            #aw-np-spinner.on { display:block; }
            @keyframes np-spin { to { transform:rotate(360deg); } }

            /* ── Flash centrale ── */
            /* ── Flash centrale e volume ── */
            .np-flash-circle { position:absolute;top:50%;left:50%;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;z-index:12;color:var(--np-accent-bg-fg,rgba(255,255,255,.9)); }
            .np-flash-circle::before { content:'';position:absolute;inset:0;border-radius:50%;background:var(--np-accent-bg,#1a1a2e);opacity:.8;pointer-events:none; }
            .np-flash-circle.on { opacity:1; }
            .np-flash-circle svg { fill:var(--np-accent-bg-fg,rgba(255,255,255,.9));opacity:1;width:34px;height:34px;position:relative;z-index:1; }
            #aw-np-center { margin:-36px 0 0 -36px;transform:scale(.7);transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.34,1.56,.64,1); }
            #aw-np-center.on { transform:scale(1); }
            #aw-np-vol-flash { transform:translate(-50%,-50%);transition:opacity .2s cubic-bezier(.4,0,.2,1); }
            #aw-np-vol-flash svg { display:block; }

            /* ── Pannello impostazioni ── */
            #aw-np-settings-panel { position:absolute;bottom:calc(clamp(40px,5.5vh,56px) + 44px + 8px);right:12px;background:var(--np-accent-bg,#000);border-radius:12px;padding:14px 18px;min-width:230px;display:flex;flex-direction:column;gap:10px;font-size:13px;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));z-index:10;opacity:0;transform:scale(.9) translateY(8px);transform-origin:bottom right;pointer-events:none;transition:opacity .2s cubic-bezier(.4,0,.2,1),transform .2s cubic-bezier(.4,0,.2,1);box-shadow:0 8px 24px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3); }
            #aw-np-settings-panel.open { opacity:1;transform:scale(1) translateY(0);pointer-events:all; }

            /* ── Tooltip righe ── */
            .np-row-tip { position:absolute;top:50%;right:calc(100% + 14px);transform:translateY(-50%);background:var(--np-accent-bg,#000);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:12px;line-height:1.5;padding:6px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s cubic-bezier(.4,0,.2,1);transition-delay:0s;z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4); }
            .np-row-tip::after { content:'';position:absolute;top:50%;left:100%;transform:translateY(-50%);border:5px solid transparent;border-left-color:var(--np-accent-bg,#000); }
            [data-tip]:hover .np-row-tip { opacity:1;transition-delay:.5s; }

            /* ── Switch ── */
            .np-switch { position:relative;width:36px;height:20px;flex-shrink:0;cursor:pointer; }
            .np-switch input { opacity:0;width:0;height:0;position:absolute; }
            .np-switch-track { position:absolute;inset:0;border-radius:10px;background:rgba(255,255,255,.2);transition:background .2s cubic-bezier(.4,0,.2,1); }
            .np-switch input:checked ~ .np-switch-track { background:var(--np-accent,#fff); }
            .np-switch-thumb { position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s cubic-bezier(.4,0,.2,1),background .2s,box-shadow .2s;box-shadow:0 1px 4px rgba(0,0,0,.3); }
            .np-switch input:checked ~ .np-switch-thumb { transform:translateX(16px);box-shadow:0 1px 4px rgba(0,0,0,.4); }
            .np-switch input:not(:checked) ~ .np-switch-thumb { background:rgba(255,255,255,.8); }

            /* ── Tooltip bottoni ── */
            .np-tip { position:absolute;bottom:calc(100% + clamp(40px,5.5vh,56px) + 4px);left:50%;transform:translateX(-50%);background:var(--np-accent-bg,#000);color:var(--np-accent-bg-fg,rgba(255,255,255,.9));font-size:12px;font-weight:400;letter-spacing:.02em;padding:5px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s cubic-bezier(.4,0,.2,1);transition-delay:0s;z-index:15;box-shadow:0 4px 12px rgba(0,0,0,.4); }
            .np-tip::after { content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--np-accent-bg,#000); }
            .np-btn:hover .np-tip { opacity:1;transition-delay:.35s; }
            #aw-np-bar > .np-btn:first-child .np-tip { left:0;transform:none; }
            #aw-np-bar > .np-btn:first-child .np-tip::after { left:calc(clamp(36px,4.5vh,52px)/2);transform:translateX(-50%); }
            #aw-np-bar > .np-btn:last-child .np-tip { left:auto;right:0;transform:none; }
            #aw-np-bar > .np-btn:last-child .np-tip::after { left:auto;right:calc(clamp(36px,4.5vh,52px)/2);transform:translateX(50%); }

            /* ── Toast ── */
            #aw-np-toast { position:absolute;bottom:calc(clamp(40px,5.5vh,56px) + 44px + 16px);left:50%;transform:translateX(-50%);background:color-mix(in srgb, var(--np-accent-bg,#282828) 80%, transparent);color:var(--np-accent-bg-fg,rgba(255,255,255,.92));font-size:13px;font-weight:500;letter-spacing:.02em;padding:7px 16px;border-radius:24px;pointer-events:none;white-space:nowrap;opacity:1;transition:opacity .4s cubic-bezier(.4,0,.2,1);z-index:20;box-shadow:0 4px 12px rgba(0,0,0,.4); }
        `;
        document.head.appendChild(s);
    }

    // ── Icone SVG ─────────────────────────────────────────────────────────────
    const svg = p => `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${p}</svg>`;
    const IC = {
        play:     svg('<path d="M8 5v14l11-7z"/>'),
        pause:    svg('<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'),
        mute:     svg('<path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>'),
        vol:     svg('<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>'),
        volDown: svg('<path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>'),
        fsOn:     svg('<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>'),
        fsOff:    svg('<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'),
        pip:      svg('<path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3C1.9 3 1 3.88 1 4.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/>'),
        restart:  svg('<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>'),
        skip:     svg('<path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/><path d="M13 1v6l4-3z"/><line x1="13" y1="8" x2="13" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><line x1="13" y1="14" x2="16" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>'),
        undo:     svg('<g transform="scale(-1,1) translate(-24,0)"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/><path d="M13 1v6l4-3z"/><line x1="13" y1="8" x2="13" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><line x1="13" y1="14" x2="16" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></g>'),
        prev:     svg('<rect x="5" y="5" width="2.5" height="14"/><polygon points="19,5 9,12 19,19"/>'),
        next:     svg('<polygon points="5,5 15,12 5,19"/><rect x="16.5" y="5" width="2.5" height="14"/>'),
        settings: svg('<path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>'),
        seekFwd:  svg('<path d="M6 5l6 7-6 7M13 5l6 7-6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
        seekBwd:  svg('<path d="M18 5l-6 7 6 7M11 5l-6 7 6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'),
    };

    // ── Build player ──────────────────────────────────────────────────────────
    let cleanup = null;

    function buildPlayer(videoUrl) {
        const { vol, muted } = loadVol();

        const wrap    = mk('div',   'aw-np');
        const video   = mk('video', 'aw-np-video');
        const grad    = mk('div',   'aw-np-gradient');     grad.classList.add('np-grad');
        const gradTop = mk('div',   'aw-np-gradient-top'); gradTop.classList.add('np-grad');
        const spinner = mk('div',   'aw-np-spinner');
        const center  = mk('div',   'aw-np-center');  center.classList.add('np-flash-circle');
        const topBar   = mk('div', 'aw-np-top');      topBar.classList.add('np-ui-layer');
        const ctrls    = mk('div', 'aw-np-controls'); ctrls.classList.add('np-ui-layer');

        video.autoplay     = false;
        video.preload      = 'metadata';
        video.src          = videoUrl;
        video.volume       = vol;
        video.muted        = muted;
        video.playbackRate = loadSpeed();
        center.innerHTML   = IC.play;

        const _origPlay = video.play.bind(video);
        const _play     = () => _origPlay().catch(() => {});

        // ── Seek bar ──────────────────────────────────────────────────────────
        const seekWrap  = mk('div', 'aw-np-seek-wrap');
        const seekTrack = mk('div', 'aw-np-seek-track');
        const seekBuf   = mk('div', 'aw-np-seek-buf');
        const seekFill  = mk('div', 'aw-np-seek-fill');
        const seekThumb = mk('div', 'aw-np-seek-thumb');
        const seekTip   = mk('div', 'aw-np-seek-tip');
        seekTrack.append(seekBuf, seekFill, seekThumb, seekTip);
        seekWrap.append(seekTrack);

        // ── Bottoni barra ─────────────────────────────────────────────────────
        const btnPlay     = mkBtn('aw-btn-play',     '',          'Riproduci');
        const btnRestart  = mkBtn('aw-btn-restart',  IC.restart,  'Ricomincia (R)');
        const btnMute     = mkBtn('aw-btn-mute',     '',          muted ? 'Audio (M)' : 'Muto (M)');
        const btnUndo     = mkBtn('aw-btn-undo',     IC.undo,     'Annulla skip (B)');
        const btnSkip     = mkBtn('aw-btn-skip',     IC.skip,     'Skip OP/ED (O)');
        const btnPrev     = mkBtn('aw-btn-prev',     IC.prev,     'Precedente (P)');
        const btnNext     = mkBtn('aw-btn-next',     IC.next,     'Successivo (N)');
        const btnSettings = mkBtn('aw-btn-settings', IC.settings, 'Impostazioni');
        const btnPip      = mkBtn('aw-btn-pip',      IC.pip,      'Picture in Picture');
        const btnFs       = mkBtn('aw-btn-fs',       '',          'Fullscreen (F)');

        const icoPlay = mkIcon(btnPlay, IC.play);
        const icoMute = mkIcon(btnMute, muted ? IC.mute : IC.vol);
        const icoFs   = mkIcon(btnFs,   IC.fsOn);

        // ── Volume ────────────────────────────────────────────────────────────
        const volGroup = mk('div',   'aw-np-vol-group');
        const volPopup = mk('div',   'aw-np-vol-popup');
        const volPctEl = mk('div',   'aw-np-vol-pct');
        const volEl    = mk('input', 'aw-np-vol');
        volEl.type = 'range'; volEl.min = 0; volEl.max = 100;
        volEl.value = muted ? 0 : Math.round(vol * 100); volEl.tabIndex = -1;
        volPctEl.textContent = (muted ? 0 : Math.round(vol * 100)) + '%';
        volPopup.append(volPctEl, volEl);
        volGroup.append(volPopup, btnMute);

        let lastNonZeroVol = muted ? (vol || 1) : vol;
        const updateMuteState = () => {
            const m = video.muted || video.volume === 0;
            setIcon(icoMute, m ? IC.mute : IC.vol);
            setTip(btnMute, m ? 'Audio (M)' : 'Muto (M)');
        };
        const updateVolUi = () => {
            const pct = (video.muted || video.volume === 0) ? 0 : Math.round(video.volume * 100);
            volPctEl.textContent = pct + '%';
            volEl.style.background = `linear-gradient(to top, var(--np-accent,#fff) ${pct}%, rgba(255,255,255,.25) ${pct}%)`;
        };
        updateVolUi();

        volEl.addEventListener('input', () => {
            const v = Number(volEl.value) / 100;
            video.volume = v; video.muted = v === 0;
            if (v > 0) lastNonZeroVol = v;
            updateMuteState(); updateVolUi();
            saveVol(v === 0 ? lastNonZeroVol : v, video.muted);
        });
        volEl.addEventListener('pointerup', () => volEl.blur());
        btnMute.addEventListener('click', () => {
            if (video.muted || video.volume === 0) {
                video.muted = false; video.volume = lastNonZeroVol;
                volEl.value = Math.round(video.volume * 100);
            } else {
                if (video.volume > 0) lastNonZeroVol = video.volume;
                video.muted = true; volEl.value = 0;
            }
            updateMuteState(); updateVolUi();
            saveVol(video.muted ? lastNonZeroVol : video.volume, video.muted);
            showVolFlash(video.muted ? 'down' : 'up');
        });

        // ── Time ──────────────────────────────────────────────────────────────
        const timeEl = mk('div', 'aw-np-time'); timeEl.textContent = '00:00 / 00:00';
        const spacer = mk('div', 'aw-np-spacer');

        // ── Pannello impostazioni ─────────────────────────────────────────────
        const settingsPanel = mk('div', 'aw-np-settings-panel');
        const BTN_CTRL_STYLE = 'background:var(--np-accent-state-1,rgba(255,255,255,.15));border:none;color:var(--np-accent-bg-fg,#fff);width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;';

        const mkSwitchRow = (label, tip, isOn, onChange, extraStyle = '', stopProp = false) => {
            const row = document.createElement('div');
            row.style.cssText = `position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;${extraStyle}`;
            row.dataset.tip = '1';
            const lbl = document.createElement('span'); lbl.textContent = label;
            const { label: sw, input: toggle } = mkSwitch(typeof isOn === 'function' ? isOn() : isOn);
            toggle.addEventListener('change', e => { if (stopProp) e.stopPropagation(); onChange(toggle.checked); });
            row.addEventListener('click', () => { toggle.checked = !toggle.checked; toggle.dispatchEvent(new Event('change')); });
            sw.addEventListener('click', e => e.stopPropagation());
            row.append(lbl, sw, mkRowTip(tip));
            return { row, toggle };
        };

        const { row: resumeRow,   toggle: resumeToggle   } = mkSwitchRow('Ripresa automatica',  'Riprende dall\'ultima interruzione.',          isResumeOn(),   v => lsSet(pKey(KEY_RESUME_ENABLE),   v ? '1' : '0'));
        const { row: autoEpRow,   toggle: autoEpToggle   } = mkSwitchRow('Episodio automatico', 'Riapre l\'ultimo episodio visto.',              isAutoEpOn(),   v => lsSet(pKey(KEY_AUTOEP_ENABLE),   v ? '1' : '0'));
        const { row: autoPlayRow, toggle: autoPlayToggle } = mkSwitchRow('Autoplay',            'In fullscreen, parte il video in automatico.', isAutoPlayOn(), v => lsSet(pKey(KEY_AUTOPLAY_ENABLE), v ? '1' : '0'));

        let seekSecs = loadSeekSecs();
        const { row: seekRow, update: updateSeekVal } = (() => {
            const row = document.createElement('div'); row.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;user-select:none;'; row.dataset.tip = '1';
            const val = document.createElement('span'); val.style.cssText = 'min-width:40px;text-align:center;font-weight:500;';
            const upd = () => val.textContent = String(seekSecs).padStart(2,'0') + ' s';
            const bM = document.createElement('button'); bM.textContent = '−'; bM.style.cssText = BTN_CTRL_STYLE; bM.tabIndex = -1;
            const bP = document.createElement('button'); bP.textContent = '+'; bP.style.cssText = BTN_CTRL_STYLE; bP.tabIndex = -1;
            bM.addEventListener('click', e => { e.stopPropagation(); if (seekSecs <= SEEK_MIN) return; seekSecs -= SEEK_STEP; lsSet(pKey(KEY_SEEK_SECS), String(seekSecs)); upd(); });
            bP.addEventListener('click', e => { e.stopPropagation(); if (seekSecs >= SEEK_MAX) return; seekSecs += SEEK_STEP; lsSet(pKey(KEY_SEEK_SECS), String(seekSecs)); upd(); });
            const ctrl = document.createElement('div'); ctrl.style.cssText = 'display:flex;align-items:center;gap:6px;'; ctrl.append(bM, val, bP);
            row.append(document.createElement('span'), ctrl, mkRowTip('Secondi saltati con le freccette.'));
            row.firstChild.textContent = 'Seek';
            upd(); return { row, update: upd };
        })();

        let speedVal = loadSpeed();
        const { row: speedRow, update: updateSpeedVal } = (() => {
            const row = document.createElement('div'); row.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;user-select:none;'; row.dataset.tip = '1';
            const val = document.createElement('span'); val.style.cssText = 'min-width:40px;text-align:center;font-weight:500;';
            const upd = () => { val.textContent = fmtSpeed(speedVal); if (video.readyState > 0) video.playbackRate = speedVal; };
            const bM = document.createElement('button'); bM.textContent = '−'; bM.style.cssText = BTN_CTRL_STYLE; bM.tabIndex = -1;
            const bP = document.createElement('button'); bP.textContent = '+'; bP.style.cssText = BTN_CTRL_STYLE; bP.tabIndex = -1;
            bM.addEventListener('click', e => { e.stopPropagation(); if (speedVal <= SPEED_MIN) return; speedVal = Math.round((speedVal - SPEED_STEP)*100)/100; lsSet(pKey(KEY_SPEED), String(speedVal)); upd(); });
            bP.addEventListener('click', e => { e.stopPropagation(); if (speedVal >= SPEED_MAX) return; speedVal = Math.round((speedVal + SPEED_STEP)*100)/100; lsSet(pKey(KEY_SPEED), String(speedVal)); upd(); });
            const ctrl = document.createElement('div'); ctrl.style.cssText = 'display:flex;align-items:center;gap:6px;'; ctrl.append(bM, val, bP);
            row.append(document.createElement('span'), ctrl, mkRowTip('Velocità di riproduzione.'));
            row.firstChild.textContent = 'Velocità';
            upd(); return { row, update: upd };
        })();

        const globalRow = document.createElement('div'); globalRow.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;border-top:1px solid var(--np-accent-state-1,rgba(255,255,255,.12));padding-top:10px;margin-top:2px;'; globalRow.dataset.tip = '1';
        const globalLabel = document.createElement('span'); globalLabel.textContent = 'Globale';
        const { label: globalSw, input: globalToggle } = mkSwitch(isGlobalOn());
        globalToggle.addEventListener('change', () => {
            lsSet(KEY_GLOBAL, globalToggle.checked ? '1' : '0');
            resumeToggle.checked = isResumeOn(); autoEpToggle.checked = isAutoEpOn(); autoPlayToggle.checked = isAutoPlayOn();
            seekSecs = loadSeekSecs(); updateSeekVal(); speedVal = loadSpeed(); updateSpeedVal();
        });
        globalRow.addEventListener('click', () => { globalToggle.checked = !globalToggle.checked; globalToggle.dispatchEvent(new Event('change')); });
        globalSw.addEventListener('click', e => e.stopPropagation());
        globalRow.append(globalLabel, globalSw, mkRowTip('Applica a tutte le serie.'));

        settingsPanel.append(resumeRow, autoEpRow, autoPlayRow, seekRow, speedRow, globalRow);

        // ── Barra controlli ───────────────────────────────────────────────────
        const bar = mk('div', 'aw-np-bar');
        bar.append(btnPlay, btnRestart, volGroup, timeEl, spacer, btnUndo, btnSkip, btnPrev, btnNext, btnSettings, btnPip, btnFs);
        ctrls.append(seekWrap, bar);

        // ── Top bar ───────────────────────────────────────────────────────────
        const topLeft  = mk('div', 'aw-np-top-left');
        const topRight = mk('div', 'aw-np-top-right');
        const titleEl  = mk('div', 'aw-np-title');
        const epInfoEl = mk('div', 'aw-np-epinfo');
        const brandEl  = mk('div', 'aw-np-brand');
        const dotEl    = mk('div', 'aw-np-dot');

        const allEps   = Array.from(document.querySelectorAll('.episode a'));
        const epIdx    = allEps.findIndex(a => a.classList.contains('active'));
        const activeEp = epIdx !== -1 ? allEps[epIdx] : null;
        const epNum    = activeEp ? (activeEp.textContent.trim() || String(epIdx + 1)) : '?';
        const epMaxNum = allEps.reduce((m, a) => { const n = parseFloat(a.textContent.trim()); return isNaN(n) ? m : Math.max(m, n); }, 0);
        const epTotal  = epMaxNum > 0 ? String(epMaxNum) : (allEps.length || '?');

        titleEl.textContent  = window.animeName || document.title.split(' Episodio')[0] || '';
        epInfoEl.textContent = `Episodio ${epNum}/${epTotal}`;
        brandEl.textContent  = 'AW Better Player';

        const dotTip = document.createElement('span'); dotTip.className = 'np-tip'; dotTip.textContent = 'Aspetto';
        dotEl.style.position = 'relative'; dotEl.appendChild(dotTip);

        topLeft.append(titleEl, epInfoEl);
        topRight.append(brandEl, dotEl);
        topBar.append(topLeft, topRight);

        // ── Pannello colori ───────────────────────────────────────────────────
        const colorPanel = mk('div', 'aw-np-color-panel');
        const swatchWrap = mk('div', 'aw-np-color-swatches');
        let currentColor = loadColor();

        const customInput   = document.createElement('input');
        const customPreview = document.createElement('div');
        const syncCustomInput  = hex => { customInput.value = hex; customPreview.style.background = hex; };
        const applyCustomColor = () => {
            let val = customInput.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (!/^#[0-9a-fA-F]{6}$/i.test(val)) { syncCustomInput(currentColor); return; }
            val = val.toLowerCase(); currentColor = val; lsSet(colorKey(), val);
            applyColor(val, wrap, dotEl); syncCustomInput(val);
            swatchWrap.querySelectorAll('.np-swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === val));
        };
        syncCustomInput(currentColor);

        PALETTE.forEach(({ name, hex }) => {
            const sw = document.createElement('div');
            sw.className = 'np-swatch' + (hex === currentColor ? ' active' : '');
            sw.style.background = hex; sw.dataset.hex = hex; sw.title = name;
            sw.addEventListener('click', e => {
                e.stopPropagation(); currentColor = hex; lsSet(colorKey(), hex);
                applyColor(hex, wrap, dotEl); syncCustomInput(hex);
                swatchWrap.querySelectorAll('.np-swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === hex));
            });
            swatchWrap.appendChild(sw);
        });

        const customRow = document.createElement('div'); customRow.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;'; customRow.dataset.tip = '1'; customRow.addEventListener('click', e => e.stopPropagation());
        const customLabel = document.createElement('span'); customLabel.textContent = 'Custom'; customLabel.style.cssText = 'font-size:13px;color:var(--np-accent-bg-fg,rgba(255,255,255,.9));flex-shrink:0;';
        customPreview.style.cssText = 'width:14px;height:14px;border-radius:50%;flex-shrink:0;border:1px solid var(--np-accent-state-2,rgba(255,255,255,.3));';
        customInput.type = 'text'; customInput.maxLength = 7; customInput.placeholder = '#ffffff'; customInput.spellcheck = false;
        customInput.style.cssText = 'background:var(--np-accent-state-1,rgba(255,255,255,.1));border:1px solid var(--np-accent-state-2,rgba(255,255,255,.2));color:var(--np-accent-bg-fg,#fff);font-size:12px;padding:3px 6px;border-radius:4px;width:76px;outline:none;font-family:monospace;user-select:text;';
        customInput.addEventListener('input', () => { let v = customInput.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-fA-F]{6}$/i.test(v)) customPreview.style.background = v; });
        let _applyingCustom = false;
        customInput.addEventListener('blur',    () => { if (!_applyingCustom) applyCustomColor(); });
        customInput.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { _applyingCustom = true; applyCustomColor(); customInput.blur(); _applyingCustom = false; } if (e.key === 'Escape') { syncCustomInput(currentColor); customInput.blur(); } });
        customInput.addEventListener('click',   e => e.stopPropagation());
        customInput.addEventListener('focus',   () => customInput.select());
        customRow.append(customLabel, customPreview, customInput, mkRowTip('Colore personalizzato (HEX).'));

        const SEP = 'border-top:1px solid var(--np-accent-state-1,rgba(255,255,255,.12));padding-top:10px;';

        const { row: topColorRow,    toggle: topColorToggle    } = mkSwitchRow('Top bar colorata', 'Colora la barra superiore.',      isTopColorOn,    v => { lsSet(KEY_TOP_COLOR,    v ? '1' : '0'); wrap.classList.toggle('accent-top',   v); }, SEP, true);
        const { row: iconColorRow,   toggle: iconColorToggle   } = mkSwitchRow('Icone colorate',   'Colora le icone del player.',     isIconColorOn,   v => { lsSet(KEY_ICON_COLOR,   v ? '1' : '0'); wrap.classList.toggle('accent-icons', v); }, '', true);
        const { row: flashRow,       toggle: flashToggle       } = mkSwitchRow('Flash centrali',   'Rimuove le animazioni centrali.', isFlashOn,       v => { lsSet(KEY_FLASH_ENABLE, v ? '1' : '0'); }, '', true);
        const { row: colorGlobalRow, toggle: colorGlobalToggle } = mkSwitchRow('Globale', 'Applica a tutte le serie.', isColorGlobalOn, v => {
            lsSet(KEY_COLOR_GLOBAL, v ? '1' : '0'); currentColor = loadColor(); applyColor(currentColor, wrap, dotEl);
            syncCustomInput(currentColor); swatchWrap.querySelectorAll('.np-swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === currentColor));
        }, SEP, true);
        colorGlobalRow.id = 'aw-np-color-global';

        colorPanel.append(swatchWrap, customRow, topColorRow, iconColorRow, flashRow, colorGlobalRow);
        if (isIconColorOn()) wrap.classList.add('accent-icons');
        if (isTopColorOn())  wrap.classList.add('accent-top');

        dotEl.addEventListener('click',      e => { e.stopPropagation(); const was = colorPanel.classList.contains('open'); settingsPanel.classList.remove('open'); colorPanel.classList.toggle('open', !was); });
        colorPanel.addEventListener('click', e => e.stopPropagation());
        btnSettings.addEventListener('click', e => { e.stopPropagation(); const was = settingsPanel.classList.contains('open'); colorPanel.classList.remove('open'); settingsPanel.classList.toggle('open', !was); });
        settingsPanel.addEventListener('click', e => e.stopPropagation());
        wrap.addEventListener('click', () => { settingsPanel.classList.remove('open'); colorPanel.classList.remove('open'); });

        wrap.append(video, grad, gradTop, topBar, colorPanel, spinner, center, settingsPanel, ctrls);

        // ── Volume flash ──────────────────────────────────────────────────────
        const volFlash    = mk('div', 'aw-np-vol-flash'); volFlash.classList.add('np-flash-circle');
        const volFlashIco = mk('div', 'aw-np-vol-flash-icon');
        volFlash.appendChild(volFlashIco);
        wrap.appendChild(volFlash);
        let volFlashTimer = null;
        const showVolFlash = dir => { if (!isFlashOn()) return; const m = video.muted || video.volume === 0; volFlashIco.innerHTML = m ? IC.mute : (dir === 'down' ? IC.volDown : IC.vol); volFlash.classList.add('on'); clearTimeout(volFlashTimer); volFlashTimer = setTimeout(() => volFlash.classList.remove('on'), 400); };

        applyColor(currentColor, wrap, dotEl);

        // ── UI show/hide ──────────────────────────────────────────────────────
        let hideTimer = null;
        const showUi = () => { wrap.classList.add('ui'); clearTimeout(hideTimer); if (!video.paused) hideTimer = setTimeout(() => wrap.classList.remove('ui'), HIDE_DELAY_MS); };
        wrap.addEventListener('pointermove',  showUi);
        wrap.addEventListener('pointerleave', () => { if (!video.paused) wrap.classList.remove('ui'); });
        video.addEventListener('pause', () => { wrap.classList.add('ui'); clearTimeout(hideTimer); });
        video.addEventListener('play',  showUi);

        // ── Flash centrale ────────────────────────────────────────────────────
        let skipFlash = false;
        let cTimer = null;
        const flash      = html => { if (!isFlashOn()) return; center.innerHTML = html; center.classList.add('on'); clearTimeout(cTimer); cTimer = setTimeout(() => center.classList.remove('on'), 700); };
        const flashBrief = html => { if (!isFlashOn()) return; center.innerHTML = html; center.classList.add('on'); clearTimeout(cTimer); cTimer = setTimeout(() => center.classList.remove('on'), 400); };

        // ── Ripple effect material ────────────────────────────────────────────
        const addRipple = btn => {
            btn.addEventListener('pointerdown', e => {
                const r = btn.getBoundingClientRect();
                const size = Math.max(r.width, r.height);
                const x = e.clientX - r.left - size / 2;
                const y = e.clientY - r.top  - size / 2;
                const ripple = document.createElement('span');
                ripple.className = 'np-ripple';
                ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
                btn.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        };
        [btnPlay, btnRestart, btnMute, btnUndo, btnSkip, btnPrev, btnNext, btnSettings, btnPip, btnFs].forEach(addRipple);
        const toggle = () => video.paused ? _play() : video.pause();
        video.addEventListener('click',    toggle);
        video.addEventListener('dblclick', () => btnFs.click());
        btnPlay.addEventListener('click',  toggle);

        video.addEventListener('play',  () => { setIcon(icoPlay, IC.pause); setTip(btnPlay, 'Pausa');     if (!skipFlash) flash(IC.pause); });
        video.addEventListener('pause', () => { setIcon(icoPlay, IC.play);  setTip(btnPlay, 'Riproduci'); if (!skipFlash) flash(IC.play); });
        video.addEventListener('ended', () => { setIcon(icoPlay, IC.play);  setTip(btnPlay, 'Riproduci'); });

        btnRestart.addEventListener('click', () => { video.currentTime = 0; _play(); flash(IC.restart); });
        btnSkip.addEventListener('click',    () => { video.currentTime = Math.min(video.duration||0, video.currentTime + SKIP_SECONDS); flash(IC.skip); });
        btnUndo.addEventListener('click',    () => { video.currentTime = Math.max(0, video.currentTime - SKIP_SECONDS); flash(IC.undo); });
        btnPrev.addEventListener('click',    () => { const t = getAdjacentEpisode('prev'); if (t) { flash(IC.prev); loadEpisode(t.dataset.id); } });
        btnNext.addEventListener('click',    () => { const t = getAdjacentEpisode('next'); if (t) { flash(IC.next); loadEpisode(t.dataset.id); } });
        btnPip.addEventListener('click', () => {
            if (document.pictureInPictureElement) document.exitPictureInPicture().catch(()=>{});
            else video.requestPictureInPicture?.().catch(()=>{});
        });
        video.addEventListener('enterpictureinpicture', () => { setTip(btnPip, 'Chiudi PiP'); wrap.style.visibility = 'hidden'; });
        video.addEventListener('leavepictureinpicture', () => { setTip(btnPip, 'Picture in Picture'); wrap.style.visibility = ''; });
        btnFs.addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen?.().catch(()=>{}));

        // ── Spinner ───────────────────────────────────────────────────────────
        video.addEventListener('waiting', () => spinner.classList.add('on'));
        video.addEventListener('playing', () => spinner.classList.remove('on'));
        video.addEventListener('canplay', () => spinner.classList.remove('on'));

        // ── Seek bar interazione ──────────────────────────────────────────────
        let seeking = false;
        const applySeek = e => {
            const r = seekTrack.getBoundingClientRect();
            const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
            if (video.duration) video.currentTime = p * video.duration;
            const pct = p * 100 + '%';
            seekFill.style.width = pct;
            seekThumb.style.left = pct;
        };
        seekWrap.addEventListener('pointerdown', e => { seeking = true; seekWrap.classList.add('seeking'); seekWrap.setPointerCapture(e.pointerId); applySeek(e); e.preventDefault(); });
        seekWrap.addEventListener('pointermove', e => {
            if (seeking) applySeek(e);
            const r = seekTrack.getBoundingClientRect();
            const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
            seekTip.textContent = fmt(p * (video.duration || 0));
            seekTip.style.left  = (p * 100) + '%';
            seekTip.style.visibility = 'visible';
        });
        seekWrap.addEventListener('pointerleave', () => { seekTip.style.visibility = 'hidden'; });
        document.addEventListener('pointerup', () => { seeking = false; seekWrap.classList.remove('seeking'); });

        // ── Time update + MAL-Sync ────────────────────────────────────────────
        let malSyncTriggered = false;
        video.addEventListener('loadedmetadata', () => { malSyncTriggered = false; });
        video.addEventListener('timeupdate', () => {
            if (seeking || !video.duration) return;
            const p = video.currentTime / video.duration * 100;
            seekFill.style.width = p + '%';
            seekThumb.style.left = p + '%';
            timeEl.textContent   = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
            if (!malSyncTriggered && p >= 90) { malSyncTriggered = true; history.pushState({}, '', location.href); }
        });
        video.addEventListener('progress', () => {
            if (!video.duration || !video.buffered.length) return;
            seekBuf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + '%';
        });

        // ── Resume ────────────────────────────────────────────────────────────
        let episodeEnded = false;

        function showResumeToast(seconds) {
            wrap.querySelector('#aw-np-toast')?.remove();
            const toast = mk('div', 'aw-np-toast'); toast.textContent = `▶ Ripreso da ${fmt(seconds)}`; wrap.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 4000);
        }

        function attemptResume() {
            if (!isResumeOn() || !isFinite(video.duration)) return;
            const saved = parseFloat(lsGet(resumeKey()) ?? '');
            if (!saved || saved < RESUME_MIN_POS) return;
            if (video.duration - saved < RESUME_END_GAP) { clearResumePos(); return; }
            video.currentTime = saved;  // solo seek, MAI play()
            showResumeToast(saved);
        }

        video.addEventListener('loadedmetadata', () => {
            if (video.playbackRate !== speedVal) video.playbackRate = speedVal;
            attemptResume();
        }, { once: true });

        // ── Save timer ────────────────────────────────────────────────────────
        let saveTimer = null;
        const startSaving = () => { if (saveTimer) return; saveTimer = setInterval(() => saveResumePos(video.currentTime), SAVE_INTERVAL_MS); };
        const stopSaving  = () => { clearInterval(saveTimer); saveTimer = null; };
        _stopSavingFn = stopSaving;

        video.addEventListener('play',  startSaving);
        video.addEventListener('pause', stopSaving);
        video.addEventListener('ended', () => { stopSaving(); clearResumePos(); episodeEnded = true; });

        // ── Fullscreen + Autoplay ─────────────────────────────────────────────
        const onFs = () => {
            const isFs = !!document.fullscreenElement;
            setIcon(icoFs, isFs ? IC.fsOff : IC.fsOn);
            setTip(btnFs, isFs ? 'Esci (F)' : 'Fullscreen (F)');
            if (isFs && isAutoPlayOn() && video.paused && !episodeEnded) _play();
        };

        // ── Tastiera ──────────────────────────────────────────────────────────
        const onKey = e => {
            if (document.pictureInPictureElement) return;
            const tag = document.activeElement?.tagName ?? '', editable = document.activeElement?.isContentEditable;
            if (/INPUT|TEXTAREA/.test(tag) || editable) return;
            if (e.key === ' ')          { e.preventDefault(); toggle(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration||0, video.currentTime + seekSecs); flashBrief(IC.seekFwd); }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - seekSecs); flashBrief(IC.seekBwd); }
            if (e.key === 'ArrowUp')    { e.preventDefault(); video.volume = Math.min(1, video.volume+.1); video.muted = false; lastNonZeroVol = video.volume; volEl.value = Math.round(video.volume*100); saveVol(video.volume, false); updateMuteState(); updateVolUi(); showVolFlash('up'); }
            if (e.key === 'ArrowDown')  { e.preventDefault(); video.volume = Math.max(0, video.volume-.1); video.muted = video.volume===0; if (video.volume>0) lastNonZeroVol = video.volume; volEl.value = Math.round(video.volume*100); saveVol(video.muted ? lastNonZeroVol : video.volume, video.muted); updateMuteState(); updateVolUi(); showVolFlash('down'); }
            if (e.key === 'f' || e.key === 'F') btnFs.click();
            if (e.key === 'm' || e.key === 'M') btnMute.click();
            if (e.key === 'r' || e.key === 'R') btnRestart.click();
            if (e.key === 'o' || e.key === 'O') btnSkip.click();
            if (e.key === 'b' || e.key === 'B') btnUndo.click();
            if (e.key === 'p' || e.key === 'P') btnPrev.click();
            if (e.key === 'n' || e.key === 'N') btnNext.click();
        };

        // ── Storage sync ──────────────────────────────────────────────────────
        const onStorage = e => {
            if (!e.key?.startsWith('aw-np-')) return;
            resumeToggle.checked = isResumeOn(); autoEpToggle.checked = isAutoEpOn(); autoPlayToggle.checked = isAutoPlayOn(); globalToggle.checked = isGlobalOn();
            seekSecs = loadSeekSecs(); updateSeekVal(); speedVal = loadSpeed(); updateSpeedVal();
            const newColor = loadColor();
            if (newColor !== currentColor) { currentColor = newColor; applyColor(currentColor, wrap, dotEl); syncCustomInput(currentColor); swatchWrap.querySelectorAll('.np-swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === currentColor)); }
            const iconOn = isIconColorOn(); wrap.classList.toggle('accent-icons', iconOn); iconColorToggle.checked = iconOn;
            const topOn  = isTopColorOn();  wrap.classList.toggle('accent-top',   topOn);  topColorToggle.checked  = topOn;
            flashToggle.checked = isFlashOn();
            colorGlobalToggle.checked = isColorGlobalOn();
        };

        const onUnload = () => { if (!episodeEnded) saveResumePos(video.currentTime); };

        document.addEventListener('fullscreenchange', onFs);
        document.addEventListener('keydown',          onKey);
        window.addEventListener('beforeunload',       onUnload);
        window.addEventListener('storage',            onStorage);

        // ── Cleanup ───────────────────────────────────────────────────────────
        cleanup = () => {
            document.removeEventListener('fullscreenchange', onFs);
            document.removeEventListener('keydown',          onKey);
            window.removeEventListener('beforeunload',       onUnload);
            window.removeEventListener('storage',            onStorage);
            stopSaving(); _stopSavingFn = null;
            clearTimeout(hideTimer); clearTimeout(cTimer); clearTimeout(volFlashTimer);
            skipFlash = true; video.pause(); video.src = '';
            cleanup = null;
        };

        wrap._play          = () => _play();
        wrap._showResumeTst = s  => showResumeToast(s);
        wrap._setSkipFlash  = v  => { skipFlash = v; };

        return wrap;
    }

    // ── Mount (windowed) ──────────────────────────────────────────────────────
    function mountPlayer(url) {
        if (!url) return;
        const container = document.querySelector('#player');
        if (!container) return;
        const existing = container.querySelector('#aw-np-video');
        if (existing && existing.getAttribute('src') === url) return;
        if (cleanup) cleanup();
        injectStyle();
        container.innerHTML = '';
        container.appendChild(buildPlayer(url));
    }

    // ── Swap src (fullscreen) ─────────────────────────────────────────────────
    function swapVideoSrc(url) {
        const video = document.querySelector('#aw-np-video');
        if (!video) { mountPlayer(url); return; }
        if (video.getAttribute('src') === url) return;

        const wrap = document.querySelector('#aw-np');
        wrap?._setSkipFlash(true);
        video.pause();
        video.src = url;

        video.addEventListener('loadedmetadata', () => {
            const spd = loadSpeed();
            if (video.playbackRate !== spd) video.playbackRate = spd;

            if (isResumeOn()) {
                const saved = parseFloat(lsGet(resumeKey()) ?? '');
                if (saved >= RESUME_MIN_POS && isFinite(video.duration) && video.duration - saved >= RESUME_END_GAP) {
                    video.currentTime = saved;
                    wrap?._showResumeTst(saved);
                }
            }

            if (isAutoPlayOn()) {
                wrap?._play();
                video.addEventListener('playing', () => wrap?._setSkipFlash(false), { once: true });
            } else {
                wrap?._setSkipFlash(false);
            }
        }, { once: true });

        const sel = { '#aw-np-seek-fill': 'width', '#aw-np-seek-thumb': 'left', '#aw-np-seek-buf': 'width' };
        Object.entries(sel).forEach(([id, prop]) => { const el = document.querySelector(id); if (el) el.style[prop] = '0%'; });
        const timeEl = document.querySelector('#aw-np-time'); if (timeEl) timeEl.textContent = '00:00 / 00:00';
    }

    // ── Navigazione ───────────────────────────────────────────────────────────
    function setActiveEpisode(token) {
        const all = Array.from(document.querySelectorAll('.episode a'));
        const idx = all.findIndex(a => a.dataset.id === token);
        all.forEach((a, i) => a.classList.toggle('active', i === idx));
        const prevBtn = document.querySelector('.prevnext.prev'); if (prevBtn) prevBtn.style.display = idx > 0            ? '' : 'none';
        const nextBtn = document.querySelector('.prevnext.next'); if (nextBtn) nextBtn.style.display = idx < all.length-1 ? '' : 'none';
        const epInfoEl = document.querySelector('#aw-np-epinfo');
        if (epInfoEl && idx !== -1) {
            const num    = all[idx].textContent.trim() || String(idx + 1);
            const maxNum = all.reduce((m, a) => { const n = parseFloat(a.textContent.trim()); return isNaN(n) ? m : Math.max(m, n); }, 0);
            epInfoEl.textContent = `Episodio ${num}/${maxNum > 0 ? maxNum : all.length}`;
        }
    }

    // ── loadEpisode ───────────────────────────────────────────────────────────
    function loadEpisode(token) {
        if (!token) return;

        if (_stopSavingFn) { _stopSavingFn(); _stopSavingFn = null; }

        const vid = document.querySelector('#aw-np-video');
        if (vid && _activeToken) saveResumePos(vid.currentTime);

        _activeToken = token;
        saveLastEpisode(token);
        setActiveEpisode(token);

        const wasFullscreen = !!document.fullscreenElement;
        getUrlForToken(token).then(url => {
            if (!url) return;
            const epLink = document.querySelector(`.episode a[data-id="${token}"]`);
            if (epLink?.href) history.pushState({}, '', epLink.href);
            if (wasFullscreen && !!document.fullscreenElement) swapVideoSrc(url);
            else mountPlayer(url);
        });
    }

    // ── Wire navigazione ──────────────────────────────────────────────────────
    function wireControls() {
        document.querySelectorAll('.episode a').forEach(a => {
            if (a.dataset.npWired) return; a.dataset.npWired = '1';
            a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); loadEpisode(a.dataset.id); });
        });
        document.querySelectorAll('.prevnext').forEach(btn => {
            if (btn.dataset.npWired) return; btn.dataset.npWired = '1';
            btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); const t = getAdjacentEpisode(btn.dataset.value); if (t) loadEpisode(t.dataset.id); });
        });
    }

    // ── Label "Better Player" ─────────────────────────────────────────────────
    function setupPlayerLabel() {
        const hide = () => {
            ['.control[data-value="original"]', '.control[data-value="alternative"]'].forEach(sel =>
                document.querySelectorAll(sel).forEach(el => {
                    if (el.dataset.npBlocked) return; el.dataset.npBlocked = '1';
                    el.style.setProperty('display', 'none', 'important');
                    el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, true);
                })
            );
            if (!document.getElementById('aw-bp-label')) {
                const ref = document.querySelector('.control[data-value="original"]') || document.querySelector('.control[data-value="alternative"]');
                if (!ref) return;
                const label = document.createElement('div'); label.id = 'aw-bp-label'; label.className = 'control active'; label.style.pointerEvents = 'none';
                label.innerHTML = '<i style="color:#ec4f4f;" class="icon icon-random"></i> <span>Better Player</span>';
                ref.insertAdjacentElement('beforebegin', label);
            }
        };
        hide();
        new MutationObserver(hide).observe(document.body, { childList: true, subtree: true });
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    function init() {
        cleanupResumeStorage();
        injectStyle();

        const currentToken = document.querySelector('#player')?.dataset?.id;
        if (currentToken) _activeToken = currentToken;
        const lastToken = isAutoEpOn() ? loadLastEpisode() : null;

        if (lastToken && lastToken !== currentToken) {
            loadEpisode(lastToken);
        } else if (currentToken) {
            saveLastEpisode(currentToken);
            getUrlForToken(currentToken).then(url => { if (url) mountPlayer(url); });
        } else {
            const link = document.querySelector('#downloadLink');
            const href = link?.getAttribute('href') || '';
            const m    = href.match(/[?&]id=(.+)/);
            const url  = m ? decodeURIComponent(m[1]) : (href.startsWith('http') ? href : null);
            if (url) mountPlayer(url);
        }

        wireControls();
        setupPlayerLabel();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
    } else {
        setTimeout(init, 200);
    }
})();