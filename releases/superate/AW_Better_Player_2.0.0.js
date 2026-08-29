// ==UserScript==
// @name         AnimeWorld Better Player
// @namespace    aw-better-player
// @version      2.0.0
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
    const SCRIPT_VERSION   = '2.0.0';

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
    const colorKey        = () => isColorGlobalOn() ? KEY_COLOR : KEY_COLOR + ':' + (window.animeIdentifier || 'unknown');
    const loadColor       = () => lsGet(colorKey()) || '#ffffff';
    const loadSeekSecs    = () => { const v = parseInt(lsGet(pKey(KEY_SEEK_SECS)) ?? String(SEEK_DEFAULT), 10); return isNaN(v) ? SEEK_DEFAULT : Math.max(SEEK_MIN, Math.min(SEEK_MAX, v)); };
    const loadSpeed       = () => { const v = parseFloat(lsGet(pKey(KEY_SPEED)) ?? String(SPEED_DEFAULT)); return isNaN(v) ? SPEED_DEFAULT : Math.max(SPEED_MIN, Math.min(SPEED_MAX, v)); };
    const fmtSpeed        = v  => v.toFixed(2) + 'x';

    // ── Colore ────────────────────────────────────────────────────────────────
    function hexToRgba(hex, a) {
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return `rgba(255,255,255,${a})`;
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
    }
    function applyColor(hex, wrap, dotEl) {
        if (wrap) {
            wrap.style.setProperty('--np-accent',     hex);
            wrap.style.setProperty('--np-accent-dim', hexToRgba(hex, 0.3));
            wrap.style.setProperty('--np-accent-70',  hexToRgba(hex, 0.7));
            wrap.style.setProperty('--np-accent-60',  hexToRgba(hex, 0.6));
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
    // _activeToken: token dell'episodio attualmente caricato/in riproduzione.
    // È il namespace per leggere e scrivere la posizione di resume.
    let _activeToken  = '';
    // _stopSavingFn: ferma il timer di salvataggio dall'esterno di buildPlayer.
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
            const now  = Date.now();
            const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
            keys.forEach(k => {
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
            #aw-np {
                position:relative;width:100%;height:100%;background:#000;
                display:flex;flex-direction:column;overflow:hidden;
                font-family:'Google Sans',Roboto,'Helvetica Neue',sans-serif;
                user-select:none;
            }
            #aw-np-video { flex:1;width:100%;min-height:0;display:block;background:#000;cursor:none; }
            #aw-np.ui #aw-np-video { cursor:pointer; }
            #aw-np-gradient { position:absolute;bottom:0;left:0;right:0;height:130px;background:linear-gradient(to top,rgba(0,0,0,.88),transparent);pointer-events:none;opacity:0;transition:opacity .3s; }
            #aw-np.ui #aw-np-gradient { opacity:1; }
            #aw-np-gradient-top { position:absolute;top:0;left:0;right:0;height:130px;background:linear-gradient(to bottom,rgba(0,0,0,.88),transparent);pointer-events:none;opacity:0;transition:opacity .3s; }
            #aw-np.ui #aw-np-gradient-top { opacity:1; }
            #aw-np-top { position:absolute;top:0;left:0;right:0;height:clamp(64px,8vh,90px);display:flex;align-items:flex-start;justify-content:space-between;padding:clamp(12px,1.8vh,18px) 16px;opacity:0;transition:opacity .3s;pointer-events:none; }
            #aw-np.ui #aw-np-top { opacity:1;pointer-events:all; }
            #aw-np-top-left { display:flex;flex-direction:column;gap:3px;overflow:hidden; }
            #aw-np-title { font-size:clamp(15px,2.1vh,20px);font-weight:700;color:var(--np-accent,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:clamp(120px,35vw,400px);text-shadow:0 0 8px rgba(0,0,0,1),0 1px 3px rgba(0,0,0,1),0 0 20px rgba(0,0,0,.8); }
            #aw-np-epinfo { font-size:clamp(14px,2vh,17px);color:var(--np-accent-70,rgba(255,255,255,.7));font-weight:600;text-shadow:0 0 6px rgba(0,0,0,1),0 1px 3px rgba(0,0,0,1); }
            #aw-np-top-right { display:flex;align-items:center;gap:10px;flex-shrink:0; }
            #aw-np-brand { font-size:clamp(12px,1.5vh,14px);color:var(--np-accent-60,rgba(255,255,255,.6));font-weight:600;white-space:nowrap;line-height:1;text-shadow:0 0 6px rgba(0,0,0,1),0 1px 3px rgba(0,0,0,1); }
            #aw-np-dot { width:12px;height:12px;border-radius:50%;background:var(--np-accent,#fff);cursor:pointer;flex-shrink:0;transition:transform .15s;position:relative;top:-1px;filter:drop-shadow(0 0 4px rgba(0,0,0,.9)); }
            #aw-np-dot:hover { transform:scale(1.3); }
            #aw-np-dot:hover .np-tip { opacity:1;transition-delay:.3s; }
            #aw-np-dot .np-tip { bottom:auto;top:calc(100% + 10px);left:auto;right:0;transform:none; }
            #aw-np-dot .np-tip::after { top:auto;bottom:100%;left:auto;right:calc(12px / 2);transform:translateX(50%);border-top-color:transparent;border-bottom-color:rgba(15,15,15,.92); }

            #aw-np-color-panel { position:absolute;top:clamp(64px,8vh,90px);right:8px;background:rgba(28,28,28,.97);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:10px;font-size:13px;color:rgba(255,255,255,.9);z-index:11;opacity:0;transform:scale(.95);transform-origin:top right;pointer-events:none;transition:opacity .15s ease,transform .15s ease; }
            #aw-np-color-panel.open { opacity:1;transform:scale(1);pointer-events:all; }
            #aw-np-color-swatches { display:flex;flex-wrap:wrap;gap:8px;width:152px; }
            .np-swatch { width:24px;height:24px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .15s,border-color .15s;flex-shrink:0; }
            .np-swatch:hover { transform:scale(1.2); }
            .np-swatch.active { border-color:rgba(255,255,255,.8); }

            #aw-np-controls { position:absolute;bottom:0;left:0;right:0;display:flex;flex-direction:column;padding:0 8px 8px;opacity:0;transition:opacity .3s;pointer-events:none; }
            #aw-np.ui #aw-np-controls { opacity:1;pointer-events:all; }
            #aw-np-seek-wrap { height:40px;display:flex;align-items:center;cursor:pointer;padding:0 2px; }
            #aw-np-seek-track { position:relative;width:100%;height:4px;border-radius:2px;background:rgba(255,255,255,.25); }
            #aw-np-seek-buf  { position:absolute;inset:0;border-radius:2px;background:var(--np-accent-dim,rgba(255,255,255,.3));width:0; }
            #aw-np-seek-fill { position:absolute;inset:0;border-radius:2px;background:var(--np-accent,#fff);width:0; }
            #aw-np-seek-thumb { position:absolute;top:50%;left:0;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 4px rgba(0,0,0,.6); }
            #aw-np-seek-tip { position:absolute;bottom:calc(100% + 8px);left:0;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#fff;font-size:11px;padding:2px 6px;border-radius:4px;pointer-events:none;white-space:nowrap;visibility:hidden; }
            #aw-np-bar { display:flex;align-items:center;height:clamp(36px,5vh,52px);gap:0; }
            .np-btn { position:relative;display:flex;align-items:center;justify-content:center;width:clamp(36px,4.5vh,52px);height:clamp(36px,4.5vh,52px);background:none;border:none;cursor:pointer;color:rgba(255,255,255,.9);padding:0;flex-shrink:0; }
            .np-btn:hover { color:#fff; }
            .np-btn svg { display:block;fill:currentColor;flex-shrink:0;width:clamp(22px,3vh,32px);height:clamp(22px,3vh,32px); }
            .np-btn svg line { stroke:currentColor; }
            .accent-icons .np-btn svg { fill:var(--np-accent,#fff); }
            .accent-icons .np-btn svg line { stroke:var(--np-accent,#fff); }
            #aw-np-time { font-size:clamp(11px,1.4vh,14px);font-weight:500;color:rgba(255,255,255,.9);letter-spacing:.3px;white-space:nowrap;padding:0 8px;font-variant-numeric:tabular-nums;text-shadow:0 0 6px rgba(0,0,0,1),0 1px 2px rgba(0,0,0,1); }
            #aw-np-spacer { flex:1; }

            #aw-np-vol-group { position:relative;display:flex;align-items:center; }
            #aw-np-vol-popup { position:absolute;bottom:100%;left:50%;transform:translateX(-50%);width:44px;height:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;transition:height .2s ease,padding .2s ease;padding:0; }
            #aw-np-vol-group:hover #aw-np-vol-popup, #aw-np-vol-group:focus-within #aw-np-vol-popup { height:148px;padding:10px 0 12px; }
            #aw-np-vol-popup::after { content:'';position:absolute;bottom:0;left:0;right:0;height:12px; }
            #aw-np-vol-pct { font-size:12px;font-weight:700;color:rgba(255,255,255,.9);width:32px;text-align:center;font-variant-numeric:tabular-nums;flex-shrink:0;display:block;text-shadow:0 0 6px rgba(0,0,0,1),0 1px 2px rgba(0,0,0,1); }
            #aw-np-vol { -webkit-appearance:none;appearance:none;width:4px;height:108px;border-radius:2px;background:rgba(255,255,255,.25);cursor:pointer;outline:none;writing-mode:vertical-lr;direction:rtl;filter:drop-shadow(0 0 4px rgba(0,0,0,.8)); }
            #aw-np-vol::-webkit-slider-thumb { -webkit-appearance:none;width:14px;height:14px;background:var(--np-accent,#fff);border-radius:50%;cursor:pointer;box-shadow:0 0 6px rgba(0,0,0,.7); }
            #aw-np-vol::-moz-range-thumb     { width:14px;height:14px;background:var(--np-accent,#fff);border:none;border-radius:50%;cursor:pointer;box-shadow:0 0 6px rgba(0,0,0,.7); }

            #aw-np-spinner { position:absolute;top:50%;left:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border:3px solid rgba(255,255,255,.15);border-top-color:var(--np-accent,#fff);border-radius:50%;animation:np-spin .7s linear infinite;pointer-events:none;display:none; }
            #aw-np-spinner.on { display:block; }
            @keyframes np-spin { to { transform:rotate(360deg); } }

            #aw-np-center { position:absolute;top:50%;left:50%;width:64px;height:64px;margin:-32px 0 0 -32px;background:rgba(0,0,0,.45);border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transform:scale(.8);transition:opacity .25s,transform .25s; }
            #aw-np-center.on { opacity:1;transform:scale(1); }
            #aw-np-center svg { fill:var(--np-accent,#fff);width:32px;height:32px; }

            #aw-np-vol-flash { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);border-radius:50%;width:64px;height:64px;pointer-events:none;opacity:0;transition:opacity .25s;z-index:12; }
            #aw-np-vol-flash.on { opacity:1; }
            #aw-np-vol-flash svg { fill:var(--np-accent,#fff);width:32px;height:32px;display:block; }

            #aw-np-settings-panel { position:absolute;bottom:calc(clamp(36px,5vh,52px) + 28px + 17px);right:8px;background:rgba(28,28,28,.97);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:12px 16px;min-width:220px;display:flex;flex-direction:column;gap:10px;font-size:13px;color:rgba(255,255,255,.9);z-index:10;opacity:0;transform:scale(.95);transform-origin:bottom right;pointer-events:none;transition:opacity .15s ease,transform .15s ease; }
            #aw-np-settings-panel.open { opacity:1;transform:scale(1);pointer-events:all; }

            .np-row-tip { position:absolute;top:50%;right:calc(100% + 16px);transform:translateY(-50%);background:rgba(15,15,15,.92);color:#fff;font-size:11px;padding:4px 8px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s ease;transition-delay:0s;z-index:20; }
            .np-row-tip::after { content:'';position:absolute;top:50%;left:100%;transform:translateY(-50%);border:4px solid transparent;border-left-color:rgba(15,15,15,.92); }
            [data-tip]:hover .np-row-tip { opacity:1;transition-delay:.5s; }

            .np-switch { position:relative;width:36px;height:20px;flex-shrink:0;cursor:pointer; }
            .np-switch input { opacity:0;width:0;height:0;position:absolute; }
            .np-switch-track { position:absolute;inset:0;border-radius:20px;background:rgba(255,255,255,.25);transition:background .2s; }
            .np-switch input:checked ~ .np-switch-track { background:var(--np-accent,#fff); }
            .np-switch-thumb { position:absolute;top:3px;left:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s,background .2s;box-shadow:0 1px 3px rgba(0,0,0,.4); }
            .np-switch input:checked ~ .np-switch-thumb { transform:translateX(16px); }
            .np-switch input:not(:checked) ~ .np-switch-thumb { background:rgba(255,255,255,.85); }

            .np-tip { position:absolute;bottom:calc(100% + 28px + 12px);left:50%;transform:translateX(-50%);background:rgba(15,15,15,.92);color:#fff;font-size:12px;font-weight:500;padding:5px 10px;border-radius:6px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s ease;transition-delay:0s;z-index:15; }
            .np-tip::after { content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:rgba(15,15,15,.92); }
            .np-btn:hover .np-tip { opacity:1;transition-delay:.3s; }
            #aw-np-bar > .np-btn:first-child .np-tip { left:0;transform:none; }
            #aw-np-bar > .np-btn:first-child .np-tip::after { left:calc(clamp(36px,4.5vh,52px)/2);transform:translateX(-50%); }
            #aw-np-bar > .np-btn:last-child .np-tip { left:auto;right:0;transform:none; }
            #aw-np-bar > .np-btn:last-child .np-tip::after { left:auto;right:calc(clamp(36px,4.5vh,52px)/2);transform:translateX(50%); }

            #aw-np-toast { position:absolute;top:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.55);color:var(--np-accent,rgba(255,255,255,.75));font-size:12px;font-weight:500;padding:6px 14px;border-radius:20px;pointer-events:none;white-space:nowrap;opacity:1;transition:opacity .5s ease;z-index:20; }
        `;
        document.head.appendChild(s);
    }

    // ── Icone SVG ─────────────────────────────────────────────────────────────
    const svg = p => `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${p}</svg>`;
    const IC = {
        play:     svg('<path d="M8 5v14l11-7z"/>'),
        pause:    svg('<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'),
        mute:     svg('<path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>'),
        vol:      svg('<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>'),
        fsOn:     svg('<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>'),
        fsOff:    svg('<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'),
        restart:  svg('<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>'),
        skip:     svg('<path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/><path d="M13 1v6l4-3z"/><line x1="13" y1="8" x2="13" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><line x1="13" y1="14" x2="16" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>'),
        undo:     svg('<g transform="scale(-1,1) translate(-24,0)"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/><path d="M13 1v6l4-3z"/><line x1="13" y1="8" x2="13" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><line x1="13" y1="14" x2="16" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></g>'),
        prev:     svg('<rect x="5" y="5" width="2.5" height="14"/><polygon points="19,5 9,12 19,19"/>'),
        next:     svg('<polygon points="5,5 15,12 5,19"/><rect x="16.5" y="5" width="2.5" height="14"/>'),
        settings: svg('<path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>'),
    };

    // ── Build player ──────────────────────────────────────────────────────────
    let cleanup = null;

    function buildPlayer(videoUrl) {
        const { vol, muted } = loadVol();

        const wrap    = mk('div',   'aw-np');
        const video   = mk('video', 'aw-np-video');
        const grad    = mk('div',   'aw-np-gradient');
        const gradTop = mk('div',   'aw-np-gradient-top');
        const spinner = mk('div',   'aw-np-spinner');
        const center  = mk('div',   'aw-np-center');
        const ctrls   = mk('div',   'aw-np-controls');

        // Ordine critico: autoplay e preload PRIMA di src
        video.autoplay     = false;
        video.preload      = 'metadata';
        video.src          = videoUrl;
        video.volume       = vol;
        video.muted        = muted;
        video.playbackRate = loadSpeed();
        center.innerHTML   = IC.play;

        // _play è l'unica via autorizzata per avviare la riproduzione
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
        volEl.addEventListener('mouseup', () => volEl.blur());
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
            showVolFlash();
        });

        // ── Time ──────────────────────────────────────────────────────────────
        const timeEl = mk('div', 'aw-np-time'); timeEl.textContent = '00:00 / 00:00';
        const spacer = mk('div', 'aw-np-spacer');

        // ── Pannello impostazioni ─────────────────────────────────────────────
        const settingsPanel = mk('div', 'aw-np-settings-panel');
        const BTN_CTRL_STYLE = 'background:rgba(255,255,255,.15);border:none;color:#fff;width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;';

        const mkSettingRow = (label, tip, on, onChange) => {
            const row = document.createElement('div');
            row.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;';
            row.dataset.tip = '1';
            const lbl = document.createElement('span'); lbl.textContent = label;
            const { label: sw, input: toggle } = mkSwitch(on);
            toggle.addEventListener('change', () => onChange(toggle.checked));
            row.addEventListener('click', () => { toggle.checked = !toggle.checked; toggle.dispatchEvent(new Event('change')); });
            sw.addEventListener('click', e => e.stopPropagation());
            row.append(lbl, sw, mkRowTip(tip));
            return { row, toggle };
        };

        const { row: resumeRow,   toggle: resumeToggle   } = mkSettingRow('Ripresa automatica',  'Riprende il video dall\'ultimo punto',                                    isResumeOn(),   v => lsSet(pKey(KEY_RESUME_ENABLE),   v ? '1' : '0'));
        const { row: autoEpRow,   toggle: autoEpToggle   } = mkSettingRow('Episodio automatico', 'Riapre l\'ultimo episodio visto di questa serie',                         isAutoEpOn(),   v => lsSet(pKey(KEY_AUTOEP_ENABLE),   v ? '1' : '0'));
        const { row: autoPlayRow, toggle: autoPlayToggle } = mkSettingRow('Autoplay',            'In fullscreen, il video parte in automatico al cambio episodio e all\'entrata', isAutoPlayOn(), v => lsSet(pKey(KEY_AUTOPLAY_ENABLE), v ? '1' : '0'));

        // Seek
        let seekSecs = loadSeekSecs();
        const seekRow = document.createElement('div'); seekRow.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;user-select:none;'; seekRow.dataset.tip = '1';
        const seekLabel = document.createElement('span'); seekLabel.textContent = 'Seek';
        const seekControls = document.createElement('div'); seekControls.style.cssText = 'display:flex;align-items:center;gap:6px;';
        const seekMinus = document.createElement('button'); seekMinus.textContent = '−'; seekMinus.style.cssText = BTN_CTRL_STYLE; seekMinus.tabIndex = -1;
        const seekPlus  = document.createElement('button'); seekPlus.textContent  = '+'; seekPlus.style.cssText  = BTN_CTRL_STYLE; seekPlus.tabIndex  = -1;
        const seekVal   = document.createElement('span');   seekVal.style.cssText = 'min-width:40px;text-align:center;font-weight:500;';
        const updateSeekVal = () => { seekVal.textContent = String(seekSecs).padStart(2,'0') + ' s'; };
        updateSeekVal();
        seekMinus.addEventListener('click', e => { e.stopPropagation(); if (seekSecs <= SEEK_MIN) return; seekSecs -= SEEK_STEP; lsSet(pKey(KEY_SEEK_SECS), String(seekSecs)); updateSeekVal(); });
        seekPlus.addEventListener('click',  e => { e.stopPropagation(); if (seekSecs >= SEEK_MAX) return; seekSecs += SEEK_STEP; lsSet(pKey(KEY_SEEK_SECS), String(seekSecs)); updateSeekVal(); });
        seekControls.append(seekMinus, seekVal, seekPlus);
        seekRow.append(seekLabel, seekControls, mkRowTip('Regolazione del tempo di avanzamento con le freccette'));

        // Speed
        let speedVal = loadSpeed();
        const speedRow = document.createElement('div'); speedRow.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;user-select:none;'; speedRow.dataset.tip = '1';
        const speedLabel = document.createElement('span'); speedLabel.textContent = 'Velocità';
        const speedControls = document.createElement('div'); speedControls.style.cssText = 'display:flex;align-items:center;gap:6px;';
        const speedMinus = document.createElement('button'); speedMinus.textContent = '−'; speedMinus.style.cssText = BTN_CTRL_STYLE; speedMinus.tabIndex = -1;
        const speedPlus  = document.createElement('button'); speedPlus.textContent  = '+'; speedPlus.style.cssText  = BTN_CTRL_STYLE; speedPlus.tabIndex  = -1;
        const speedValEl = document.createElement('span');   speedValEl.style.cssText = 'min-width:40px;text-align:center;font-weight:500;';
        const updateSpeedVal = () => { speedValEl.textContent = fmtSpeed(speedVal); if (video.readyState > 0) video.playbackRate = speedVal; };
        updateSpeedVal();
        speedMinus.addEventListener('click', e => { e.stopPropagation(); if (speedVal <= SPEED_MIN) return; speedVal = Math.round((speedVal - SPEED_STEP)*100)/100; lsSet(pKey(KEY_SPEED), String(speedVal)); updateSpeedVal(); });
        speedPlus.addEventListener('click',  e => { e.stopPropagation(); if (speedVal >= SPEED_MAX) return; speedVal = Math.round((speedVal + SPEED_STEP)*100)/100; lsSet(pKey(KEY_SPEED), String(speedVal)); updateSpeedVal(); });
        speedControls.append(speedMinus, speedValEl, speedPlus);
        speedRow.append(speedLabel, speedControls, mkRowTip('Regola la velocità di riproduzione dell\'episodio'));

        // Globale
        const globalRow = document.createElement('div'); globalRow.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;border-top:1px solid rgba(255,255,255,.12);padding-top:10px;margin-top:2px;'; globalRow.dataset.tip = '1';
        const globalLabel = document.createElement('span'); globalLabel.textContent = 'Globale';
        const { label: globalSw, input: globalToggle } = mkSwitch(isGlobalOn());
        globalToggle.addEventListener('change', () => {
            lsSet(KEY_GLOBAL, globalToggle.checked ? '1' : '0');
            resumeToggle.checked = isResumeOn(); autoEpToggle.checked = isAutoEpOn(); autoPlayToggle.checked = isAutoPlayOn();
            seekSecs = loadSeekSecs(); updateSeekVal(); speedVal = loadSpeed(); updateSpeedVal();
        });
        globalRow.addEventListener('click', () => { globalToggle.checked = !globalToggle.checked; globalToggle.dispatchEvent(new Event('change')); });
        globalSw.addEventListener('click', e => e.stopPropagation());
        globalRow.append(globalLabel, globalSw, mkRowTip('Le impostazioni si applicano a tutte le serie, disattiva per personalizzare ogni serie'));

        settingsPanel.append(resumeRow, autoEpRow, autoPlayRow, seekRow, speedRow, globalRow);

        // ── Barra controlli ───────────────────────────────────────────────────
        const bar = mk('div', 'aw-np-bar');
        bar.append(btnPlay, btnRestart, volGroup, timeEl, spacer, btnUndo, btnSkip, btnPrev, btnNext, btnSettings, btnFs);
        ctrls.append(seekWrap, bar);

        // ── Top bar ───────────────────────────────────────────────────────────
        const topBar   = mk('div', 'aw-np-top');
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
        brandEl.textContent  = `AW Better Player v${SCRIPT_VERSION}`;

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

        const customRow = document.createElement('div'); customRow.style.cssText = 'position:relative;display:flex;align-items:center;gap:8px;width:100%;'; customRow.dataset.tip = '1'; customRow.addEventListener('click', e => e.stopPropagation());
        const customLabel = document.createElement('span'); customLabel.textContent = 'Custom'; customLabel.style.cssText = 'font-size:13px;color:rgba(255,255,255,.9);flex-shrink:0;';
        customPreview.style.cssText = 'width:14px;height:14px;border-radius:50%;flex-shrink:0;border:1px solid rgba(255,255,255,.3);';
        customInput.type = 'text'; customInput.maxLength = 7; customInput.placeholder = '#ffffff'; customInput.spellcheck = false;
        customInput.style.cssText = 'background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:12px;padding:3px 6px;border-radius:4px;width:76px;outline:none;font-family:monospace;user-select:text;';
        customInput.addEventListener('input', () => { let v = customInput.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-fA-F]{6}$/i.test(v)) customPreview.style.background = v; });
        let _applyingCustom = false;
        customInput.addEventListener('blur',    () => { if (!_applyingCustom) applyCustomColor(); });
        customInput.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { _applyingCustom = true; applyCustomColor(); customInput.blur(); _applyingCustom = false; } if (e.key === 'Escape') { syncCustomInput(currentColor); customInput.blur(); } });
        customInput.addEventListener('click',   e => e.stopPropagation());
        customInput.addEventListener('focus',   () => customInput.select());
        customRow.append(customLabel, customPreview, customInput, mkRowTip('Scegli un colore HEX'));

        const iconColorRow = document.createElement('div'); iconColorRow.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;border-top:1px solid rgba(255,255,255,.12);padding-top:10px;'; iconColorRow.dataset.tip = '1';
        const iconColorLabel = document.createElement('span'); iconColorLabel.textContent = 'Icone colorate';
        const { label: iconColorSw, input: iconColorToggle } = mkSwitch(isIconColorOn());
        iconColorToggle.addEventListener('change', e => { e.stopPropagation(); lsSet(KEY_ICON_COLOR, iconColorToggle.checked ? '1' : '0'); wrap.classList.toggle('accent-icons', iconColorToggle.checked); });
        iconColorRow.addEventListener('click', () => { iconColorToggle.checked = !iconColorToggle.checked; iconColorToggle.dispatchEvent(new Event('change')); });
        iconColorSw.addEventListener('click', e => e.stopPropagation());
        iconColorRow.append(iconColorLabel, iconColorSw, mkRowTip('Attiva per colorare le icone del player'));

        const colorGlobalRow = document.createElement('div'); colorGlobalRow.id = 'aw-np-color-global'; colorGlobalRow.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,.12);padding-top:10px;cursor:pointer;'; colorGlobalRow.dataset.tip = '1';
        const colorGlobalLabel = document.createElement('span'); colorGlobalLabel.textContent = 'Globale';
        const { label: colorGlobalSw, input: colorGlobalToggle } = mkSwitch(isColorGlobalOn());
        colorGlobalToggle.addEventListener('change', e => { e.stopPropagation(); lsSet(KEY_COLOR_GLOBAL, colorGlobalToggle.checked ? '1' : '0'); currentColor = loadColor(); applyColor(currentColor, wrap, dotEl); syncCustomInput(currentColor); swatchWrap.querySelectorAll('.np-swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === currentColor)); });
        colorGlobalRow.addEventListener('click', () => { colorGlobalToggle.checked = !colorGlobalToggle.checked; colorGlobalToggle.dispatchEvent(new Event('change')); });
        colorGlobalSw.addEventListener('click', e => e.stopPropagation());
        colorGlobalRow.append(colorGlobalLabel, colorGlobalSw, mkRowTip('Le impostazioni colore si applicano a tutte le serie'));

        colorPanel.append(swatchWrap, customRow, iconColorRow, colorGlobalRow);
        if (isIconColorOn()) wrap.classList.add('accent-icons');

        dotEl.addEventListener('click',      e => { e.stopPropagation(); const was = colorPanel.classList.contains('open'); settingsPanel.classList.remove('open'); colorPanel.classList.toggle('open', !was); });
        colorPanel.addEventListener('click', e => e.stopPropagation());
        btnSettings.addEventListener('click', e => { e.stopPropagation(); const was = settingsPanel.classList.contains('open'); colorPanel.classList.remove('open'); settingsPanel.classList.toggle('open', !was); });
        settingsPanel.addEventListener('click', e => e.stopPropagation());
        wrap.addEventListener('click', () => { settingsPanel.classList.remove('open'); colorPanel.classList.remove('open'); });

        wrap.append(video, grad, gradTop, topBar, colorPanel, spinner, center, settingsPanel, ctrls);

        // ── Volume flash ──────────────────────────────────────────────────────
        const volFlash    = mk('div', 'aw-np-vol-flash');
        const volFlashIco = mk('div', 'aw-np-vol-flash-icon');
        volFlash.appendChild(volFlashIco);
        wrap.appendChild(volFlash);
        let volFlashTimer = null;
        const showVolFlash = () => { volFlashIco.innerHTML = (video.muted || video.volume === 0) ? IC.mute : IC.vol; volFlash.classList.add('on'); clearTimeout(volFlashTimer); volFlashTimer = setTimeout(() => volFlash.classList.remove('on'), 400); };

        applyColor(currentColor, wrap, dotEl);

        // ── UI show/hide ──────────────────────────────────────────────────────
        let hideTimer = null;
        const showUi = () => { wrap.classList.add('ui'); clearTimeout(hideTimer); if (!video.paused) hideTimer = setTimeout(() => wrap.classList.remove('ui'), HIDE_DELAY_MS); };
        wrap.addEventListener('mousemove',  showUi);
        wrap.addEventListener('mouseleave', () => { if (!video.paused) wrap.classList.remove('ui'); });
        video.addEventListener('pause', () => { wrap.classList.add('ui'); clearTimeout(hideTimer); });
        video.addEventListener('play',  showUi);

        // ── Flash centrale ────────────────────────────────────────────────────
        let cTimer = null;
        const flash = html => { center.innerHTML = html; center.classList.add('on'); clearTimeout(cTimer); cTimer = setTimeout(() => center.classList.remove('on'), 700); };

        // ── Toggle play/pause ─────────────────────────────────────────────────
        let skipFlash = false;
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
        btnPrev.addEventListener('click',    () => { const t = getAdjacentEpisode('prev'); if (t) loadEpisode(t.dataset.id); });
        btnNext.addEventListener('click',    () => { const t = getAdjacentEpisode('next'); if (t) loadEpisode(t.dataset.id); });
        btnFs.addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen?.().catch(()=>{}));

        // ── Spinner ───────────────────────────────────────────────────────────
        video.addEventListener('waiting', () => spinner.classList.add('on'));
        video.addEventListener('playing', () => spinner.classList.remove('on'));
        video.addEventListener('canplay', () => spinner.classList.remove('on'));

        // ── Seek bar interazione ──────────────────────────────────────────────
        let seeking = false;
        const applySeek = e => { const r = seekTrack.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); if (video.duration) video.currentTime = p * video.duration; };
        seekWrap.addEventListener('mousedown', e => { seeking = true; applySeek(e); e.preventDefault(); });
        seekWrap.addEventListener('mousemove', e => {
            if (seeking) applySeek(e);
            const r = seekTrack.getBoundingClientRect();
            const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
            seekTip.textContent = fmt(p * (video.duration || 0));
            seekTip.style.left  = (p * 100) + '%';
            seekTip.style.visibility = 'visible';
        });
        seekWrap.addEventListener('mouseleave', () => { seekTip.style.visibility = 'hidden'; });
        document.addEventListener('mouseup', () => { seeking = false; });

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

        // Resume su loadedmetadata — seek only, nessun play()
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
        // REGOLA UNICA: isAutoPlayOn() controlla TUTTO il play automatico.
        // - Entrata in fullscreen → play se flag ON + video in pausa + episodio non terminato
        // - Windowed → MAI play automatico (né qui né altrove in buildPlayer)
        // - swapVideoSrc → play se flag ON (vedi swapVideoSrc)
        const onFs = () => {
            const isFs = !!document.fullscreenElement;
            setIcon(icoFs, isFs ? IC.fsOff : IC.fsOn);
            setTip(btnFs, isFs ? 'Esci (F)' : 'Fullscreen (F)');
            if (isFs && isAutoPlayOn() && video.paused && !episodeEnded) _play();
        };

        // ── Tastiera ──────────────────────────────────────────────────────────
        const onKey = e => {
            const tag = document.activeElement?.tagName ?? '', editable = document.activeElement?.isContentEditable;
            if (/INPUT|TEXTAREA/.test(tag) || editable) return;
            if (e.key === ' ')          { e.preventDefault(); toggle(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration||0, video.currentTime + seekSecs); }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - seekSecs); }
            if (e.key === 'ArrowUp')    { e.preventDefault(); video.volume = Math.min(1, video.volume+.1); video.muted = false; lastNonZeroVol = video.volume; volEl.value = Math.round(video.volume*100); saveVol(video.volume, false); updateMuteState(); updateVolUi(); showVolFlash(); }
            if (e.key === 'ArrowDown')  { e.preventDefault(); video.volume = Math.max(0, video.volume-.1); video.muted = video.volume===0; if (video.volume>0) lastNonZeroVol = video.volume; volEl.value = Math.round(video.volume*100); saveVol(video.muted ? lastNonZeroVol : video.volume, video.muted); updateMuteState(); updateVolUi(); showVolFlash(); }
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
            const iconOn = isIconColorOn(); wrap.classList.toggle('accent-icons', iconOn); iconColorToggle.checked = iconOn; colorGlobalToggle.checked = isColorGlobalOn();
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

        // Metodi esposti per swapVideoSrc
        wrap._play          = () => _play();
        wrap._showResumeTst = s  => showResumeToast(s);
        wrap._setSkipFlash  = v  => { skipFlash = v; };

        return wrap;
    }

    // ── Mount (windowed) ──────────────────────────────────────────────────────
    // Crea sempre un player nuovo. Non chiama mai play() automaticamente.
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
    // Chiamata solo quando si è già in fullscreen e si cambia episodio.
    // REGOLA: play automatico SOLO se il flag autoplay è ON.
    function swapVideoSrc(url) {
        const video = document.querySelector('#aw-np-video');
        if (!video) { mountPlayer(url); return; }
        if (video.getAttribute('src') === url) return;

        const wrap = document.querySelector('#aw-np');
        wrap?._setSkipFlash(true);
        video.pause();
        video.src = url;

        video.addEventListener('loadedmetadata', () => {
            // Velocità
            const spd = loadSpeed();
            if (video.playbackRate !== spd) video.playbackRate = spd;

            // Resume: seek only, MAI play()
            if (isResumeOn()) {
                const saved = parseFloat(lsGet(resumeKey()) ?? '');
                if (saved >= RESUME_MIN_POS && isFinite(video.duration) && video.duration - saved >= RESUME_END_GAP) {
                    video.currentTime = saved;
                    wrap?._showResumeTst(saved);
                }
            }

            // Autoplay: SOLO se flag ON
            if (isAutoPlayOn()) {
                wrap?._play();
                video.addEventListener('playing', () => wrap?._setSkipFlash(false), { once: true });
            } else {
                wrap?._setSkipFlash(false);
            }
        }, { once: true });

        // Reset UI
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
    // Flusso token garantito (nessuna race condition con il save timer):
    //   1. _stopSavingFn()         → ferma il timer, nessuna scrittura futura
    //   2. saveResumePos()         → salva con _activeToken (vecchio ep)
    //   3. _activeToken = token    → aggiorna al nuovo ep
    //   4. fetch → swapVideoSrc / mountPlayer → resume legge _activeToken ✓
    function loadEpisode(token) {
        if (!token) return;

        // 1. Ferma il timer immediatamente (PRIMA di cambiare token)
        if (_stopSavingFn) { _stopSavingFn(); _stopSavingFn = null; }

        // 2. Salva posizione del vecchio episodio
        const vid = document.querySelector('#aw-np-video');
        if (vid && _activeToken) saveResumePos(vid.currentTime);

        // 3. Aggiorna token e UI
        _activeToken = token;
        saveLastEpisode(token);
        setActiveEpisode(token);

        // 4. Fetch e mount
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
